"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeNext } from "@/lib/auth-client";
import { useAuthClient } from "./auth-provider";
import { AuthCard, Field, FormMessage, SubmitButton, describeError, type FieldErrors } from "./form-parts";

export function LoginForm() {
  const client = useAuthClient();
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const justReset = search.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const [form, setForm] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const local: Record<string, string> = {};
    if (!email.trim()) local.email = "Enter your email.";
    if (!password) local.password = "Enter your password.";
    setFields(local);
    setForm(null);
    if (Object.keys(local).length > 0) return;
    setBusy(true);
    try {
      await client.login(email, password);
      router.replace(next);
    } catch (error) {
      const d = describeError(error);
      setFields(d.fields);
      setForm(d.form);
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Sign in" intro="Save your progress and bookmarks across devices.">
      {justReset && <FormMessage tone="success">Your password was changed. Sign in with the new one.</FormMessage>}
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} />
        <Field label="Password" type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fields.password} />
        {form && <FormMessage tone="error">{form}</FormMessage>}
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <p className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/forgot-password" className="font-medium text-accent underline">
          Forgot your password?
        </Link>
        <span>
          New here?{" "}
          <Link href={next === "/dashboard" ? "/register" : `/register?next=${encodeURIComponent(next)}`} className="font-medium text-accent underline">
            Create an account
          </Link>
        </span>
      </p>
    </AuthCard>
  );
}
