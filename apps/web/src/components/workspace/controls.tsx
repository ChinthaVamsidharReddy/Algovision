"use client";

import { SPEEDS, canGoNext, canGoPrev, isPlaying, type PlaybackAction, type PlaybackState, type Speed } from "@algovision/viz-engine";

const btn =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50";

export function Controls({ state, dispatch }: { state: PlaybackState; dispatch: (a: PlaybackAction) => void }) {
  const playing = isPlaying(state);
  const finished = state.status === "finished";
  return (
    <div role="group" aria-label="Playback controls" className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn} onClick={() => dispatch({ type: "RESET" })} disabled={state.index === 0 && state.status === "idle"}>
        Reset
      </button>
      <button type="button" className={btn} onClick={() => dispatch({ type: "PREV" })} disabled={!canGoPrev(state)} aria-keyshortcuts="ArrowLeft">
        <span aria-hidden="true">◀</span> Previous
      </button>
      <button
        type="button"
        className={`${btn} !border-transparent !bg-accent !text-accent-fg hover:!opacity-90`}
        onClick={() => dispatch({ type: "TOGGLE" })}
        aria-keyshortcuts="Space"
        disabled={state.total <= 1 && !playing}
      >
        {playing ? "Pause" : finished ? "Replay" : "Play"}
      </button>
      <button type="button" className={btn} onClick={() => dispatch({ type: "NEXT" })} disabled={!canGoNext(state)} aria-keyshortcuts="ArrowRight">
        Next <span aria-hidden="true">▶</span>
      </button>

      <label className="ml-auto flex items-center gap-2 text-sm font-medium">
        Speed
        <select
          value={state.speed}
          onChange={(e) => dispatch({ type: "SET_SPEED", speed: Number(e.target.value) as Speed })}
          className="min-h-11 rounded-lg border border-border bg-surface px-2"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>

      <label className="flex w-full items-center gap-3 text-sm font-medium">
        <span className="shrink-0">Step</span>
        <input
          type="range"
          min={1}
          max={Math.max(1, state.total)}
          value={state.index + 1}
          disabled={state.total <= 1}
          onChange={(e) => dispatch({ type: "JUMP", index: Number(e.target.value) - 1 })}
          aria-valuetext={`Step ${state.index + 1} of ${state.total}`}
          className="h-11 w-full accent-(--accent)"
        />
      </label>
    </div>
  );
}
