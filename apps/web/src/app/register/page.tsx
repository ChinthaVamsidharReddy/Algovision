import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="text-center text-muted">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
