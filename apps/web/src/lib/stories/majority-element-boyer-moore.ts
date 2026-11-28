import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { labelAt, roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** Rival supporters cancel each other out in pairs; whoever is left standing is the majority. */
export const majorityElementBoyerMooreStory: Story = {
  id: "majority-element-boyer-moore",
  title: "Supporters Who Cancel Out",
  emoji: "🗳️",
  hook: "Voters line up one at a time, each backing a team. A referee holds one banner and keeps a tally. A voter for the banner's team adds one to the tally. A voter for any other team cancels one of those supporters out and takes one away. When the tally is zero the next voter simply picks up the banner. A team with more than half of all the votes can never be fully cancelled, so it is the one holding the banner at the end.",
  cast: [
    { emoji: "🗳️", name: "Voter", means: "i: the voter being counted" },
    { emoji: "🚩", name: "Banner", means: "candidate: the team currently held up" },
    { emoji: "🔢", name: "Tally", means: "count: supporters not yet cancelled" },
  ],
  moral: "Different values cancel in pairs, so the majority value (more than half) is always what is left. Two variables are enough: a candidate and a count, O(1) space.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const v = step.state.values;
    const n = v.length;
    const i = variable(step, "i");
    const candidate = variable(step, "candidate") ?? 0;
    const count = variable(step, "count") ?? 0;
    const roles = rolesOf(step);
    const cells = v.map((x, k) => ({ main: String(x), sub: `voter ${k + 1}`, tone: roleTone(roles.get(k)) }));
    let holding = false;
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "new-candidate" && s.highlights.some((h) => h.label === "candidate")) holding = true;
    }
    const actors: StoryActor[] = i !== null && i < n && ["loop", "new-candidate", "vote"].includes(a) ? [{ id: "v", emoji: "🗳️", name: "Voter", at: i }] : [];
    const val = i !== null ? (v[i] ?? 0) : 0;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} voters line up, each backing a team. A team with more than half the votes is hiding in there. Different teams cancel each other out in pairs.`;
        break;
      case "init":
        says = "Nobody holds the banner yet, and the tally is 0.";
        inCode = "candidate = none; count = 0";
        break;
      case "loop":
        says = `Voter ${(i ?? 0) + 1} steps up, backing ${val}.`;
        inCode = "for (x : nums)";
        break;
      case "new-candidate":
        says = labelAt(step, i ?? -1) === "candidate" ? `The tally is 0, so nobody is holding the banner. Team ${val} picks it up.` : `The tally is ${count}, so team ${candidate} keeps the banner.`;
        inCode = "if (count == 0) candidate = x";
        break;
      case "vote":
        says = labelAt(step, i ?? -1) === "same" ? `Voter ${(i ?? 0) + 1} backs the banner team ${candidate}, so the tally goes up to ${count}.` : `Voter ${(i ?? 0) + 1} backs a different team. One supporter of team ${candidate} is cancelled out, and the tally drops to ${count}.`;
        inCode = "count += (x == candidate) ? 1 : -1";
        break;
      case "finish":
        says = `Every other voter was cancelled by a different one. The team still holding the banner, team ${candidate}, has the majority.`;
        banner = { kind: "good", text: `Majority: ${candidate}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Banner · tally", text: holding || a === "finish" ? `team ${candidate} · ${count}` : "nobody · 0" } };
  },
};
