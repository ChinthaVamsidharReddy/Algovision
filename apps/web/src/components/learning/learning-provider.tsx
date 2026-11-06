"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { LearningClient, type LearningState } from "@/lib/learning-client";
import { useAuth, useAuthClient } from "../auth/auth-provider";

const LearningContext = createContext<LearningClient | null>(null);

/** Loads the signed-in user's progress and bookmarks, and clears them on sign-out. */
export function LearningProvider({ children, client }: { children: ReactNode; client?: LearningClient }) {
  const auth = useAuthClient();
  const state = useAuth();
  const value = useMemo(() => client ?? new LearningClient(auth), [client, auth]);
  const userId = state.status === "authenticated" ? state.user.id : null;
  useEffect(() => {
    if (userId) void value.load();
    else value.reset();
  }, [userId, value]);
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

/** null outside a provider (for example in isolated component tests), so callers can render without it. */
export function useLearningClient(): LearningClient | null {
  return useContext(LearningContext);
}

const IDLE: LearningState = { status: "idle", progress: new Map(), bookmarks: new Set(), pending: new Set(), error: null, actionError: null };
const NOOP = () => () => {};

export function useLearning(): LearningState {
  const client = useLearningClient();
  return useSyncExternalStore(client ? client.subscribe : NOOP, client ? client.getState : () => IDLE, () => IDLE);
}
