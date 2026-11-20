import { tourStory } from "./tree-tour";

/** Closing time: a room can be locked only after both of its wings are locked. */
export const binaryTreePostorderStory = tourStory({
  meta: {
    id: "binary-tree-postorder",
    title: "Closing Time",
    emoji: "🔒",
    hook: "The building is closing and the caretaker locks it room by room. A room may be locked only once both of its wings are already locked, otherwise someone could be shut inside. So the caretaker goes all the way down the left, then all the way down the right, and locks each room on the way back. The main room is locked last.",
    cast: [
      { emoji: "🚪", name: "Room", means: "a node of the tree" },
      { emoji: "🧑‍🔧", name: "Caretaker", means: "the recursive call that is walking right now" },
      { emoji: "🔒", name: "Lock list", means: "the output list, written when a room is locked" },
      { emoji: "⬜", name: "Empty ground", means: "a missing child: the recursion ends there" },
    ],
    moral: "Post-order means left, right, me. Children are always finished before their parent, so the root comes last. This is the order to use when you must clean up the children first, like deleting a tree.",
  },
  walker: { emoji: "🧑‍🔧", name: "Caretaker" },
  visitDoes: (v) => `locks room ${v}`,
  visitSays: (v) => `Both wings of room ${v} are locked, so lock room ${v} itself.`,
  inCodeVisit: "output.add(node.value)",
  boardLabel: "Lock list",
  doneWord: "The rooms were locked in this order",
});
