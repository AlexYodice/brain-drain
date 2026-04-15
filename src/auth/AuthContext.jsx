/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  neonGetSession,
  neonSendPasswordReset,
  neonSignIn,
  neonSignInWithProvider,
  neonSignOut,
  neonSignUp,
  neonUpdatePassword,
} from "./neonAuthClient";

const AuthContext = createContext(null);
function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserFromSession(session, userFromApi = null) {
  if (userFromApi?.id) return userFromApi;
  if (session?.user?.id) return session.user;
  const payload = decodeJwtPayload(session?.access_token);
  if (!payload?.sub) return null;
  return {
    id: payload.sub,
    email: payload.email ?? "",
  };
}

function getRecoverySessionFromHash() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;

  return {
    access_token,
    refresh_token,
    expires_in: Number(params.get("expires_in") ?? 3600),
    token_type: params.get("token_type") ?? "bearer",
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [providerAvailability] = useState({
    google: null,
    github: null,
  });

  const setAuthState = useCallback((nextSession, nextUser = null) => {
    setSession(nextSession);
    const resolvedUser = getUserFromSession(nextSession, nextUser);
    setUser(resolvedUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const recoverySession = getRecoverySessionFromHash();
        if (recoverySession) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          setAuthState(recoverySession);
          setIsReady(true);
          return;
        }
        const activeSession = await neonGetSession();
        if (!cancelled) setAuthState(activeSession);
      } catch {
        if (!cancelled) setAuthState(null);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [setAuthState]);

  const signIn = useCallback(
    async ({ email, password }) => {
      const nextSession = await neonSignIn(email, password);
      setAuthState(nextSession);
      return nextSession;
    },
    [setAuthState]
  );

  const signUp = useCallback(async ({ email, password }) => {
    const result = await neonSignUp(email, password);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await neonSignOut();
    } catch {
      // Ignore network/auth errors and clear local session either way.
    } finally {
      setAuthState(null);
    }
  }, [setAuthState]);

  const sendPasswordReset = useCallback(async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    await neonSendPasswordReset(email, redirectTo);
  }, []);

  const signInWithProvider = useCallback(async (provider) => {
    const normalized = String(provider || "").toLowerCase();
    if (normalized !== "google" && normalized !== "github") {
      throw new Error("Unsupported OAuth provider.");
    }

    const availability = providerAvailability[normalized];
    if (availability === false) {
      throw new Error(`${normalized[0].toUpperCase()}${normalized.slice(1)} sign-in is not configured yet.`);
    }

    const redirectTo = `${window.location.origin}/`;
    await neonSignInWithProvider(normalized, redirectTo);
  }, [providerAvailability]);

  const resetPassword = useCallback(
    async (newPassword) => {
      await neonUpdatePassword(newPassword);
    },
    []
  );

  const value = useMemo(
    () => ({
      session,
      user,
      isReady,
      isAuthenticated: Boolean(session?.access_token && user?.id),
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      signInWithProvider,
      resetPassword,
      providerAvailability,
    }),
    [
      session,
      user,
      isReady,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      signInWithProvider,
      resetPassword,
      providerAvailability,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return ctx;
}
