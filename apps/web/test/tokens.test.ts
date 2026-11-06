import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/app/globals.css"), "utf8");

function block(selectorStart: string): Record<string, string> {
  const start = css.indexOf(selectorStart);
  const open = css.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  const vars: Record<string, string> = {};
  for (const m of css.slice(open, end).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) vars[m[1]!] = m[2]!;
  return vars;
}

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const themes = { light: block(":root {"), dark: block(':root[data-theme="dark"]') };
const roles = ["active", "created", "pointer", "compared", "found", "swapped", "visited", "sorted", "window"];

describe.each(Object.entries(themes))("%s theme contrast (WCAG AA)", (_name, t) => {
  const pairs: [string, string, number][] = [
    ["text", "bg", 4.5],
    ["text", "surface", 4.5],
    ["text", "surface-2", 4.5],
    ["muted", "bg", 4.5],
    ["muted", "surface", 4.5],
    ["muted", "surface-2", 4.5],
    ["accent-text", "accent", 4.5],
    ["danger", "surface", 4.5],
    ["success", "surface", 4.5],
    ["text", "code-bg", 4.5],
    ["text", "code-active-bg", 4.5],
    ["tok-keyword", "code-bg", 4.5],
    ["tok-type", "code-bg", 4.5],
    ["tok-string", "code-bg", 4.5],
    ["tok-number", "code-bg", 4.5],
    ["tok-comment", "code-bg", 4.5],
    ["tok-preproc", "code-bg", 4.5],
    ["tok-keyword", "code-active-bg", 4.5],
    ["tok-comment", "code-active-bg", 4.5],
    ["border", "surface", 1.2],
    ["focus", "bg", 3],
    ["code-active-bar", "code-bg", 3],
  ];
  for (const [fg, bg, min] of pairs) {
    it(`${fg} on ${bg} >= ${min}`, () => {
      expect(t[fg], `missing --${fg}`).toBeDefined();
      expect(t[bg], `missing --${bg}`).toBeDefined();
      expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min);
    });
  }
  for (const role of roles) {
    it(`role ${role}: text on fill >= 4.5, stroke vs surface >= 3`, () => {
      expect(ratio(t.text!, t[`role-${role}-fill`]!)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t[`role-${role}-stroke`]!, t.surface!)).toBeGreaterThanOrEqual(3);
    });
  }
});
