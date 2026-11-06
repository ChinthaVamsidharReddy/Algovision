"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuthClient } from "./auth-provider";
import { AuthCard, Field, FormMessage, SubmitButton, describeError, type FieldErrors } from "./form-parts";

export function ResetPasswordForm() {
  const client = useAuthClient();
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const [form, setForm] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  if (!token) {
    return (
      <AuthCard title="Reset link missing">
        <FormMessage tone="error">This page needs the link from your email.</FormMessage>
        <Link href="/forgot-password" className="text-sm font-medium text-accent underline">
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const local: Record<string, string> = {};
    if (password.length < 10) local.password = "Use at least 10 characters.";
    else if (password !== confirm) local.confirm = "The passwords do not match.";
    setFields(local);
    setForm(null);
    if (Object.keys(local).length > 0) return;
    setBusy(true);
    try {
      await client.resetPassword(token, password);
      router.replace("/login?reset=1");
    } catch (error) {
      const d = describeError(error);
      if (error instanceof Error && "problem" in error && (error as { problem?: { code?: string } }).problem?.code === "RESET_TOKEN_INVALID") setExpired(true);
      setFields(d.fields);
      setForm(d.form);
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Choose a new password" intro="You will be signed out everywhere and asked to sign in again.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="New password" type="password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fields.password} hint="At least 10 characters." />
        <Field label="Repeat new password" type="password" name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={fields.confirm} />
        {form && <FormMessage tone="error">{form}</FormMessage>}
        {expired && (
          <Link href="/forgot-password" className="block text-sm font-medium text-accent underline">
            Request a new link
          </Link>
        )}
        <SubmitButton busy={busy}>Change password</SubmitButton>
      </form>
    </AuthCard>
  );
}
