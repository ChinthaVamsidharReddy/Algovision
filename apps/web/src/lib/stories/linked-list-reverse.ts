import { chainIds, anchorOf, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { spot, valueOf, present } from "./chain-util";

/** A conga line where everybody turns around and takes hold of the person who used to be behind them. */
export const linkedListReverseStory: ChainStory = {
  id: "linked-list-reverse",
  kind: "linkedList",
  title: "Turning the Conga Line Around",
  emoji: "💃",
  hook: "Everyone in a conga line holds the shoulders of the person in front. You want the line to run the other way. Standing at the front, you walk down the line and ask each person to let go of the one ahead and grab the one behind instead. You must remember who is next before they let go, or the rest of the line is lost.",
  cast: [
    { emoji: "🧍", name: "Dancer", means: "a node, holding the next one with its next pointer" },
    { emoji: "👈", name: "Prev", means: "prev: the dancer already turned around, just behind the current one" },
    { emoji: "🫵", name: "Current", means: "current: the dancer being turned right now" },
    { emoji: "📝", name: "Next", means: "next: the dancer we noted down before letting go" },
  ],
  moral: "To reverse a chain, walk it once and keep three fingers: where you came from, where you are, and where you are going. Save the next one first, turn the link, then step forward.",
  frame(step, trace) {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const order = chainIds(first.state);
    const cur = step.state.pointers.current ?? null;
    const idx = cur === null ? order.length : order.indexOf(cur);
    const tones: Record<string, Tone> = {};
    order.forEach((id, i) => {
      tones[id] = a === "finish" || i < idx ? "good" : i === idx && a !== "entry" ? "hit" : "plain";
    });
    const actors: ChainActor[] = [];
    const add = (id: string, emoji: string, name: string, node: string | undefined) => {
      if (node !== undefined) actors.push({ id, emoji, name, node });
    };
    const n = order.length;
    const val = (id: string | undefined | null) => (id && id !== "end" ? valueOf(step, id) : undefined);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "The line is empty, so there is nothing to turn." : `A conga line of ${n} dancers. Dancer ${val(order[0])} is at the front. Let us turn the whole line around.`;
        break;
      case "init-prev":
        add("prev", "👈", "Prev", "end");
        says = "Nobody has been turned yet, so Prev stands at the end of the line, holding nothing.";
        inCode = "prev = null";
        break;
      case "init-current":
        add("prev", "👈", "Prev", "end");
        add("cur", "🫵", "Current", spot(step, "current"));
        says = cur === null ? "There is nobody in the line, so Current has nobody to stand beside." : `Current stands at the front, on dancer ${val(cur)}.`;
        inCode = "current = head";
        break;
      case "loop":
        add("prev", "👈", "Prev", spot(step, "prev"));
        add("cur", "🫵", "Current", spot(step, "current"));
        says = cur === null ? "Current has walked off the end of the line. Everyone has been turned." : `Dancer ${val(cur)} still needs turning, so we go on.`;
        inCode = "while (current != null)";
        break;
      case "save-next":
        add("prev", "👈", "Prev", spot(step, "prev"));
        add("cur", "🫵", "Current", spot(step, "current"));
        add("next", "📝", "Next", spot(step, "next"));
        says = spot(step, "next") === "end" ? `Dancer ${val(cur)} is the last in the line, so there is nobody to note down.` : `Before letting go, note who is behind: dancer ${val(spot(step, "next"))}.`;
        inCode = "next = current.next";
        break;
      case "reverse-link":
        add("prev", "👈", "Prev", spot(step, "prev"));
        add("cur", "🫵", "Current", spot(step, "current"));
        add("next", "📝", "Next", spot(step, "next"));
        says = spot(step, "prev") === "end" ? `Dancer ${val(cur)} lets go of the one behind and holds nothing: they are the new back of the line.` : `Dancer ${val(cur)} lets go of the one behind and grabs dancer ${val(spot(step, "prev"))} instead.`;
        inCode = "current.next = prev";
        break;
      case "move-prev":
        add("prev", "👈", "Prev", spot(step, "prev"));
        add("cur", "🫵", "Current", spot(step, "current"));
        add("next", "📝", "Next", spot(step, "next"));
        says = `Prev steps up to dancer ${val(spot(step, "prev"))}, who is now turned around.`;
        inCode = "prev = current";
        break;
      case "move-current":
        add("prev", "👈", "Prev", spot(step, "prev"));
        add("cur", "🫵", "Current", spot(step, "current"));
        says = spot(step, "current") === "end" ? "Current follows the note to the end of the line. The walk is over." : `Current follows the note to dancer ${val(spot(step, "current"))}, the next one to turn.`;
        inCode = "current = next";
        break;
      case "finish": {
        const head = step.state.head;
        add("prev", "👈", "Front", head ?? undefined);
        inCode = "return prev";
        if (head === null) {
          says = "The line was empty, so there is nothing to turn around.";
          banner = { kind: "info", text: "An empty line stays empty." };
        } else {
          says = `Done! Dancer ${val(head)} is now at the front and the whole line runs the other way.`;
          banner = { kind: "good", text: `The line is reversed: the new front is dancer ${val(head)}.` };
        }
        break;
      }
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
