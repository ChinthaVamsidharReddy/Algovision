import { islandStory } from "./island-core";

/** The same map, but now you measure each island as you walk it and remember the biggest. */
export const maxAreaOfIslandStory = islandStory(
  {
    id: "max-area-of-island",
    title: "Which Island Is the Biggest?",
    emoji: "📏",
    hook: "The same sea map as before, but now you care about size. You scan for land you have not walked on, and when you find some you walk across the whole island, counting every square as you go. When the island is finished you compare its size with the biggest island seen so far and keep the larger.",
    cast: [
      { emoji: "🌴", name: "Land", means: "a cell with value 1" },
      { emoji: "🌊", name: "Sea", means: "a cell with value 0" },
      { emoji: "🚶", name: "Explorer", means: "the square being walked or scanned right now" },
      { emoji: "📏", name: "Size", means: "squares walked so far on the current island" },
    ],
    moral: "Walk an island completely, adding one for each square. When the walk ends, that is the island's area: keep the maximum over all islands.",
  },
  "area",
);
