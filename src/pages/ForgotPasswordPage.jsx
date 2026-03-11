import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "./AuthShell";
import { useAuth } from "../auth/AuthContext";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess("Reset email sent. Check your inbox for the password reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your account email and we will send a reset link."
      footer={<Link to="/login">Back to login</Link>}
    >
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

        {error ? <p className="auth-error">{error}</p> : null}
        {success ? <p className="auth-info">{success}</p> : null}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </button>
      </form>
    </AuthShell>
  );
}

