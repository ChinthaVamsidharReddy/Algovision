#!/usr/bin/env node
/**
 * Copies the Pyodide runtime (the `pyodide` npm package) into public/pyodide so the practice page serves Python from this site:
 * no CDN, no third-party request, and the same files in development, tests and production. The copy is git-ignored.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pyodide/package.json"));
const target = join(here, "../public/pyodide");
const FILES = ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];

mkdirSync(target, { recursive: true });
for (const file of FILES) {
  const from = join(source, file);
  if (!existsSync(from)) {
    console.error(`copy-pyodide: ${file} is missing from the pyodide package`);
    process.exit(1);
  }
  copyFileSync(from, join(target, file));
}
console.log(`copy-pyodide: ${FILES.length} files, pyodide ${JSON.parse(readFileSync(join(source, "package.json"), "utf8")).version}`);
