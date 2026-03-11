import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { useAuth } from "../auth/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(password);
      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Set a new password for your account."
      footer={
        <>
          {isAuthenticated ? <Link to="/">Back to app</Link> : <Link to="/login">Back to login</Link>}
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <label htmlFor="confirmPassword">Confirm new password</label>
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
        {success ? <p className="auth-info">{success}</p> : null}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

