import { tourStory } from "./tree-tour";

/** A museum tour: see the whole left wing, then the hall itself, then the right wing. The guest book comes out sorted in a search tree. */
export const binaryTreeInorderStory = tourStory({
  meta: {
    id: "binary-tree-inorder",
    title: "The Museum Tour",
    emoji: "🏛️",
    hook: "A museum has a main hall with a left wing and a right wing, and every wing is itself a hall with two more wings. The guide has one rule: finish the whole left wing first, then sign the guest book for this hall, then do the right wing. Follow that rule in every hall and the guest book comes out in order.",
    cast: [
      { emoji: "🚪", name: "Room", means: "a node of the tree" },
      { emoji: "🚶", name: "Guide", means: "the recursive call that is walking right now" },
      { emoji: "📖", name: "Guest book", means: "the output list, written at the moment the guide leaves the left wing" },
      { emoji: "⬜", name: "Empty ground", means: "a missing child: the recursion ends there" },
    ],
    moral: "In-order means left, me, right. Do the whole left side, then handle this node, then the whole right side. For a search tree this reads the values from smallest to largest.",
  },
  walker: { emoji: "🚶", name: "Guide" },
  visitDoes: (v) => `signs the guest book for ${v}`,
  visitSays: (v) => `The left wing of room ${v} is finished, so now sign the guest book: ${v}.`,
  inCodeVisit: "output.add(node.value)",
  boardLabel: "Guest book",
  doneWord: "The guest book reads",
});
