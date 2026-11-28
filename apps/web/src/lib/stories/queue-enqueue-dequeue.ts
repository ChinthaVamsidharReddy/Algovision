import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { describeQueue } from "@/lib/scene3d/queue-scene";
import { inputNumber, inputValues, joined, roleAt, toneOfRole, variable } from "./pile-util";

/** A ticket counter: people join at the back and are served from the front, first come first served. */
export const queueEnqueueDequeueStory: PileStory = {
  id: "queue-enqueue-dequeue",
  kind: "pile",
  shape: "queue",
  title: "The Ticket Counter Line",
  emoji: "🎟️",
  hook: "People arrive at a ticket counter and join the end of the line. The clerk always serves the person at the front. Nobody can jump ahead and nobody leaves from the middle. Whoever arrived first is served first.",
  cast: [
    { emoji: "🧍", name: "Person", means: "an item in the queue" },
    { emoji: "🔚", name: "Back", means: "where new arrivals join (enqueue)" },
    { emoji: "🔛", name: "Front", means: "where the next person is served and leaves (dequeue)" },
  ],
  scene3d: describeQueue,
  moral: "A queue is first in, first out. Arrivals join at the back and leave from the front, so the order of service is exactly the order of arrival.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const values = inputValues(trace);
    const removes = inputNumber(trace, "removes") ?? 0;
    const items = step.state.items;
    let joinedCount = 0;
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "enqueue") joinedCount++;
    }
    const strip = {
      label: "People arriving, in order",
      items: values.map((v, i) => ({ text: String(v), tone: (i < joinedCount ? "dim" : i === joinedCount && a === "entry" ? "hit" : "plain") as Tone })),
    };
    const pile = items.map((v, i) => ({ text: String(v), tone: toneOfRole(roleAt(step, i)) }));
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = `An empty line. ${values.length} ${values.length === 1 ? "person arrives" : "people arrive"}, then ${removes} ${removes === 1 ? "is" : "are"} served.`;
        break;
      case "enqueue":
        says = `Person ${variable(step, "enqueued")} joins the back of the line. The line now has ${items.length}.`;
        inCode = "queue.enqueue(value)";
        break;
      case "check-empty":
        says = items.length === 0 ? "Before serving anyone, look: the line is empty, so there is nobody to serve." : `Before serving, check the line is not empty. The person at the front is ${items[0]}.`;
        inCode = "if (queue.isEmpty())";
        break;
      case "underflow":
        says = "The line is empty, so nobody can be served. The request is skipped.";
        inCode = "underflow: nothing to dequeue";
        break;
      case "dequeue":
        says = `Serve the person at the front: ${variable(step, "dequeued")}. They arrived first, so they leave first.`;
        inCode = "value = queue.dequeue()";
        break;
      case "finish":
        says = items.length ? `All done. Still waiting, front to back: ${joined(items)}.` : "All done. The line is empty.";
        banner = { kind: "good", text: items.length ? `Still in the queue, front to back: ${joined(items)}.` : "The queue is empty." };
        break;
    }
    return { strip, pile, pileName: "Line (front is on the left)", says, inCode, banner, board: { label: "People waiting", text: String(items.length) } };
  },
};
