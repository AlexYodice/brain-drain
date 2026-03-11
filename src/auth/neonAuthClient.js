import { createAuthClient } from "@neondatabase/neon-js/auth";

const RAW_NEON_AUTH_URL = (import.meta.env.VITE_NEON_AUTH_URL ?? "").trim();

function getAuthUrl() {
  if (!RAW_NEON_AUTH_URL) {
    throw new Error("Missing VITE_NEON_AUTH_URL.");
  }

  let parsed;
  try {
    parsed = new URL(RAW_NEON_AUTH_URL);
  } catch {
    throw new Error("Invalid VITE_NEON_AUTH_URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname.includes("neondb") || hostname.includes("-pooler") || !hostname.includes("neonauth")) {
    throw new Error("VITE_NEON_AUTH_URL must be the Neon Auth URL from Neon -> Auth -> Configuration.");
  }

  return RAW_NEON_AUTH_URL.replace(/\/+$/, "");
}

let authClient = null;

function getAuthClient() {
  if (!authClient) {
    authClient = createAuthClient(getAuthUrl());
  }
  return authClient;
}

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || error.error_description || error.statusText || fallback;
}

async function unwrap(resultPromise, fallbackMessage) {
  const result = await resultPromise;
  if (result?.error) {
    throw new Error(getErrorMessage(result.error, fallbackMessage));
  }
  return result?.data ?? null;
}

function normalizeSession(data) {
  const session = data?.session ?? data ?? null;
  const user = data?.user ?? session?.user ?? null;
  const accessToken = session?.token ?? session?.access_token ?? data?.token ?? null;
  const refreshToken = session?.refreshToken ?? session?.refresh_token ?? data?.refresh_token ?? null;

  if (!accessToken) return null;
  return {
    ...session,
    access_token: accessToken,
    refresh_token: refreshToken,
    user,
  };
}

export async function neonGetSession() {
  const data = await unwrap(getAuthClient().getSession(), "Failed to load auth session.");
  return normalizeSession(data);
}

export async function neonSignUp(email, password, name = "") {
  const data = await unwrap(
    getAuthClient().signUp.email({
      email,
      password,
      name: name || email?.split("@")?.[0] || "User",
    }),
    "Sign up failed."
  );
  return normalizeSession(data) ?? data;
}

export async function neonSignIn(email, password) {
  const data = await unwrap(getAuthClient().signIn.email({ email, password }), "Sign in failed.");
  const session = normalizeSession(data);
  if (!session) {
    throw new Error("Sign in succeeded but no session was returned.");
  }
  return session;
}

export async function neonSignInWithProvider(provider, callbackURL) {
  return unwrap(
    getAuthClient().signIn.social({
      provider,
      callbackURL,
    }),
    "OAuth sign-in failed."
  );
}

export async function neonSignOut() {
  await unwrap(getAuthClient().signOut(), "Sign out failed.");
}

export async function neonSendPasswordReset(email, redirectTo) {
  await unwrap(
    getAuthClient().requestPasswordReset({
      email,
      redirectTo,
    }),
    "Password reset request failed."
  );
}

export async function neonUpdatePassword(newPassword) {
  await unwrap(
    getAuthClient().resetPassword({
      newPassword,
    }),
    "Password update failed."
  );
}
