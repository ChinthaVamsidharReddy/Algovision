import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** A farmer digs a pond between two fence posts: water rises only to the shorter post, and wider holds more. */
export const containerWithMostWaterStory: Story = {
  id: "container-with-most-water",
  title: "The Farmer's Pond",
  emoji: "💧",
  hook: "A farmer has a row of fence posts of different heights. He digs a pond between two posts and fills it. Water can only rise to the height of the shorter post, and a wider pond holds more. He starts with the widest pond (the two end posts) and then moves the shorter post inward, hoping to find a taller one.",
  cast: [
    { emoji: "🪵", name: "Left post", means: "the left pointer" },
    { emoji: "🪵", name: "Right post", means: "the right pointer" },
    { emoji: "💧", name: "Pond", means: "area = shorter height × distance between the posts" },
    { emoji: "🏆", name: "Best pond", means: "the best variable: the biggest area seen so far" },
  ],
  moral: "Moving the taller post can never help (the water is still limited by the shorter one and the pond is narrower), so always move the shorter post. That is why one walk from both ends finds the biggest pond.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const left = variable(step, "left");
    const right = variable(step, "right");
    const height = variable(step, "height");
    const area = variable(step, "area");
    const best = variable(step, "best") ?? 0;
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const li = ok(left) ? left : null;
    const ri = ok(right) ? right : null;
    const tallest = Math.max(1, ...values);
    const active = li !== null && ri !== null && a !== "finish";

    const cells: StoryCell[] = values.map((v, i) => ({
      main: String(v),
      sub: `post ${i + 1}`,
      bar: v / tallest,
      tone: !active ? "plain" : i === li || i === ri ? "hit" : i < li! || i > ri! ? "dim" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (active) {
      actors.push({ id: "l", emoji: "🪵", name: "Left", at: li! }, { id: "r", emoji: "🪵", name: "Right", at: ri! });
    }
    const hl = li !== null ? values[li] : null;
    const hr = ri !== null ? values[ri] : null;

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n < 2 ? "There are fewer than two posts, so no pond can be made." : `${n} posts stand in a row (the strip under each post shows how tall it is). Find the two posts that make the biggest pond.`;
        break;
      case "init":
        says = "Start with the widest pond: one post at each end. The best pond so far is 0.";
        inCode = "left = 0; right = n - 1; best = 0";
        break;
      case "loop":
        says = `Posts ${(li ?? 0) + 1} and ${(ri ?? 0) + 1} are two different posts, so there is still a pond to measure.`;
        inCode = "while (left < right)";
        break;
      case "measure":
        says = `Water rises only to the shorter post: min(${hl}, ${hr}) = ${height}.`;
        inCode = "h = min(values[left], values[right])";
        break;
      case "area":
        says = `Pond size = height ${height} × width ${ri !== null && li !== null ? ri - li : "?"} = ${area}.`;
        inCode = "area = h * (right - left)";
        break;
      case "update-best":
        says = `${area} is bigger than the best pond so far, so it is the new best: ${best}.`;
        inCode = "best = max(best, area)";
        break;
      case "move-left":
        says = `The left post is the shorter one. Keeping it with a closer partner can only make a narrower pond with the same limit, so the left post moves inward, hoping for a taller post. The best pond so far: ${best}.`;
        inCode = "left++";
        break;
      case "move-right":
        says = `The right post is not taller, so it is the one to move inward. The best pond so far: ${best}.`;
        inCode = "right--";
        break;
      case "finish":
        says = `The posts have met, so every useful pond has been checked. The biggest pond holds ${best}.`;
        banner = { kind: "good", text: `The biggest pond holds ${best}.` };
        inCode = "return best";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
