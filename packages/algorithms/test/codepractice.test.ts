import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listAlgorithms, LIMIT_PROFILES, outputsEqual, practiceFunctionName, practiceParams, previewValue, runAlgorithm, starterCode } from "../src";
import { practiceData } from "../src/generated/codepractice";
import { contentRoot } from "./helpers";

const prelude = readFileSync(join(__dirname, "../../../apps/web/public/practice/prelude.py"), "utf8");
const wrappers = readFileSync(join(__dirname, "practice-wrappers.py"), "utf8");

describe("practice data (generated for the in-browser practice page)", () => {
  it("exists for every algorithm, with at least 5 tests and one argument per declared input", () => {
    for (const { id, content } of listAlgorithms()) {
      const d = practiceData[id];
      expect(d, id).toBeDefined();
      expect(d!.vectors.length, id).toBeGreaterThanOrEqual(5);
      expect(d!.params.length, id).toBe(content.meta.io.inputs.length);
      for (const v of d!.vectors) expect(v.args.length, `${id}/${v.name}`).toBe(content.meta.io.inputs.length);
      expect(new Set(d!.vectors.map((v) => v.name)).size, `${id} test names are unique`).toBe(d!.vectors.length);
      expect(d!.fn).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("every expected value is what the visualizer's own executor returns", () => {
    for (const { id, content } of listAlgorithms()) {
      for (const v of practiceData[id]!.vectors) {
        const input = Object.fromEntries(content.meta.io.inputs.map((name, i) => [name, v.args[i]]));
        const run = runAlgorithm(id, input, LIMIT_PROFILES.standard);
        expect(run.ok, `${id}/${v.name}`).toBe(true);
        if (run.ok) expect(outputsEqual(v.expected, run.trace.summary.result), `${id}/${v.name}`).toBe(true);
      }
    }
  });

  it("the Python reference solutions (or the practice-wrappers versions for algorithms with a practice override) pass every test through the page's own prelude", () => {
    const jobs = listAlgorithms().map(({ id, content }) => {
      const d = practiceData[id]!;
      const overridden = content.meta.practice !== undefined;
      const source = overridden ? wrappers : readFileSync(join(contentRoot, id, "solution.py"), "utf8");
      return { id, fn: d.fn, adapter: d.adapter ?? null, source, vectors: d.vectors };
    });
    const script = `
import json, sys
${prelude}
failures = []
for job in json.load(sys.stdin):
    try:
        fn = _av_define(job["source"], job["fn"])
        for v in job["vectors"]:
            got = json.loads(_av_call(fn, json.dumps(v["args"]), job["adapter"], isinstance(v["expected"], list)))
            if isinstance(got, bool):
                got = int(got)
            if got != v["expected"]:
                failures.append(job["id"] + "/" + v["name"] + ": expected " + json.dumps(v["expected"]) + " got " + json.dumps(got))
    except Exception as e:
        failures.append(job["id"] + ": " + repr(e))
print(json.dumps(failures))
`;
    const out = execFileSync("python3", ["-I", "-c", script], { input: JSON.stringify(jobs), maxBuffer: 1 << 26 }).toString();
    expect(JSON.parse(out)).toEqual([]);
  });

  it("starter code is valid JavaScript and Python and names the right function", () => {
    const python: string[] = [];
    for (const { id, content } of listAlgorithms()) {
      const d = practiceData[id]!;
      const js = starterCode(content.meta, d, "javascript");
      expect(() => new Function(js), id).not.toThrow();
      expect(js).toContain(`function ${practiceFunctionName(d, "javascript")}(${practiceParams(d, "javascript").join(", ")})`);
      const py = starterCode(content.meta, d, "python");
      expect(py).toContain(`def ${d.fn}(${d.params.join(", ")}):`);
      python.push(py);
    }
    const out = execFileSync("python3", ["-I", "-c", "import json,sys\nfor s in json.load(sys.stdin):\n    compile(s, 'starter', 'exec')\nprint('ok')"], { input: JSON.stringify(python) }).toString();
    expect(out.trim()).toBe("ok");
  });
});

describe("practice helpers", () => {
  it("converts snake_case to camelCase for JavaScript only", () => {
    const d = { fn: "longest_no_repeat", params: ["max_len", "s"], vectors: [] };
    expect(practiceFunctionName(d, "javascript")).toBe("longestNoRepeat");
    expect(practiceFunctionName(d, "python")).toBe("longest_no_repeat");
    expect(practiceParams(d, "javascript")).toEqual(["maxLen", "s"]);
  });
  it("compares outputs strictly by type, treating booleans as 0 or 1", () => {
    expect(outputsEqual(3, 3)).toBe(true);
    expect(outputsEqual(3, "3")).toBe(false);
    expect(outputsEqual(3, undefined)).toBe(false);
    expect(outputsEqual(1, true)).toBe(true);
    expect(outputsEqual(0, false)).toBe(true);
    expect(outputsEqual([1, 2], [1, 2])).toBe(true);
    expect(outputsEqual([1, 2], [2, 1])).toBe(false);
    expect(outputsEqual([1, 2], [1])).toBe(false);
    expect(outputsEqual([], [])).toBe(true);
    expect(outputsEqual([], 0)).toBe(false);
  });
  it("shortens long values for display", () => {
    expect(previewValue([1, 2, 3])).toBe("[1,2,3]");
    expect(previewValue("ab")).toBe('"ab"');
    expect(previewValue(undefined)).toBe("undefined");
    expect(previewValue("x".repeat(200), 20).length).toBe(20);
  });
});
