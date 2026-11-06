"use client";

import { useEffect, useReducer } from "react";
import {
  createPlaybackState,
  playbackReducer,
  stepDelayMs,
  type PlaybackAction,
  type PlaybackState,
  type Speed,
} from "@algovision/viz-engine";

/**
 * The reducer owns position; this hook only owns the clock. Every timeout carries the epoch it was
 * scheduled in, so a tick that fires after a pause, jump or speed change is ignored by the reducer.
 */
export function usePlayback(total: number, speed: Speed, step: number): [PlaybackState, (a: PlaybackAction) => void] {
  const [state, dispatch] = useReducer(playbackReducer, undefined, () => {
    const initial = createPlaybackState(total, speed);
    return step > 0 ? playbackReducer(initial, { type: "JUMP", index: step }) : initial;
  });

  useEffect(() => {
    if (state.status !== "playing") return;
    const epoch = state.epoch;
    const timer = setTimeout(() => dispatch({ type: "TICK", epoch }), stepDelayMs(state.speed));
    return () => clearTimeout(timer);
  }, [state.status, state.index, state.epoch, state.speed]);

  return [state, dispatch];
}
