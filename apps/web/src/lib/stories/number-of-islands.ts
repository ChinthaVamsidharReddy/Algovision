import { islandStory } from "./island-core";

/** Counting islands on a map: scan for land, and when you find some you have not walked on, count it and walk over all of it. */
export const numberOfIslandsStory = islandStory(
  {
    id: "number-of-islands",
    title: "Counting Islands from the Air",
    emoji: "🏝️",
    hook: "You fly over a sea map divided into squares, each land or water. Squares of land that touch, up, down, left or right, belong to one island. You scan the map square by square. Each time you spot land you have not walked on, you have found a new island: add one to the count, then walk over every square of it and mark it, so you never count it twice.",
    cast: [
      { emoji: "🌴", name: "Land", means: "a cell with value 1" },
      { emoji: "🌊", name: "Sea", means: "a cell with value 0" },
      { emoji: "🚶", name: "Explorer", means: "the square being walked or scanned right now" },
      { emoji: "✅", name: "Walked", means: "land already visited: it belongs to an island that is counted" },
    ],
    moral: "Count an island when you first meet it, then flood-fill the whole island so its other squares are never counted again. The number of times you start a new walk is the number of islands.",
  },
  "count",
);
