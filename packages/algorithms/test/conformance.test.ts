import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANGUAGES, listAlgorithms, type LanguageId } from "../src";
import { contentRoot, readVectors } from "./helpers";

/**
 * Behavioural conformance: the code shown to learners (markers stripped) is compiled with a real
 * toolchain and run against the shared vectors; output must equal the reference results.
 * Missing toolchains skip the test locally, but REQUIRE_TOOLCHAINS=1 (CI) turns that into failure.
 */
const REQUIRE = process.env.REQUIRE_TOOLCHAINS === "1";

const probe: Record<LanguageId, [string, string[]][]> = {
  java: [["javac", ["-version"]], ["java", ["-version"]]],
  python: [["python3", ["--version"]]],
  cpp: [["g++", ["--version"]]],
  c: [["gcc", ["--version"]]],
};
const available = (lang: LanguageId) => probe[lang].every(([cmd, args]) => spawnSync(cmd, args).status === 0);

const harnessFile: Record<LanguageId, string> = { java: "Main.java", python: "main.py", cpp: "main.cpp", c: "main.c" };

function sh(cmd: string, args: string[], cwd: string, input?: string) {
  const r = spawnSync(cmd, args, { cwd, input, encoding: "utf8", timeout: 90_000 });
  // Some JVM setups print "Picked up JAVA_TOOL_OPTIONS" on stderr; that is not a compiler diagnostic.
  const stderr = (r.stderr ?? "")
    .split("\n")
    .filter((l) => !l.startsWith("Picked up "))
    .join("\n");
  return { status: r.status, stdout: r.stdout ?? "", stderr };
}

for (const entry of listAlgorithms()) {
  const vectors = readVectors(entry.id);
  const io = entry.content.meta.io;
  const kinds = Object.fromEntries(entry.content.meta.inputs.map((spec) => [spec.name, spec.kind]));
  const enc = (x: unknown, kind?: string): string[] => {
    if (typeof x === "string") return [String(x.length), ...[...x].map((ch) => String(ch.charCodeAt(0)))];
    if (kind === "grid") {
      const rows = x as number[][];
      return [String(rows.length), String(rows.length > 0 ? rows[0]!.length : 0), ...rows.flat().map(String)];
    }
    return Array.isArray(x) ? [String(x.length), ...x.map(String)] : [String(x)];
  };
  const stdin =
    `${vectors.length}\n` +
    vectors
      .map((v) => io.inputs.flatMap((name) => enc((v.input as Record<string, unknown>)[name], kinds[name])).join(" "))
      .join("\n") +
    "\n";
  const expected = vectors.map((v) => (io.output === "int" ? String(v.expected) : enc(v.expected).join(" ")));

  describe(`${entry.id}: conformance in real toolchains`, () => {
    for (const lang of LANGUAGES) {
      const ok = available(lang.id);
      if (!ok && REQUIRE) {
        it(`${lang.label}: toolchain is installed (REQUIRE_TOOLCHAINS=1)`, () => {
          throw new Error(`${lang.label} toolchain missing`);
        });
        continue;
      }
      it.skipIf(!ok)(`${lang.label}: displayed code compiles and matches every vector`, { timeout: 120_000 }, () => {
        const dir = mkdtempSync(join(tmpdir(), `av-${entry.id}-${lang.id}-`));
        try {
          const solutionName = lang.id === "java" ? "Solution.java" : `solution.${lang.extension}`;
          writeFileSync(join(dir, solutionName), entry.content.code[lang.id].lines.join("\n") + "\n");
          const harness = harnessFile[lang.id];
          copyFileSync(join(contentRoot, entry.id, "harness", harness), join(dir, harness));

          let run: ReturnType<typeof sh>;
          if (lang.id === "java") {
            const c = sh("javac", ["-Xlint:all,-auxiliaryclass", "-Werror", "-d", "out", "Main.java", "Solution.java"], dir);
            expect(c.stderr, "javac").toBe("");
            run = sh("java", ["-cp", "out", "Main"], dir, stdin);
          } else if (lang.id === "python") {
            run = sh("python3", ["-B", "main.py"], dir, stdin);
          } else if (lang.id === "cpp") {
            const c = sh("g++", ["-std=c++17", "-Wall", "-Wextra", "-Werror", "-o", "prog", "main.cpp"], dir);
            expect(c.stderr, "g++").toBe("");
            run = sh("./prog", [], dir, stdin);
          } else {
            const c = sh("gcc", ["-std=c11", "-Wall", "-Wextra", "-Werror", "-o", "prog", "main.c"], dir);
            expect(c.stderr, "gcc").toBe("");
            run = sh("./prog", [], dir, stdin);
          }
          expect(run.status, run.stderr).toBe(0);
          expect(run.stdout.trim().split("\n")).toEqual(expected);
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      });
    }
  });
}
