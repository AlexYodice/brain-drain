const RECENT_EMAILS_KEY = "brain-drain-recent-emails";
const MAX_RECENT_EMAILS = 5;

export function readRecentEmails() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_EMAILS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value) => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}

export function saveRecentEmail(email) {
  if (typeof window === "undefined") return;

  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  if (!normalizedEmail) return;

  try {
    const nextEmails = [
      normalizedEmail,
      ...readRecentEmails().filter((value) => value !== normalizedEmail),
    ].slice(0, MAX_RECENT_EMAILS);

    window.localStorage.setItem(RECENT_EMAILS_KEY, JSON.stringify(nextEmails));
  } catch {
    // Ignore localStorage write failures and keep auth flow uninterrupted.
  }
}
