import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { useAuth } from "../auth/AuthContext";

export default function SignupPage() {
  const { signUp, signIn, signInWithProvider, providerAvailability } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({ email, password });
      if (result?.access_token) {
        navigate("/", { replace: true });
        return;
      }

      // If Neon Auth requires email confirmation, this message guides the user.
      setInfo("Account created. Check your email to confirm your account, then sign in.");
      try {
        await signIn({ email, password });
        navigate("/", { replace: true });
      } catch {
        // Silent, user may need to confirm email first.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  }

  function providerLabel(provider) {
    return provider === "google" ? "Google" : "GitHub";
  }

  async function handleProviderSignup(provider) {
    setError("");
    setInfo("");
    setOauthLoading(provider);
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start social sign in.");
      setOauthLoading("");
    }
  }

  return (
    <AuthShell
      title="Sign up"
      subtitle="Create your Brain Drain account."
      footer={
        <>
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </>
      }
    >
      <div className="auth-social">
        <button
          className="auth-social-btn"
          type="button"
          onClick={() => handleProviderSignup("google")}
          disabled={oauthLoading === "google" || providerAvailability.google === false}
        >
          {oauthLoading === "google" ? "Opening Google..." : "Continue with Google"}
        </button>
        <button
          className="auth-social-btn"
          type="button"
          onClick={() => handleProviderSignup("github")}
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
      <div className="auth-divider"><span>or create with email</span></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
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
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {error ? <p className="auth-error">{error}</p> : null}
        {info ? <p className="auth-info">{info}</p> : null}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
