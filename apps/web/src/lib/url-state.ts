import { isLanguageId, DEFAULT_LANGUAGE, resolveLimits, type LanguageId, type LimitProfile } from "@algovision/algorithms";
import { SPEEDS, type Speed } from "@algovision/viz-engine";

/** Query keys owned by the app; algorithm input names must not reuse them (checked in tests). */
export const RESERVED_KEYS = ["lang", "step", "speed", "limits"] as const;

export interface UrlState {
  readonly language: LanguageId;
  /** 0-based. */
  readonly step: number;
  readonly speed: Speed;
  /** Raw text for each requested input name that was present in the URL. */
  readonly inputs: Readonly<Record<string, string>>;
  readonly limits: LimitProfile;
}

type Params = { get(name: string): string | null };

function toStep(raw: string | null): number {
  if (raw === null || !/^\d{1,6}$/.test(raw)) return 0;
  return Math.max(0, Number(raw) - 1); // URLs are 1-based, like "Step 3 of 5"
}

function toSpeed(raw: string | null): Speed {
  const n = Number(raw);
  return (SPEEDS as readonly number[]).includes(n) ? (n as Speed) : 1;
}

/** Everything in the URL is untrusted; anything invalid silently falls back to a default. */
export function parseUrlState(params: Params, inputNames: readonly string[], envProfile?: string | null): UrlState {
  const lang = params.get("lang");
  const inputs: Record<string, string> = {};
  for (const name of inputNames) {
    const v = params.get(name);
    if (v !== null) inputs[name] = v.slice(0, 500);
  }
  return {
    language: isLanguageId(lang) ? lang : DEFAULT_LANGUAGE,
    step: toStep(params.get("step")),
    speed: toSpeed(params.get("speed")),
    inputs,
    limits: resolveLimits(params.get("limits") ?? envProfile),
  };
}

export interface UrlStateInput {
  readonly language: LanguageId;
  readonly step: number;
  readonly speed: Speed;
  readonly inputs: Readonly<Record<string, string>>;
  readonly isDefaultInput: boolean;
  readonly limitsId: string;
  readonly envLimitsId: string;
}

/** Builds a query string; defaults are omitted so shared links stay short. */
export function serializeUrlState(s: UrlStateInput): string {
  const q = new URLSearchParams();
  if (s.language !== DEFAULT_LANGUAGE) q.set("lang", s.language);
  if (s.step > 0) q.set("step", String(s.step + 1));
  if (s.speed !== 1) q.set("speed", String(s.speed));
  if (!s.isDefaultInput) for (const [k, v] of Object.entries(s.inputs)) q.set(k, v.replace(/\s+/g, ""));
  if (s.limitsId !== s.envLimitsId) q.set("limits", s.limitsId);
  return q.toString();
}
