import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Passengers (non-zero) move up to the free seats at the front; empty seats (0) slide to the back, order kept. */
export const moveZeroesStory: Story = {
  id: "move-zeroes",
  title: "Filling the Front Seats",
  emoji: "🚌",
  hook: "A bus has some passengers and some empty seats (0). The conductor walks along the aisle once. Every time she meets a passenger, he moves to the first free seat at the front. At the end, all the passengers sit together at the front in their original order, and every empty seat is at the back.",
  cast: [
    { emoji: "🪑", name: "Free seat", means: "write: the front-most seat that is still free" },
    { emoji: "🚶", name: "Conductor", means: "read: the seat she is checking now" },
    { emoji: "🧍", name: "Passenger", means: "a non-zero value" },
  ],
  moral: "A marker for the next free seat plus one walk along the aisle is enough: passengers keep their order and nothing needs a second bus (no extra array).",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const read = variable(step, "read");
    const write = variable(step, "write");
    const finished = a === "finish";
    const ok = (x: number | null): x is number => x !== null && x >= 0 && x < n;

    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: v === 0 ? "empty seat" : "passenger",
      tone: finished ? (v !== 0 ? "good" : "plain") : write !== null && k < write ? "good" : ok(read) && k === read ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (!finished) {
      if (ok(write)) actors.push({ id: "w", emoji: "🪑", name: "Free seat", at: write });
      if (ok(read)) actors.push({ id: "r", emoji: "🚶", name: "Conductor", at: read });
    }
    const here = ok(read) ? values[read]! : null;

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "The bus is empty." : `${n} seats: some hold a passenger, the seats marked 0 are empty. The conductor will walk along once.`;
        break;
      case "init-write":
        says = "The first free seat is the front seat (seat 1).";
        inCode = "write = 0";
        break;
      case "loop":
        says = `The conductor checks seat ${(read ?? 0) + 1}.`;
        inCode = "for (read = 0; read < n; read++)";
        break;
      case "check-nonzero":
        says = here === 0 ? "An empty seat. Nothing to move, so the free-seat marker stays where it is." : `A passenger (${here})! He should sit in the front-most free seat.`;
        inCode = "if (values[read] != 0)";
        break;
      case "swap":
        says = read === write ? "The passenger is already sitting in the front-most free seat, so nothing really moves." : "The passenger moves forward to the free seat, and the empty seat he leaves goes back to where he was.";
        inCode = "swap(values[write], values[read])";
        break;
      case "advance-write":
        says = `That seat is taken now, so the free-seat marker steps to seat ${(write ?? 0) + 1}.`;
        inCode = "write++";
        break;
      case "finish":
        says = `The conductor reached the back. The ${write ?? 0} passenger${write === 1 ? " sits" : "s sit"} together at the front in their original order, and the empty seats are at the back.`;
        banner = { kind: "good", text: "All passengers at the front, empty seats at the back." };
        inCode = "// read reached n";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
