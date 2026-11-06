import type { LanguageId } from "@algovision/algorithms";

export type TokenKind = "keyword" | "type" | "string" | "number" | "comment" | "preproc" | "plain";
export interface Token {
  readonly text: string;
  readonly kind: TokenKind;
}

const set = (words: string) => new Set(words.split(/\s+/).filter(Boolean));

const KEYWORDS: Record<LanguageId, Set<string>> = {
  java: set("class new return this null void if else for while int public private static final"),
  python: set("class def return None self if else elif for while in not and or is import from pass True False"),
  cpp: set("class struct new return nullptr void if else for while public private explicit int const"),
  c: set("struct typedef return void if else for while int NULL const"),
};
const TYPES: Record<LanguageId, Set<string>> = {
  java: set("Node LinkedList String"),
  python: set("Node LinkedList"),
  cpp: set("Node LinkedList"),
  c: set("Node"),
};
const COMMENT: Record<LanguageId, string> = { java: "//", python: "#", cpp: "//", c: "//" };

/** Single-line tokenizer: enough for the code shown in lessons, with no dependency. */
export function tokenize(line: string, language: LanguageId): Token[] {
  const tokens: Token[] = [];
  const push = (text: string, kind: TokenKind) => {
    if (text === "") return;
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind && kind === "plain") tokens[tokens.length - 1] = { text: last.text + text, kind };
    else tokens.push({ text, kind });
  };
  if (language !== "java" && language !== "python" && /^\s*#/.test(line)) return [{ text: line, kind: "preproc" }];

  let i = 0;
  const comment = COMMENT[language];
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest.startsWith(comment)) {
      push(rest, "comment");
      break;
    }
    const ch = line[i]!;
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== ch) j += line[j] === "\\" ? 2 : 1;
      push(line.slice(i, j + 1), "string");
      i = j + 1;
      continue;
    }
    const num = /^\d+(\.\d+)?/.exec(rest);
    if (num && !/[A-Za-z_]/.test(line[i - 1] ?? "")) {
      push(num[0], "number");
      i += num[0].length;
      continue;
    }
    const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (word) {
      const w = word[0];
      push(w, KEYWORDS[language].has(w) ? "keyword" : TYPES[language].has(w) ? "type" : "plain");
      i += w.length;
      continue;
    }
    push(ch, "plain");
    i += 1;
  }
  return tokens;
}
