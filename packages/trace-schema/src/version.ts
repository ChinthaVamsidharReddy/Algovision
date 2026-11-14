/**
 * Trace schema version (semver).
 *
 * - Adding an optional field, a new event type or a new state kind is a MINOR change.
 * - Renaming, removing or changing the meaning of a field is a MAJOR change and must
 *   ship with a migration from the previous major (see docs/EXECUTION_TRACE_SCHEMA.md).
 */
export const TRACE_SCHEMA_VERSION = "1.4.0";

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemver(value: string): SemVer | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/**
 * The engine accepts traces of the current major version whose minor is not newer than
 * the one this build understands. A newer minor could carry fields we would silently drop.
 */
export function isSupportedSchemaVersion(value: string): boolean {
  const candidate = parseSemver(value);
  const current = parseSemver(TRACE_SCHEMA_VERSION);
  if (!candidate || !current) return false;
  return candidate.major === current.major && candidate.minor <= current.minor;
}
