"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuthClient } from "./auth-provider";
import { AuthCard, Field, FormMessage, SubmitButton, describeError } from "./form-parts";

export function ForgotPasswordForm() {
  const client = useAuthClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setDone(await client.forgotPassword(email));
    } catch (err) {
      setError(describeError(err).form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Forgot your password?" intro="Enter your email and we will send a link to choose a new one.">
      {done ? (
        <div className="space-y-3">
          <FormMessage tone="success">{done}</FormMessage>
          <p className="text-sm text-muted">The link works once and expires in 30 minutes. Check your spam folder if it does not arrive.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} />
          <SubmitButton busy={busy}>Send reset link</SubmitButton>
        </form>
      )}
      <p className="text-sm">
        <Link href="/login" className="font-medium text-accent underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
