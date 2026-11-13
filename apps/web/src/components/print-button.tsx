"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-2 print:hidden">
      Print or save as PDF
    </button>
  );
}
