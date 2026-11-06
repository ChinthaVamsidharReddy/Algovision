import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="text-center text-muted">Loading…</p>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
