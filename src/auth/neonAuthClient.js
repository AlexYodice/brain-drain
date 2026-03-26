import { createAuthClient } from "@neondatabase/neon-js/auth";

const RAW_NEON_AUTH_URL = (import.meta.env.VITE_NEON_AUTH_URL ?? "").trim();
const AUTH_ENDPOINT_PREFIX = "api/auth";

function getAuthUrl() {
  if (!RAW_NEON_AUTH_URL) {
    throw new Error("Missing VITE_NEON_AUTH_URL.");
  }
  return RAW_NEON_AUTH_URL;
}

let authClient = null;
let hasLoggedBaseUrl = false;

function getEndpointBaseUrl() {
  const authUrl = getAuthUrl();
  const parsed = new URL(authUrl);
  const pathname = parsed.pathname.replace(/\/+$/, "");
  const basePath = pathname.endsWith(`/${AUTH_ENDPOINT_PREFIX}`) ? pathname : `${pathname}/${AUTH_ENDPOINT_PREFIX}`;
  return new URL(`${basePath.replace(/^\/+/, "")}/`, parsed.origin).toString();
}

function createRequestUrl(pathname) {
  return new URL(pathname.replace(/^\/+/, ""), getEndpointBaseUrl()).toString();
}

function logAuthBaseUrl() {
  if (hasLoggedBaseUrl) return;
  hasLoggedBaseUrl = true;
  console.info("[neon-auth] base URL:", getAuthUrl());
}

function logAuthRequest(label, pathname, details = null) {
  const url = createRequestUrl(pathname);
  if (details) {
    console.info(`[neon-auth] ${label}:`, { url, ...details });
    return;
  }
  console.info(`[neon-auth] ${label}:`, url);
}

function getAuthClient() {
  if (!authClient) {
    logAuthBaseUrl();
    authClient = createAuthClient(getAuthUrl());
  }
  return authClient;
}

function getErrorDetailLines(value, seen = new Set()) {
  if (value == null) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (typeof value !== "object") {
    return [String(value)];
  }
  if (seen.has(value)) return [];
  seen.add(value);

  const directKeys = [
    "message",
    "error",
    "error_description",
    "statusText",
    "body",
    "bodyText",
    "details",
    "code",
    "status",
  ];
  const nestedKeys = ["response", "cause", "data"];
  const lines = [];

  for (const key of directKeys) {
    if (key in value) {
      lines.push(...getErrorDetailLines(value[key], seen));
    }
  }

  for (const key of nestedKeys) {
    if (key in value) {
      lines.push(...getErrorDetailLines(value[key], seen));
    }
  }

  if (lines.length === 0) {
    try {
      return [JSON.stringify(value)];
    } catch {
      return [];
    }
  }

  return lines;
}

function getErrorMessage(error, fallback) {
  const details = [...new Set(getErrorDetailLines(error))].filter(Boolean);
  return details[0] || fallback;
}

async function unwrap(resultPromise, fallbackMessage) {
  try {
    const result = await resultPromise;
    if (result?.error) {
      console.error("[neon-auth] request failed:", result.error);
      throw new Error(getErrorMessage(result.error, fallbackMessage));
    }
    return result?.data ?? null;
  } catch (error) {
    console.error("[neon-auth] request threw:", error);
    throw new Error(getErrorMessage(error, fallbackMessage));
  }
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
  logAuthRequest("get-session", "get-session");
  const data = await unwrap(getAuthClient().getSession(), "Failed to load auth session.");
  return normalizeSession(data);
}

export async function neonSignUp(email, password, name = "") {
  logAuthRequest("sign-up/email", "sign-up/email", {
    payloadKeys: ["email", "password", "name"],
  });
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
  logAuthRequest("sign-in/email", "sign-in/email", {
    payloadKeys: ["email", "password"],
  });
  const data = await unwrap(getAuthClient().signIn.email({ email, password }), "Sign in failed.");
  const session = normalizeSession(data);
  if (!session) {
    throw new Error("Sign in succeeded but no session was returned.");
  }
  return session;
}

export async function neonSignInWithProvider(provider, callbackURL) {
  logAuthRequest("sign-in/social", "sign-in/social", {
    provider,
    callbackURL,
  });
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
