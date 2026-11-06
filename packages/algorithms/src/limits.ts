/**
 * Visualization limits are configuration, not constants buried in executors. Two profiles exist:
 * `standard` for normal devices and `lite` for low-end phones. Choosing a profile changes how
 * large an input the UI accepts and how long a trace may get; nothing else.
 */
export type LimitProfileId = "standard" | "lite";

export interface LimitProfile {
  readonly id: LimitProfileId;
  /** Hard cap on steps in a single trace (also enforced by the trace validator). */
  readonly maxSteps: number;
  /** Cap on the number of nodes a user may enter for a linked list. */
  readonly maxListNodes: number;
  /** Cap on the number of cells a user may enter for an array. */
  readonly maxArrayLength: number;
  /** Allowed magnitude of any integer input. */
  readonly maxAbsValue: number;
}

export const LIMIT_PROFILES: Readonly<Record<LimitProfileId, LimitProfile>> = {
  standard: { id: "standard", maxSteps: 2000, maxListNodes: 15, maxArrayLength: 15, maxAbsValue: 999 },
  lite: { id: "lite", maxSteps: 500, maxListNodes: 8, maxArrayLength: 8, maxAbsValue: 999 },
};

export const DEFAULT_LIMIT_PROFILE: LimitProfileId = "standard";

export function isLimitProfileId(value: unknown): value is LimitProfileId {
  return value === "standard" || value === "lite";
}

/** Unknown or missing names fall back to the default, so a bad env value never breaks the app. */
export function resolveLimits(profile?: string | null): LimitProfile {
  return isLimitProfileId(profile) ? LIMIT_PROFILES[profile] : LIMIT_PROFILES[DEFAULT_LIMIT_PROFILE];
}
