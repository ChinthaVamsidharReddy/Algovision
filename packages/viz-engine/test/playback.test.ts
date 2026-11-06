import { describe, expect, it } from "vitest";
import {
  canGoNext,
  canGoPrev,
  createPlaybackState,
  playbackReducer,
  progressFraction,
  SPEEDS,
  stepDelayMs,
  stepLabel,
  type PlaybackAction,
  type PlaybackState,
} from "../src";

const run = (state: PlaybackState, ...actions: PlaybackAction[]) =>
  actions.reduce(playbackReducer, state);

describe("playbackReducer basics", () => {
  const start = createPlaybackState(5);

  it("starts idle at the first step", () => {
    expect(start).toMatchObject({ status: "idle", index: 0, total: 5, speed: 1 });
  });

  it("NEXT and PREV move one step and pause", () => {
    const s = run(start, { type: "NEXT" }, { type: "NEXT" });
    expect(s).toMatchObject({ index: 2, status: "paused" });
    expect(playbackReducer(s, { type: "PREV" })).toMatchObject({ index: 1, status: "paused" });
  });

  it("clamps at both ends", () => {
    expect(playbackReducer(start, { type: "PREV" }).index).toBe(0);
    const end = run(start, { type: "JUMP", index: 99 });
    expect(end.index).toBe(4);
    expect(playbackReducer(end, { type: "NEXT" }).index).toBe(4);
  });

  it("marks finished only when the last step is reached", () => {
    expect(run(start, { type: "JUMP", index: 3 }).status).toBe("paused");
    expect(run(start, { type: "JUMP", index: 4 }).status).toBe("finished");
  });

  it("PREV leaves the finished state", () => {
    const s = run(start, { type: "JUMP", index: 4 }, { type: "PREV" });
    expect(s).toMatchObject({ index: 3, status: "paused" });
  });

  it("JUMP ignores non-finite input and floors fractions", () => {
    expect(playbackReducer(start, { type: "JUMP", index: Number.NaN })).toBe(start);
    expect(run(start, { type: "JUMP", index: 2.9 }).index).toBe(2);
    expect(run(start, { type: "JUMP", index: -4 }).index).toBe(0);
  });

  it("RESET returns to the initial position and keeps the speed", () => {
    const s = run(start, { type: "SET_SPEED", speed: 2 }, { type: "NEXT" }, { type: "RESET" });
    expect(s).toMatchObject({ index: 0, status: "idle", speed: 2 });
  });

  it("LOAD swaps the trace, resets position and keeps the speed", () => {
    const s = run(start, { type: "SET_SPEED", speed: 1.5 }, { type: "JUMP", index: 3 });
    const loaded = playbackReducer(s, { type: "LOAD", total: 9 });
    expect(loaded).toMatchObject({ index: 0, total: 9, status: "idle", speed: 1.5 });
    expect(loaded.epoch).toBeGreaterThan(s.epoch);
  });

  it("treats a zero or invalid total as a single step", () => {
    expect(createPlaybackState(0).total).toBe(1);
    expect(playbackReducer(start, { type: "LOAD", total: Number.NaN }).total).toBe(1);
  });
});

describe("play, pause and ticks", () => {
  const start = createPlaybackState(4);

  it("PLAY then TICK advances until the end, then finishes", () => {
    let s = playbackReducer(start, { type: "PLAY" });
    expect(s.status).toBe("playing");
    const seen: number[] = [s.index];
    while (s.status === "playing") {
      s = playbackReducer(s, { type: "TICK", epoch: s.epoch });
      seen.push(s.index);
    }
    expect(seen).toEqual([0, 1, 2, 3]);
    expect(s.status).toBe("finished");
  });

  it("PAUSE stops automatic movement and a stale tick is ignored", () => {
    const playing = playbackReducer(start, { type: "PLAY" });
    const staleEpoch = playing.epoch;
    const paused = playbackReducer(playing, { type: "PAUSE" });
    expect(paused.status).toBe("paused");
    expect(playbackReducer(paused, { type: "TICK", epoch: staleEpoch })).toBe(paused);
  });

  it("a manual step cancels the pending tick", () => {
    const playing = playbackReducer(start, { type: "PLAY" });
    const stepped = playbackReducer(playing, { type: "NEXT" });
    expect(stepped.status).toBe("paused");
    expect(playbackReducer(stepped, { type: "TICK", epoch: playing.epoch })).toBe(stepped);
  });

  it("TICK does nothing unless playing", () => {
    expect(playbackReducer(start, { type: "TICK", epoch: start.epoch })).toBe(start);
  });

  it("PLAY from the finished state starts over", () => {
    const end = run(start, { type: "JUMP", index: 3 });
    expect(end.status).toBe("finished");
    expect(playbackReducer(end, { type: "PLAY" })).toMatchObject({ index: 0, status: "playing" });
  });

  it("PLAY while already playing is a no-op", () => {
    const playing = playbackReducer(start, { type: "PLAY" });
    expect(playbackReducer(playing, { type: "PLAY" })).toBe(playing);
  });

  it("TOGGLE alternates between playing and paused", () => {
    const a = playbackReducer(start, { type: "TOGGLE" });
    const b = playbackReducer(a, { type: "TOGGLE" });
    expect([a.status, b.status]).toEqual(["playing", "paused"]);
  });

  it("a one-step trace finishes immediately when played", () => {
    const one = createPlaybackState(1);
    expect(playbackReducer(one, { type: "PLAY" }).status).toBe("finished");
    expect(playbackReducer(one, { type: "NEXT" }).status).toBe("paused");
  });

  it("changing speed does not move the index or cancel playback", () => {
    const playing = playbackReducer(start, { type: "PLAY" });
    const faster = playbackReducer(playing, { type: "SET_SPEED", speed: 2 });
    expect(faster).toMatchObject({ index: playing.index, status: "playing", speed: 2 });
    expect(playbackReducer(faster, { type: "TICK", epoch: playing.epoch }).index).toBe(1);
  });

  it("rejects speeds outside the allowed list", () => {
    const bad = playbackReducer(start, { type: "SET_SPEED", speed: 3 as never });
    expect(bad).toBe(start);
  });
});

describe("replay", () => {
  it("REPLAY reproduces the identical sequence every time", () => {
    const collect = (initial: PlaybackState) => {
      let s = playbackReducer(initial, { type: "REPLAY" });
      const seen = [s.index];
      while (s.status === "playing") {
        s = playbackReducer(s, { type: "TICK", epoch: s.epoch });
        seen.push(s.index);
      }
      return seen;
    };
    const first = collect(createPlaybackState(6));
    const afterUse = collect(run(createPlaybackState(6), { type: "JUMP", index: 4 }));
    expect(first).toEqual([0, 1, 2, 3, 4, 5]);
    expect(afterUse).toEqual(first);
  });
});

describe("helpers", () => {
  it("stepDelayMs divides the base interval by speed", () => {
    expect(SPEEDS.map((s) => stepDelayMs(s))).toEqual([2000, 1000, 667, 500]);
    expect(stepDelayMs(2, 800)).toBe(400);
  });

  it("selectors and labels", () => {
    const s = run(createPlaybackState(5), { type: "JUMP", index: 2 });
    expect(canGoPrev(s)).toBe(true);
    expect(canGoNext(s)).toBe(true);
    expect(progressFraction(s)).toBeCloseTo(0.5);
    expect(stepLabel(s)).toBe("Step 3 of 5");
    expect(canGoNext(run(s, { type: "JUMP", index: 4 }))).toBe(false);
    expect(progressFraction(createPlaybackState(1))).toBe(1);
  });
});

/** Small seeded generator so a failure is reproducible from the seed in the test name. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomAction(rand: () => number, state: PlaybackState): PlaybackAction {
  const pick = Math.floor(rand() * 12);
  switch (pick) {
    case 0:
      return { type: "PLAY" };
    case 1:
      return { type: "PAUSE" };
    case 2:
      return { type: "TOGGLE" };
    case 3:
      return { type: "NEXT" };
    case 4:
      return { type: "PREV" };
    case 5:
      return { type: "JUMP", index: Math.floor(rand() * (state.total + 4)) - 2 };
    case 6:
      return { type: "RESET" };
    case 7:
      return { type: "REPLAY" };
    case 8:
      return { type: "SET_SPEED", speed: SPEEDS[Math.floor(rand() * SPEEDS.length)]! };
    case 9:
      return { type: "LOAD", total: Math.floor(rand() * 8) + 1 };
    default:
      // Mix of live and stale ticks, as a real timer would produce under rapid input.
      return { type: "TICK", epoch: state.epoch - Math.floor(rand() * 3) };
  }
}

describe("randomized action sequences keep the invariants", () => {
  for (const seed of [1, 2, 3, 42, 1337, 20261102]) {
    it(`seed ${seed}`, () => {
      const rand = mulberry32(seed);
      let state = createPlaybackState(5);
      let previousEpoch = state.epoch;
      for (let i = 0; i < 2000; i++) {
        const action = randomAction(rand, state);
        state = playbackReducer(state, action);
        // index always addresses a real step
        expect(state.index).toBeGreaterThanOrEqual(0);
        expect(state.index).toBeLessThan(state.total);
        expect(Number.isInteger(state.index)).toBe(true);
        // status agrees with position
        if (state.status === "finished") expect(state.index).toBe(state.total - 1);
        if (state.status === "playing") expect(state.index).toBeLessThan(state.total - 1);
        if (state.status === "idle") expect(state.index).toBe(0);
        // epoch only moves forward, so a stale tick can never become valid again
        expect(state.epoch).toBeGreaterThanOrEqual(previousEpoch);
        previousEpoch = state.epoch;
        expect(SPEEDS).toContain(state.speed);
      }
    });

    it(`seed ${seed} is deterministic`, () => {
      const play = () => {
        const rand = mulberry32(seed);
        let state = createPlaybackState(5);
        for (let i = 0; i < 500; i++) state = playbackReducer(state, randomAction(rand, state));
        return state;
      };
      expect(play()).toEqual(play());
    });
  }

  it("a tick from before any pause or manual move can never advance the trace", () => {
    const rand = mulberry32(7);
    let state = createPlaybackState(6);
    for (let i = 0; i < 500; i++) {
      state = playbackReducer(state, randomAction(rand, state));
      const stale = { type: "TICK", epoch: state.epoch - 1 } as const;
      expect(playbackReducer(state, stale)).toBe(state);
    }
  });
});
