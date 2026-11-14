#!/usr/bin/env node
/**
 * Content compiler.
 *
 * For every packages/algorithms/content/<id>/ it reads algorithm.json and the four solution files,
 * extracts `@a <anchor>` marker comments into per-language line maps, strips the markers from the
 * displayed source, and writes packages/algorithms/src/generated/content.ts.
 *
 * Rules enforced (build fails otherwise):
 *  - algorithm.json has the required fields and id matches its directory
 *  - every declared anchor appears in every language, and no undeclared anchor appears
 *  - markers use the language's own comment token and sit at the end of a code line
 *
 * `--check` regenerates in memory and fails if the file on disk is missing or stale.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = join(root, "packages/algorithms");
const contentDir = join(pkg, "content");
const outFile = join(pkg, "src/generated/content.ts");
const practiceFile = join(pkg, "src/generated/codepractice.ts");
const languages = JSON.parse(readFileSync(join(pkg, "languages.json"), "utf8"));

const ANCHOR_ID = /^[a-z][a-z0-9-]*$/;
const REQUIRED_META = ["id", "title", "category", "wave", "stateKind", "difficulty", "summary", "complexity", "defaultInput", "inputs", "io", "anchors"];
const errors = [];
const fail = (msg) => errors.push(msg);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractCode(id, language, source) {
  const marker = new RegExp(`\\s*${escapeRegex(language.comment)}\\s*@a\\s+(\\S+)\\s*$`);
  const where = `${id}/solution.${language.extension}`;
  const rawLines = source.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const lines = [];
  const anchors = {};
  rawLines.forEach((raw, i) => {
    const m = marker.exec(raw);
    let text = raw;
    if (m) {
      const anchor = m[1];
      if (!ANCHOR_ID.test(anchor)) fail(`${where}:${i + 1} invalid anchor id "${anchor}"`);
      text = raw.slice(0, m.index).replace(/\s+$/, "");
      if (text.trim() === "") fail(`${where}:${i + 1} marker on an otherwise empty line`);
      const lineNo = i + 1;
      const ranges = (anchors[anchor] ??= []);
      const last = ranges[ranges.length - 1];
      if (last && last.end === lineNo - 1) last.end = lineNo;
      else ranges.push({ start: lineNo, end: lineNo });
    } else if (raw.includes("@a ")) {
      fail(`${where}:${i + 1} looks like a marker but is not "${language.comment} @a <id>" at end of line`);
    }
    lines.push(text.replace(/\s+$/, ""));
  });
  if (lines.length === 0) fail(`${where} is empty`);
  return { language: language.id, lines, anchors };
}

function compileAlgorithm(dir) {
  const base = join(contentDir, dir);
  const metaPath = join(base, "algorithm.json");
  if (!existsSync(metaPath)) return fail(`${dir}: missing algorithm.json`), null;
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  for (const key of REQUIRED_META) if (!(key in meta)) fail(`${dir}/algorithm.json: missing "${key}"`);
  if (meta.id !== dir) fail(`${dir}/algorithm.json: id "${meta.id}" must equal directory name`);
  const inputNames = new Set((meta.inputs ?? []).map((i) => i.name));
  if (!Array.isArray(meta.io?.inputs) || !meta.io.inputs.every((n) => inputNames.has(n))) {
    fail(`${dir}/algorithm.json: io.inputs must name declared inputs`);
  }
  if (!["int", "intList"].includes(meta.io?.output)) fail(`${dir}/algorithm.json: io.output must be "int" or "intList"`);
  const declared = new Set();
  for (const a of meta.anchors ?? []) {
    if (!ANCHOR_ID.test(a.id ?? "")) fail(`${dir}: invalid declared anchor "${a.id}"`);
    if (declared.has(a.id)) fail(`${dir}: duplicate declared anchor "${a.id}"`);
    declared.add(a.id);
  }

  const code = {};
  for (const language of languages) {
    const file = join(base, `solution.${language.extension}`);
    if (!existsSync(file)) {
      fail(`${dir}: missing solution.${language.extension}`);
      continue;
    }
    const extracted = extractCode(dir, language, readFileSync(file, "utf8"));
    for (const id of declared) {
      if (!extracted.anchors[id]) fail(`${dir}/solution.${language.extension}: declared anchor "${id}" not found`);
    }
    for (const id of Object.keys(extracted.anchors)) {
      if (!declared.has(id)) fail(`${dir}/solution.${language.extension}: undeclared anchor "${id}"`);
    }
    code[language.id] = extracted;
  }
  return { meta, code, practice: practiceEntry(dir, meta, base) };
}

/** What the in-browser practice page needs: the Python entry function (name and parameters) and the test vectors as call arguments. */
function practiceEntry(dir, meta, base) {
  if (meta.practice) {
    if (!/^[a-z][a-z0-9_]*$/.test(meta.practice.fn ?? "")) fail(`${dir}/algorithm.json: practice.fn must be a snake_case name`);
    const ad = meta.practice.adapter;
    if (ad && !["list", "tree"].includes(ad)) fail(`${dir}/algorithm.json: practice.adapter must be "list" or "tree"`);
    const names = [...(meta.io?.inputs ?? [])];
    if (ad && names.length > 0) names[0] = ad === "list" ? "head" : "root";
    return { fn: meta.practice.fn, params: names, ...(ad ? { adapter: ad } : {}), ...(meta.practice.note ? { note: meta.practice.note } : {}), vectors: practiceVectors(meta, base) };
  }
  const py = readFileSync(join(base, "solution.py"), "utf8").split("\n").find((line) => /#\s*@a\s+entry\s*$/.test(line)) ?? "";
  const def = /def\s+(\w+)\s*\(([^)]*)\)/.exec(py);
  if (!def) return fail(`${dir}/solution.py: the "entry" line must be a def with parameters`), null;
  const params = def[2].split(",").map((p) => p.trim()).filter(Boolean);
  if (params.length !== (meta.io?.inputs ?? []).length) fail(`${dir}/solution.py: entry takes ${params.length} parameter(s) but io.inputs has ${(meta.io?.inputs ?? []).length}`);
  const vectors = practiceVectors(meta, base);
  return { fn: def[1], params, vectors };
}

function render(entries) {
  const body = entries
    .map(({ meta, code }) => `  ${JSON.stringify(meta.id)}: ${JSON.stringify({ meta, code }, null, 2).replace(/\n/g, "\n  ")},`)
    .join("\n");
  return `// GENERATED by tools/content-compiler/compile.mjs - do not edit.
import type { AlgorithmContent } from "../content-types";

export const generatedContent: Readonly<Record<string, AlgorithmContent>> = {
${body}
};
`;
}

const dirs = readdirSync(contentDir).filter((d) => statSync(join(contentDir, d)).isDirectory()).sort();
const entries = dirs.map(compileAlgorithm).filter(Boolean);

if (errors.length > 0) {
  console.error(`content-compiler: ${errors.length} problem(s)\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

function practiceVectors(meta, base) {
  const vectorsPath = join(base, "vectors.json");
  if (!existsSync(vectorsPath)) return fail(`${meta.id}: missing vectors.json`), [];
  return JSON.parse(readFileSync(vectorsPath, "utf8")).map((v) => ({
    name: v.name,
    args: (meta.io?.inputs ?? []).map((n) => v.input[n]),
    expected: v.expected,
  }));
}

function renderPractice(list) {
  const body = list.map(({ meta, practice }) => `  ${JSON.stringify(meta.id)}: ${JSON.stringify(practice)},`).join("\n");
  return `// GENERATED by tools/content-compiler/compile.mjs - do not edit.
// Test vectors and the Python entry signature for the in-browser practice page. Import it only from that page so it stays out of other bundles.
import type { PracticeData } from "../codepractice";

export const practiceData: Readonly<Record<string, PracticeData>> = {
${body}
};
`;
}

const output = render(entries);
const practiceOutput = renderPractice(entries);
if (process.argv.includes("--check")) {
  if (!existsSync(outFile) || readFileSync(outFile, "utf8") !== output || !existsSync(practiceFile) || readFileSync(practiceFile, "utf8") !== practiceOutput) {
    console.error("content-compiler: generated content is missing or stale; run `pnpm build:content`");
    process.exit(1);
  }
  console.log(`content-compiler: up to date (${entries.length} algorithm(s))`);
} else {
  mkdirSync(dirname(outFile), { recursive: true });
  if (!existsSync(outFile) || readFileSync(outFile, "utf8") !== output) writeFileSync(outFile, output);
  if (!existsSync(practiceFile) || readFileSync(practiceFile, "utf8") !== practiceOutput) writeFileSync(practiceFile, practiceOutput);
  console.log(`content-compiler: ${entries.length} algorithm(s) x ${languages.length} languages OK`);
}
