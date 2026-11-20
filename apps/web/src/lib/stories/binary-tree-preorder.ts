import { tourStory } from "./tree-tour";

/** A welcome tour: greet a room the moment you walk in, before you look at either wing. */
export const binaryTreePreorderStory = tourStory({
  meta: {
    id: "binary-tree-preorder",
    title: "The Welcome Round",
    emoji: "👋",
    hook: "A visitor walks through a building of rooms with two doors each. The rule is friendly: say hello to the person in a room the moment you walk in, and only then go through the left door, and after that the right door. The first hello always goes to the main room.",
    cast: [
      { emoji: "🚪", name: "Room", means: "a node of the tree" },
      { emoji: "🙋", name: "Visitor", means: "the recursive call that is walking right now" },
      { emoji: "👋", name: "Hello list", means: "the output list, written the moment you enter a room" },
      { emoji: "⬜", name: "Empty ground", means: "a missing child: the recursion ends there" },
    ],
    moral: "Pre-order means me, left, right. Handle the node first, then its left side, then its right side. The very first value is always the root, which is why pre-order can rebuild a tree.",
  },
  walker: { emoji: "🙋", name: "Visitor" },
  visitDoes: (v) => `says hello to ${v}`,
  visitSays: (v) => `Just walked in: say hello to room ${v} before looking at either door.`,
  inCodeVisit: "output.add(node.value)",
  boardLabel: "Hello list",
  doneWord: "The hellos went in this order",
});
