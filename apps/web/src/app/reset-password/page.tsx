import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="text-center text-muted">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
