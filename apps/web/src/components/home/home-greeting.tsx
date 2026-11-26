"use client";

import Link from "next/link";
import { useAuth } from "../auth/auth-provider";

/** "Welcome back, Asha" for a signed-in learner, a gentle sign-up nudge for a guest. */
export function HomeGreeting() {
  const auth = useAuth();
  const name = auth.status === "authenticated" ? auth.user.fullName.split(" ")[0] : "";
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
        {name ? (
          <>
            Welcome back, <span className="lp-gradient-text">{name}</span>
          </>
        ) : (
          <>
            Welcome to <span className="lp-gradient-text">AlgoMigo</span>
          </>
        )}
      </h1>
      <p className="max-w-2xl text-lg text-muted">
        {name ? (
          <>
            Pick up where you left off, or start something new. Your <Link href="/dashboard" className="font-semibold text-accent underline">dashboard</Link> has your progress.
          </>
        ) : (
          <>
            Pick anything below and press play. <Link href="/register" className="font-semibold text-accent underline">Create a free account</Link> any time to save your progress.
          </>
        )}
      </p>
    </div>
  );
}
