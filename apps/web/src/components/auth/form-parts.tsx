"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ApiError } from "@/lib/api";

export type FieldErrors = Readonly<Record<string, string>>;

/** Turns any thrown error into field messages plus one form-level message. */
export function describeError(error: unknown): { fields: FieldErrors; form: string | null; transient: boolean } {
  if (error instanceof ApiError) {
    const fields: Record<string, string> = {};
    for (const e of error.problem?.errors ?? []) fields[e.field] = e.message;
    const hasFields = Object.keys(fields).length > 0;
    return {
      fields,
      form: hasFields ? null : error.transient ? `${error.message} Please try again in a moment.` : error.message,
      transient: error.transient,
    };
  }
  return { fields: {}, form: "Something went wrong. Please try again.", transient: false };
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  readonly label: string;
  readonly error?: string | undefined;
  readonly hint?: string;
}

export function Field({ label, error, hint, type, ...rest }: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const described = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className={`min-h-11 w-full rounded-lg border bg-bg px-3 ${error ? "border-danger" : "border-border"}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2"
          >
            {shown ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm font-medium ${tone === "error" ? "border-danger text-danger" : "border-success text-success"}`}>
      {children}
    </p>
  );
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="min-h-11 w-full rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90 disabled:opacity-60"
    >
      {busy ? "Please wait…" : children}
    </button>
  );
}

export function AuthCard({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {intro && <p className="text-muted">{intro}</p>}
      </div>
      {children}
    </div>
  );
}
