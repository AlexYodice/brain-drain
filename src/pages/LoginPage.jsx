import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { useAuth } from "../auth/AuthContext";
import { readRecentEmails, saveRecentEmail } from "../auth/recentEmailStore";

export default function LoginPage() {
  const { signIn, signInWithProvider, providerAvailability } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordInputRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [recentEmails, setRecentEmails] = useState([]);
  const from = location.state?.from?.pathname ?? "/";
  const primaryRecentEmail = recentEmails[0] ?? "";

  useEffect(() => {
    setRecentEmails(readRecentEmails());
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ email, password });
      saveRecentEmail(email);
      setRecentEmails(readRecentEmails());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  function providerLabel(provider) {
    return provider === "google" ? "Google" : "GitHub";
  }

  async function handleProviderLogin(provider) {
    setError("");
    setOauthLoading(provider);
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start social sign in.");
      setOauthLoading("");
    }
  }

  function handleAutofillEmail(nextEmail) {
    setEmail(nextEmail);
    setError("");
    passwordInputRef.current?.focus();
  }

  return (
    <AuthShell
      title="Login"
      subtitle="Welcome back. Sign in to open your notebooks."
      footer={
        <>
          <Link to="/signup">Create account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </>
      }
    >
      <div className="auth-social">
        <button
          className="auth-social-btn"
          type="button"
          onClick={() => handleProviderLogin("google")}
          disabled={oauthLoading === "google" || providerAvailability.google === false}
        >
          {oauthLoading === "google" ? "Opening Google..." : "Continue with Google"}
        </button>
        <button
          className="auth-social-btn"
          type="button"
          onClick={() => handleProviderLogin("github")}
          disabled={oauthLoading === "github" || providerAvailability.github === false}
        >
          {oauthLoading === "github" ? "Opening GitHub..." : "Continue with GitHub"}
        </button>
        {(providerAvailability.google === false || providerAvailability.github === false) && (
          <p className="auth-provider-note">
            {["google", "github"]
              .filter((p) => providerAvailability[p] === false)
              .map(providerLabel)
              .join(" and ")}{" "}
            sign-in is not configured yet.
          </p>
        )}
      </div>
      <div className="auth-divider"><span>or use email</span></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {recentEmails.length > 0 && (
          <div className="auth-recent-list" aria-label="Recent account emails">
            {recentEmails.map((recentEmail) => (
              <div className="auth-recent-item" key={recentEmail}>
                <span className="auth-recent-email">{recentEmail}</span>
                <button
                  className="auth-recent-button"
                  type="button"
                  onClick={() => handleAutofillEmail(recentEmail)}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="auth-label-row">
          <label htmlFor="email">Email</label>
          <button
            className="auth-inline-fill-button"
            type="button"
            onClick={() => handleAutofillEmail(primaryRecentEmail)}
            disabled={!primaryRecentEmail}
            title={primaryRecentEmail ? `Use ${primaryRecentEmail}` : "No saved email yet"}
          >
            {primaryRecentEmail ? "Use saved" : "No saved email"}
          </button>
        </div>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          ref={passwordInputRef}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? <p className="auth-error">{error}</p> : null}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}
