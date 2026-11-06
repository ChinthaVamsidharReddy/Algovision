"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { AuthClient, type AuthState } from "@/lib/auth-client";

const AuthContext = createContext<AuthClient | null>(null);

/** One AuthClient for the whole app; restores a saved session once on load. */
export function AuthProvider({ children, client }: { children: ReactNode; client?: AuthClient }) {
  const value = useMemo(() => client ?? new AuthClient(), [client]);
  useEffect(() => {
    void value.init();
  }, [value]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthClient(): AuthClient {
  const client = useContext(AuthContext);
  if (!client) throw new Error("useAuthClient must be used inside <AuthProvider>");
  return client;
}

/** null outside a provider, so components can render in isolation (tests, previews). */
export function useOptionalAuthClient(): AuthClient | null {
  return useContext(AuthContext);
}

const LOADING: AuthState = { status: "loading" };

export function useAuth(): AuthState {
  const client = useAuthClient();
  return useSyncExternalStore(client.subscribe, client.getState, () => LOADING);
}
