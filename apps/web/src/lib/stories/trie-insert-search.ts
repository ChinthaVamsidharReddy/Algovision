import type { Tone, TrieFrame, TrieStory } from "./types";
import { anchor, decodeOps, isLast, letterAt, numberVar, trieTones, walker } from "./trie-util";

/** A dictionary stored as a tree of letters: words that share a beginning share the same roads. */
export const trieInsertSearchStory: TrieStory = {
  id: "trie-insert-search",
  kind: "trie",
  title: "The Dictionary of Roads",
  emoji: "📖",
  hook: "A dictionary is built as a village of letter roads. The village starts as one empty square, the root. To store a word, a walker follows the road for its first letter, builds it if it is missing, then the road for the next letter, and so on. Words that start the same share the same roads, so 'an' and 'ant' use one road for 'a' and 'n'. The last room of a stored word gets a double ring. To look up a word, walk the roads: if a road is missing the answer is no, and if you arrive at a double-ringed room the word is stored. To ask whether any word starts with some letters, you only need the roads to exist.",
  cast: [
    { emoji: "🚶", name: "Walker", means: "current: the room you are standing in" },
    { emoji: "🔤", name: "Letters", means: "the word being added or looked up, one road per letter" },
    { emoji: "⭕", name: "Double ring", means: "a word ends in this room" },
  ],
  moral: "A trie spends one road per letter and shares the roads of common beginnings. Adding, searching and prefix checks all cost one step per letter of the word, however many words are stored.",
  frame(step, trace): TrieFrame {
    const a = anchor(step);
    const ops = decodeOps(trace);
    const opNo = numberVar(step, "op");
    const op = opNo !== null ? ops[opNo - 1] : undefined;
    const word = step.state.word;
    const pos = step.state.position;
    const ch = letterAt(step);
    const tones = trieTones(step);
    // What has been stored and answered up to this step, replayed from the earlier steps.
    const stored: string[] = [];
    const answers: string[] = [];
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      const id = anchor(s);
      if (id === "mark" && s.state.word && !stored.includes(s.state.word)) stored.push(s.state.word);
      if (id === "answer" || id === "miss") {
        const o = ops[(numberVar(s, "op") ?? 1) - 1];
        const r = numberVar(s, "result");
        if (o) answers.push(`${o.kind} "${o.word}": ${r === 1 ? "yes" : "no"}`);
      }
    }
    const questions = ops.filter((o) => o.kind !== "insert").length;
    const strip =
      word === ""
        ? undefined
        : { label: `The word: ${word}`, items: [...word].map((c, i): { text: string; tone: Tone } => ({ text: c, tone: pos !== null && i < pos ? "good" : pos !== null && i === pos ? "hit" : "plain" })), at: pos !== null && pos < word.length ? pos : undefined };
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: TrieFrame["banner"];
    switch (a) {
      case "entry":
        says = ops.length === 0 ? "There are no jobs, so the dictionary stays empty." : `${ops.length} ${ops.length === 1 ? "job" : "jobs"} for the dictionary: add words, look up whole words, and ask whether any word starts with some letters.`;
        break;
      case "init":
        says = "The dictionary starts as one empty square, the root. No roads yet.";
        inCode = "root = new TrieNode()";
        break;
      case "op":
        says = op ? (op.kind === "insert" ? `Job ${opNo} of ${ops.length}: add the word "${op.word}". The walker starts at the root.` : op.kind === "search" ? `Job ${opNo} of ${ops.length}: is the whole word "${op.word}" stored? The walker starts at the root.` : `Job ${opNo} of ${ops.length}: does any stored word start with "${op.word}"? The walker starts at the root.`) : says;
        inCode = op?.kind === "insert" ? "insert(word)" : op?.kind === "search" ? "search(word)" : "startsWith(prefix)";
        break;
      case "check":
        says = step.event.type === "found" ? `The room already has a road for "${ch}".` : op?.kind === "insert" ? `There is no road for "${ch}" here yet.` : `There is no road for "${ch}" here.`;
        inCode = "child = node.children[ch]";
        break;
      case "create":
        says = `Build a new road for "${ch}" and a new room at the end of it.`;
        inCode = "node.children[ch] = new TrieNode()";
        break;
      case "descend":
        says = `Walk down the "${ch}" road into the next room.`;
        inCode = "node = node.children[ch]";
        break;
      case "mark":
        says = `The word "${word}" ends here, so this room gets a double ring: a whole word ends in this room.`;
        inCode = "node.isEnd = true";
        break;
      case "answer": {
        const r = numberVar(step, "result");
        says = op?.kind === "prefix" ? `Every letter had a road, so yes: some stored word starts with "${op.word}".` : r === 1 ? `Every letter had a road and a word ends in this room, so yes: "${op?.word}" is stored.` : `Every letter had a road, but no word ends in this room, so no: "${op?.word}" is only the beginning of a longer word.`;
        inCode = op?.kind === "prefix" ? "return true" : "return node.isEnd";
        break;
      }
      case "miss":
        says = op?.kind === "prefix" ? `A road is missing, so no: no stored word starts with "${op.word}".` : `A road is missing, so no: "${op?.word}" is not stored.`;
        inCode = "return false";
        break;
      case "finish": {
        const yes = numberVar(step, "result") ?? 0;
        says = questions === 0 ? "All jobs are done." : `All jobs are done. ${yes} of the ${questions} ${questions === 1 ? "question was" : "questions were"} answered yes.`;
        break;
      }
    }
    if (isLast(step, trace)) {
      const yes = numberVar(step, "result") ?? 0;
      banner = questions === 0 ? { kind: "info", text: "No questions were asked: nothing to answer." } : { kind: "good", text: `${yes} of ${questions} ${questions === 1 ? "question" : "questions"} answered yes.` };
    }
    const board = { label: "The dictionary", text: `${stored.length ? `stored: ${stored.join(", ")}` : "nothing stored yet"}${answers.length ? `.  answers: ${answers.join("; ")}` : ""}` };
    return { tones, actors: walker(step), strip, says, inCode, banner, board };
  },
};
