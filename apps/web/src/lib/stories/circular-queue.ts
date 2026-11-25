import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { indexWithRole, slotCells } from "./ledger-util";

/** A ring of waiting-room chairs: newcomers take the next free chair going round, the clerk always calls whoever sits at the front. */
export const circularQueueStory: Story = {
  id: "circular-queue",
  title: "The Ring of Waiting Chairs",
  emoji: "💺",
  hook: "A waiting room has a fixed number of chairs arranged in a circle. A ticket number means a person arrives and takes the next free chair after the people already waiting. A 0 means the clerk calls the person who has waited longest, who leaves a free chair behind. Counting past the last chair goes back to the first, so chairs are reused. If every chair is taken the newcomer is turned away.",
  cast: [
    { emoji: "🧍", name: "Front", means: "front: the person who is called next" },
    { emoji: "🪑", name: "Next chair", means: "(front + size) % capacity: where a newcomer sits" },
    { emoji: "🔄", name: "Wrap-around", means: "the % capacity: after the last chair comes the first" },
  ],
  moral: "A circular queue keeps a fixed array and two moving positions. Taking the remainder by the capacity makes the end of the array join the start, so no item is ever shifted and every operation is O(1).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const cap = step.state.values.length;
    const op = variable(step, "op");
    const front = variable(step, "front") ?? step.state.pointers.front ?? 0;
    const size = variable(step, "size") ?? 0;
    const at = variable(step, "at");
    const removed = variable(step, "removed");
    const cells = slotCells(step, 0, (k) => `chair ${k}`);
    const started = step.index >= 1;
    const rear = step.state.pointers.rear;
    const actors: StoryActor[] = [];
    if (started) {
      actors.push({ id: "f", emoji: "🧍", name: "Front", at: front, row: "bottom" });
      if (typeof rear === "number") actors.push({ id: "r", emoji: "🪑", name: "Next chair", at: rear });
    }
    const waiting: number[] = [];
    if (started) for (let k = 0; k < size; k++) waiting.push(step.state.values[(front + k) % cap]!);
    const gone = indexWithRole(step, "swapped");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `A ring of ${cap} ${cap === 1 ? "chair" : "chairs"}. A ticket number means someone arrives; a 0 means the clerk calls the next person.`;
        break;
      case "init":
        says = "Nobody is waiting. The front marker shows who would be called next.";
        inCode = "front = 0; size = 0";
        break;
      case "loop":
        says = op === 0 ? "Next event: the clerk calls the next person." : `Next event: person ${op} arrives.`;
        inCode = "for (op : operations)";
        break;
      case "check-op":
        says = op === 0 ? "A 0 means: call the person at the front." : `Ticket ${op} is not 0, so somebody has arrived.`;
        inCode = "if (op != 0)";
        break;
      case "overflow":
        says = `All ${cap} chairs are taken, so person ${op} is turned away.`;
        inCode = "if (size == capacity) overflow";
        break;
      case "enqueue":
        says = `Person ${op} sits in chair ${at}: the next free chair after the people waiting, wrapping round the ring.`;
        inCode = "queue[(front + size) % capacity] = op; size++";
        break;
      case "underflow":
        says = "Nobody is waiting, so there is nobody to call.";
        inCode = "if (size == 0) underflow";
        break;
      case "dequeue":
        says = `Person ${removed} is called from chair ${gone}. Chair ${gone} is free again and the front moves to chair ${front}.`;
        inCode = "front = (front + 1) % capacity; size--";
        break;
      case "finish":
        says = size === 0 ? "The clerk has dealt with every event. Nobody is waiting." : `Every event is done. ${size} ${size === 1 ? "person is" : "people are"} still waiting.`;
        banner = size === 0 ? { kind: "info", text: "Nobody is waiting." } : { kind: "good", text: `Waiting, front first: ${waiting.join(", ")}.` };
        break;
    }
    void trace;
    return { cells, actors, says, inCode, banner, board: { label: "Waiting (front first)", text: started && waiting.length ? waiting.join(", ") : "nobody" } };
  },
};
