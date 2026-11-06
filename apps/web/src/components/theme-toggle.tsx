"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

function currentMode(): Mode {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => setMode(currentMode()), []);

  const toggle = () => {
    const next: Mode = currentMode() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setMode(next);
    try {
      localStorage.setItem("av-theme", next);
    } catch {
      /* storage unavailable: the choice just lasts for this page view */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={mode === "dark"}
      className="min-h-11 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2"
    >
      {mode === "dark" ? "Dark" : "Light"} theme
    </button>
  );
}
