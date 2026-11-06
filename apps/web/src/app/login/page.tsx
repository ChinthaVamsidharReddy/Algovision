import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="text-center text-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
