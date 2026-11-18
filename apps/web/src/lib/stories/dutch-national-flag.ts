import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** One sorter, three coloured socks: reds to the front, blues to the back, in a single walk. */
export const dutchNationalFlagStory: Story = {
  id: "dutch-national-flag",
  title: "Sorting the Sock Pile",
  emoji: "🧦",
  hook: "A row of socks in three colours is in a mess. One sorter walks along the row exactly once. A red sock is swapped to the front, a blue sock is swapped to the back, and a white sock is left where it is. When the sorter reaches the blue zone, all the socks are sorted.",
  cast: [
    { emoji: "🧺", name: "Red slot", means: "the low pointer: the next place a red sock goes" },
    { emoji: "🧑‍🔧", name: "Sorter", means: "the mid pointer: the sock being checked now" },
    { emoji: "📦", name: "Blue slot", means: "the high pointer: the next place (from the back) a blue sock goes" },
    { emoji: "🔴⚪🔵", name: "Socks", means: "the values 0, 1 and 2" },
  ],
  moral: "Keep three zones: reds done at the front, blues done at the back, and an unknown middle that shrinks. Every sock is looked at once, so the whole pile is sorted in one pass.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const low = variable(step, "low");
    const mid = variable(step, "mid");
    const high = variable(step, "high");
    const here = variable(step, "values[mid]");
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const COLOUR = ["red", "white", "blue"];
    const EMOJI = ["🔴", "⚪", "🔵"];
    const zones = low !== null && mid !== null && high !== null;
    const finished = a === "finish";

    const cells: StoryCell[] = values.map((v, i) => {
      const sorted = finished || (zones && (i < low! || i > high! || (i >= low! && i < mid!)));
      return { main: EMOJI[v] ?? String(v), sub: String(v), tone: sorted ? "good" : zones && i === mid ? "hit" : "plain" };
    });
    const actors: StoryFrame["actors"] = [];
    if (!finished) {
      if (ok(low)) actors.push({ id: "lo", emoji: "🧺", name: "Red slot", at: low });
      if (ok(mid)) actors.push({ id: "mid", emoji: "🧑‍🔧", name: "Sorter", at: mid });
      if (ok(high)) actors.push({ id: "hi", emoji: "📦", name: "Blue slot", at: high });
    }
    const colour = here !== null ? (COLOUR[here] ?? String(here)) : "?";

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "There are no socks, so there is nothing to sort." : `${n} socks lie in a mess (0 = red, 1 = white, 2 = blue). The sorter will walk along them once.`;
        break;
      case "init":
        says = "The Red slot is at the very front, the Sorter at the first sock and the Blue slot at the very back. Nothing has been checked yet, so every sock is unknown.";
        inCode = "low = 0; mid = 0; high = n - 1";
        break;
      case "loop":
        says = `The Sorter is at sock ${mid !== null ? mid + 1 : "?"}, which has not been checked yet, so the walk goes on.`;
        inCode = "while (mid <= high)";
        break;
      case "check-zero":
        says = `The Sorter picks up sock ${mid !== null ? mid + 1 : "?"}: it is ${colour}.`;
        inCode = "if (values[mid] == 0)";
        break;
      case "check-one":
        says = here === 1 ? "It is white: white socks belong in the middle, so it can stay." : "It is not red, so it is white or blue.";
        inCode = "else if (values[mid] == 1)";
        break;
      case "zero-swap":
        says = "A red sock! It was swapped into the Red slot at the front. Then both the Red slot and the Sorter step forward.";
        inCode = "swap(low, mid); low++; mid++";
        break;
      case "one-advance":
        says = "White stays where it is. The Sorter just moves on to the next sock.";
        inCode = "mid++";
        break;
      case "two-swap":
        says = "A blue sock! It was swapped into the Blue slot at the back, and the back zone grew by one. The sock that arrived at the Sorter's spot is unchecked, so the Sorter stays put.";
        inCode = "swap(mid, high); high--";
        break;
      case "finish":
        says = "The Sorter has walked into the blue zone, so every sock is placed: reds, then whites, then blues.";
        banner = { kind: "good", text: "Sorted: all reds, then whites, then blues." };
        inCode = "// mid > high: done";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
