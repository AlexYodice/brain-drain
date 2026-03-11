import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="neon-hero-bg auth-page">
      <Link
        to="/login"
        style={{
          position: "fixed",
          top: 24,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          zIndex: 5,
          textDecoration: "none",
        }}
      >
        <img
          src="/favicon.png"
          alt=""
          className="brand-icon-corner"
          style={{
            width: 220,
            height: 220,
            objectFit: "contain",
            opacity: 0.45,
            mixBlendMode: "screen",
            filter: "brightness(1.8) contrast(1.55)",
          }}
        />
        <span
          style={{
            color: "#ffffff",
            fontSize: 40,
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 500,
            letterSpacing: "0.015em",
            fontStyle: "normal",
            textShadow: "0 0 16px rgba(0, 230, 118, 0.28)",
          }}
        >
          Brain Drain
        </span>
      </Link>
      <main className="auth-card">
        <h1>{title}</h1>
        {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </main>
    </div>
  );
}
