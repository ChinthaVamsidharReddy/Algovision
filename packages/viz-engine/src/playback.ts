/**
 * Playback controller as a pure reducer.
 *
 * The reducer owns exactly one source of truth: which step of the (immutable) trace is shown.
 * Timers live outside, in a React effect, and only ever dispatch TICK carrying the epoch they
 * were scheduled in. Every action that should cancel a pending timer bumps the epoch, so a stale
 * TICK is ignored. That is what makes rapid Next / Pause / Speed clicks safe.
 */

export const SPEEDS = [0.5, 1, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

export const DEFAULT_STEP_INTERVAL_MS = 1000;

export type PlaybackStatus = "idle" | "playing" | "paused" | "finished";

export interface PlaybackState {
  readonly status: PlaybackStatus;
  /** Index of the step being shown, always within [0, total - 1]. */
  readonly index: number;
  /** Number of steps in the loaded trace, always at least 1. */
  readonly total: number;
  readonly speed: Speed;
  /** Incremented by every action that invalidates a scheduled tick. */
  readonly epoch: number;
}

export type PlaybackAction =
  | { type: "LOAD"; total: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "JUMP"; index: number }
  | { type: "RESET" }
  | { type: "REPLAY" }
  | { type: "SET_SPEED"; speed: Speed }
  | { type: "TICK"; epoch: number };

export function createPlaybackState(total: number, speed: Speed = 1): PlaybackState {
  return { status: "idle", index: 0, total: normalizeTotal(total), speed, epoch: 0 };
}

function normalizeTotal(total: number): number {
  return Number.isFinite(total) ? Math.max(1, Math.floor(total)) : 1;
}

const lastIndex = (state: PlaybackState): number => state.total - 1;

/** Position reached by a manual move: finished only when it lands on the last step. */
function settle(state: PlaybackState, index: number): PlaybackState {
  const clamped = Math.min(Math.max(index, 0), lastIndex(state));
  return {
    ...state,
    index: clamped,
    status: clamped === lastIndex(state) && state.total > 1 ? "finished" : "paused",
    epoch: state.epoch + 1,
  };
}

function startPlaying(state: PlaybackState, from: number): PlaybackState {
  if (from >= lastIndex(state)) {
    // A single-step trace (or already at the end) has nothing left to play.
    return { ...state, index: lastIndex(state), status: "finished", epoch: state.epoch + 1 };
  }
  return { ...state, index: from, status: "playing", epoch: state.epoch + 1 };
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case "LOAD":
      return {
        status: "idle",
        index: 0,
        total: normalizeTotal(action.total),
        speed: state.speed,
        epoch: state.epoch + 1,
      };

    case "PLAY":
      if (state.status === "playing") return state;
      // From the end, Play starts over rather than doing nothing.
      return startPlaying(state, state.status === "finished" ? 0 : state.index);

    case "PAUSE":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused", epoch: state.epoch + 1 };

    case "TOGGLE":
      return playbackReducer(state, { type: state.status === "playing" ? "PAUSE" : "PLAY" });

    case "NEXT":
      return settle(state, state.index + 1);

    case "PREV":
      return {
        ...state,
        index: Math.max(state.index - 1, 0),
        status: "paused",
        epoch: state.epoch + 1,
      };

    case "JUMP": {
      if (!Number.isFinite(action.index)) return state;
      return settle(state, Math.floor(action.index));
    }

    case "RESET":
      return { ...state, index: 0, status: "idle", epoch: state.epoch + 1 };

    case "REPLAY":
      return startPlaying(state, 0);

    case "SET_SPEED":
      if (!SPEEDS.includes(action.speed) || action.speed === state.speed) return state;
      return { ...state, speed: action.speed };

    case "TICK": {
      if (state.status !== "playing" || action.epoch !== state.epoch) return state;
      const next = state.index + 1;
      if (next >= lastIndex(state)) {
        return { ...state, index: lastIndex(state), status: "finished", epoch: state.epoch + 1 };
      }
      return { ...state, index: next };
    }
  }
}

/** Delay before the next automatic step. */
export function stepDelayMs(speed: Speed, baseMs: number = DEFAULT_STEP_INTERVAL_MS): number {
  return Math.round(baseMs / speed);
}

export const canGoPrev = (state: PlaybackState): boolean => state.index > 0;
export const canGoNext = (state: PlaybackState): boolean => state.index < lastIndex(state);
export const isPlaying = (state: PlaybackState): boolean => state.status === "playing";

/** 0 at the first step and 1 at the last; a one-step trace counts as complete. */
export function progressFraction(state: PlaybackState): number {
  return state.total <= 1 ? 1 : state.index / lastIndex(state);
}

/** Human label such as "Step 3 of 12" (1-based for people, 0-based inside the engine). */
export function stepLabel(state: PlaybackState): string {
  return `Step ${state.index + 1} of ${state.total}`;
}
