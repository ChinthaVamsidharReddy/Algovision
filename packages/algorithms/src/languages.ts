import languageList from "../languages.json";

export type LanguageId = "java" | "python" | "cpp" | "c";

export interface LanguageInfo {
  readonly id: LanguageId;
  readonly label: string;
  readonly extension: string;
  /** Line-comment token; also the token used by `@a` anchor markers. */
  readonly comment: string;
}

/** Single source of truth shared with the content compiler (languages.json). */
export const LANGUAGES = languageList as readonly LanguageInfo[];
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);
export const DEFAULT_LANGUAGE: LanguageId = "java";

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && (LANGUAGE_IDS as string[]).includes(value);
}
