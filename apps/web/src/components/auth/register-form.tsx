"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeNext } from "@/lib/auth-client";
import { useAuthClient } from "./auth-provider";
import { AuthCard, Field, FormMessage, SubmitButton, describeError, type FieldErrors } from "./form-parts";

export function RegisterForm() {
  const client = useAuthClient();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const [form, setForm] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const local: Record<string, string> = {};
    if (!fullName.trim()) local.fullName = "Enter your name.";
    if (!email.trim()) local.email = "Enter your email.";
    if (password.length < 10) local.password = "Use at least 10 characters.";
    setFields(local);
    setForm(null);
    if (Object.keys(local).length > 0) return;
    setBusy(true);
    try {
      await client.register(email, password, fullName);
      router.replace(next);
    } catch (error) {
      const d = describeError(error);
      setFields(d.fields);
      setForm(d.form);
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your account" intro="Free. Your progress and bookmarks are saved to your account.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name" name="fullName" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={fields.fullName} />
        <Field label="Email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fields.password}
          hint="At least 10 characters. Avoid common passwords and your email name."
        />
        {form && <FormMessage tone="error">{form}</FormMessage>}
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
      <p className="text-sm">
        Already registered?{" "}
        <Link href={next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="font-medium text-accent underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
