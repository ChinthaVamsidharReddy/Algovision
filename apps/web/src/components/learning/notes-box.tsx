"use client";

import { useEffect, useRef, useState } from "react";
import { localDay } from "@/lib/activity-log";
import { MAX_NOTE, readNote, writeNote } from "@/lib/notes";
import { addCard, readReview, removeCard, writeReview } from "@/lib/review";

/** A private note for this algorithm, plus a switch for the review schedule. Both live only in this browser. */
export function NotesBox({ id }: { id: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");
  const [inReview, setInReview] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    setText(readNote(id));
    setInReview(Boolean(readReview().items[id]));
    loaded.current = true;
  }, [id]);

  // Save shortly after typing stops, so every keystroke is not a storage write.
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => setStatus(writeNote(id, text) ? "saved" : "failed"), 500);
    return () => clearTimeout(t);
  }, [id, text]);

  const toggle = () => {
    const store = readReview();
    const next = store.items[id] ? removeCard(store, id) : addCard(store, id, localDay(new Date()));
    writeReview(next);
    setInReview(Boolean(next.items[id]));
  };

  return (
    <section aria-labelledby="notes-title" className="mt-5 space-y-3 rounded-xl border border-border bg-surface p-5" data-testid="notes">
      <h2 id="notes-title" className="text-lg font-semibold">
        My notes
      </h2>
      <label htmlFor="note-text" className="sr-only">
        Your private notes on this algorithm
      </label>
      <textarea
        id="note-text"
        value={text}
        maxLength={MAX_NOTE}
        rows={4}
        onChange={(e) => {
          setStatus("idle");
          setText(e.target.value);
        }}
        placeholder="What clicked? What trips you up? Write it in your own words."
        className="w-full rounded-lg border border-border bg-bg p-3"
      />
      <p className="text-sm text-muted" role="status" aria-live="polite" data-testid="note-status">
        {status === "saved" ? "Saved in this browser." : status === "failed" ? "Could not save: this browser is blocking storage." : "Notes stay in this browser and are not sent anywhere."}
      </p>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={inReview} onChange={toggle} className="h-5 w-5" />
        <span>Remind me to review this algorithm</span>
      </label>
    </section>
  );
}
