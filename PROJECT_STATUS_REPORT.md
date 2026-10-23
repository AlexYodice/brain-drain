# Project Status Report

> Snapshot of the app before the backpack redesign (October 2026). Code excerpts below reflect that older state.

1. Project overview

- What this app currently does
  - Brain Drain is currently a browser-based authenticated note/notebook app with a strong capture-first flavor. After login, the user lands in a notebook list, can create notebooks, enter a notebook, create pages, type into a page, and optionally use browser speech recognition to transcribe voice directly into the active page.
- Main user flow right now
  - User visits `/login`.
  - User signs in with Neon email/password, OAuth, or the current local dev shortcut in dev mode.
  - Authenticated user lands on `/`.
  - `/` renders `BrainDrainApp`, which first shows the notebook list view.
  - User creates or selects a notebook.
  - Inside a notebook, user creates pages, edits titles/body text, searches/sorts pages, and can record speech into the active page.
  - Notebook data and page data persist in browser `localStorage`, not in the backend database.
- Tech stack
  - Frontend: React 19, React Router 7, Vite 7.
  - Styling: plain CSS in `src/index.css` plus a large amount of inline style objects inside `src/BrainDrainApp.jsx`.
  - Auth: Neon auth client via `@neondatabase/neon-js/auth`.
  - Backend: Express 5 + `pg` with a minimal Postgres health-check server.
- Routing setup
  - Routing lives in `src/App.jsx`.
  - Public/guest routes: `/login`, `/signup`, `/forgot-password`.
  - Semi-public route: `/reset-password`.
  - Protected route: `/`.
  - Fallback route: `*` redirects to `/`.
- Auth setup
  - `src/auth/AuthContext.jsx` owns auth state.
  - On boot it checks password recovery tokens from the URL hash, a dev-only fallback session in local storage, then Neon session state.
  - `ProtectedRoute` gates `/`.
  - `GuestOnly` prevents authenticated users from seeing login/signup/forgot pages.
  - (Removed 2026-10-22) The worktree previously included a dev-only shortcut login with hardcoded practice credentials; it has been deleted and only Neon auth remains.
- Database/storage setup
  - Main app content is not coming from the backend database.
  - Notebooks and entries are stored per-user in browser `localStorage` under a user-specific key generated in `BrainDrainApp.jsx`.
  - The backend Postgres connection only serves `/health` right now.
  - Auth sessions are handled by Neon auth, plus a dev fallback session in local storage during local development.
- State management approach
  - Active app: mostly local component state and derived `useMemo` state inside `src/BrainDrainApp.jsx`, plus `AuthContext` for auth.
  - Older unused architecture: `EntriesContext` and `useSpeechRecognition` exist but are no longer wired into the active router.

2. Current file structure

- Important folder tree only

```text
.
├─ server/
│  └─ server.js
├─ src/
│  ├─ auth/
│  │  ├─ AuthContext.jsx
│  │  ├─ neonAuthClient.js
│  │  └─ recentEmailStore.js
│  ├─ components/
│  │  └─ ProtectedRoute.jsx
│  ├─ context/
│  │  └─ EntriesContext.jsx
│  ├─ hooks/
│  │  └─ useSpeechRecognition.js
│  ├─ pages/
│  │  ├─ AuthShell.jsx
│  │  ├─ Entry.jsx
│  │  ├─ ForgotPasswordPage.jsx
│  │  ├─ Home.jsx
│  │  ├─ LoginPage.jsx
│  │  ├─ NewEntry.jsx
│  │  ├─ ResetPasswordPage.jsx
│  │  └─ SignupPage.jsx
│  ├─ App.css
│  ├─ App.jsx
│  ├─ BrainDrainApp.jsx
│  ├─ index.css
│  └─ main.jsx
├─ public/
│  ├─ background.gif
│  ├─ favicon.png
│  └─ vite.svg
├─ vite.config.js
├─ package.json
└─ README.md
```

- Notes on structure
  - `src/BrainDrainApp.jsx` is the real product shell for the protected app and contains most current notebook/page/capture logic.
  - `src/pages/Home.jsx`, `src/pages/Entry.jsx`, `src/pages/NewEntry.jsx`, `src/context/EntriesContext.jsx`, and `src/hooks/useSpeechRecognition.js` look like an older simpler app architecture and are currently leftovers, not active routes.
  - `pr-music-app/` is an unrelated untracked folder and is not part of the current app.
  - Backend structure is only `server/server.js`; there is no broader API layer yet.

3. Main screens and purpose

- `src/pages/LoginPage.jsx`
  - Route path: `/login`
  - Current purpose: sign in with Neon email/password, OAuth, recent-email autofill, and current local dev shortcut.
  - Renders: `AuthShell`, email/password form, Google/GitHub buttons, recent email list, inline autofill button.
  - Device scope: shared.
- `src/pages/SignupPage.jsx`
  - Route path: `/signup`
  - Current purpose: sign up with email/password or start OAuth.
  - Renders: `AuthShell`, signup form, Google/GitHub buttons.
  - Device scope: shared.
- `src/pages/ForgotPasswordPage.jsx`
  - Route path: `/forgot-password`
  - Current purpose: request password reset email.
  - Renders: `AuthShell`, email form.
  - Device scope: shared.
- `src/pages/ResetPasswordPage.jsx`
  - Route path: `/reset-password`
  - Current purpose: set a new password after recovery.
  - Renders: `AuthShell`, password reset form.
  - Device scope: shared.
- `src/BrainDrainApp.jsx`
  - Route path: `/`
  - Current purpose: the entire authenticated app.
  - Renders two major internal states:
    - Notebook list view (`view === "notebooks"`)
    - Notebook/page editor view
  - Renders: notebook search/sort/create UI, notebook menu actions, page list, page editor, speech transcription panel, logout, back-to-notebooks control.
  - Device scope: shared, but not truly split into mobile-specific vs desktop-specific components.
- `src/pages/Home.jsx`
  - Route path: none currently.
  - Current purpose: legacy home screen for the old entries-only architecture.
  - Renders: searchable entry list with `Link` cards.
  - Device scope: shared, unused.
- `src/pages/NewEntry.jsx`
  - Route path: none currently.
  - Current purpose: legacy capture-first flow using `useSpeechRecognition`.
  - Renders: record/review flow, microphone button, transcript preview.
  - Device scope: shared, unused.
- `src/pages/Entry.jsx`
  - Route path: none currently.
  - Current purpose: legacy note detail/editor screen.
  - Renders: entry meta, body, edit mode.
  - Device scope: shared, unused.

4. Navigation flow

- login
  - User enters at `/login`.
  - If already authenticated, `GuestOnly` redirects them to `/`.
  - Sign-in succeeds and user is navigated to the original protected target or `/`.
- landing page
  - There is no distinct marketing landing page.
  - The login page is effectively the public entry screen.
- home
  - After auth, `/` opens the notebook list state inside `BrainDrainApp`.
- notebook view
  - User sees searchable/sortable notebooks.
  - User can create, rename, delete, lock/unlock, and open notebooks.
- note view
  - Once inside a notebook, the left sidebar lists pages and the main pane shows the active page.
  - Selecting a page updates the active editor.
- creation flow
  - Create notebook from the notebook list.
  - Create page from the notebook detail sidebar.
  - New pages start as `Untitled` with empty text.
- voice or capture flow
  - In the active notebook detail view, the transcription panel can start browser speech recognition.
  - Recording creates a page automatically if no page exists yet.
  - Final transcription chunks are appended into the active page text.
- profile/settings
  - There is no profile page or settings screen.
  - The only user identity display is the email pill in the notebook list view.
- logout
  - Logout exists in notebook list view and notebook detail view.
  - It clears auth state and returns user to `/login`.

5. Responsive design status

- What currently changes between mobile and desktop
  - Very little changes by viewport.
  - CSS includes small responsive tweaks for the transcription panel buttons and brand icon size.
  - The main protected app uses shared layout logic rather than dedicated mobile/desktop branches.
- What is shared
  - Auth screens are shared.
  - Protected notebook/page experience is shared.
  - Same logic, same component tree, same styles are mostly used everywhere.
- What breaks
  - The protected app is heavily inline-styled and desktop-shaped, especially the sidebar/editor layout.
  - There is no dedicated mobile nav or bottom nav.
  - Complex inline layout logic in `BrainDrainApp.jsx` likely makes smaller-screen refinements awkward.
- What feels inconsistent between mobile and desktop
  - Public auth experience is card-based and fairly centered.
  - Protected experience shifts into a denser, utility-like notebook editor shell.
  - Older leftover files (`Home`, `NewEntry`, `Entry`, `App.css`) reflect a different visual system than the current neon notebook UI.
- Any duplicated UI logic
  - Auth forms repeat similar OAuth blocks across login and signup.
  - Styling is split between `index.css` and inline `styles` object in `BrainDrainApp.jsx`.
  - Old and new note/capture flows coexist in parallel code paths.
- Any separate mobile and desktop components
  - None found.

6. Key UI files

- `src/pages/LoginPage.jsx`
  - Current login screen with email, OAuth, recent-email autofill, and dev login button.
- `src/pages/SignupPage.jsx`
  - Current signup screen.
- `src/pages/ForgotPasswordPage.jsx`
  - Reset request screen.
- `src/pages/ResetPasswordPage.jsx`
  - Password reset screen.
- `src/pages/AuthShell.jsx`
  - Shared auth page framing and branding.
- `src/BrainDrainApp.jsx`
  - Most important current UX file; owns notebook list, page editor, transcription UI, and most protected layout.
- `src/index.css`
  - Main active stylesheet for auth screens and shared visual tokens.
- `src/auth/AuthContext.jsx`
  - Auth state, session boot logic, sign-in/out, reset flows, current dev fallback.
- `src/auth/neonAuthClient.js`
  - Neon auth service wrapper and error normalization.
- `src/auth/recentEmailStore.js`
  - Stores recent login emails for autofill.
- `src/components/ProtectedRoute.jsx`
  - Protects the authenticated route.
- `src/pages/Home.jsx`
  - Legacy home/dashboard file from an older entry-based architecture.
- `src/pages/NewEntry.jsx`
  - Legacy capture/mic flow file from older architecture.
- `src/pages/Entry.jsx`
  - Legacy note editor/view file from older architecture.
- `src/context/EntriesContext.jsx`
  - Legacy notebook-free entry store.
- `src/hooks/useSpeechRecognition.js`
  - Legacy capture hook, currently unused by the active routed app.
- `src/App.css`
  - Legacy stylesheet matching the old architecture, appears unused by the active routed experience.

7. Current problems or unfinished parts

- broken features
  - Backend data is not wired into notebooks/pages at all.
  - Password-locked notebooks are implemented with `prompt`, `confirm`, and SHA-256 in browser local state, not a durable secure backend model.
- placeholder UI
  - There is no real profile/settings area.
  - Provider availability is hardcoded to `null` in auth context, so OAuth configuration status is not truly discovered.
- incomplete flows
  - No dedicated notebook detail route or note detail route; everything lives inside `/` and internal component state.
  - No public landing page.
  - No real capture inbox / processing queue / AI result flow.
- dead routes
  - No dead routes in the active router, but multiple legacy page files are not mounted anywhere.
- fake data
  - Current dev worktree includes a local dev-only login shortcut with hardcoded credentials.
  - Notebook/page data is local-only, not shared or synced.
- missing backend integration
  - Express server does not serve notebook/page CRUD.
  - Postgres is not used by the frontend app data model.
- known bugs / risks
  - `BrainDrainApp.jsx` is very large and mixes state, storage, layout, and behavior.
  - Inline menus use text/icon encoding that appears mangled in file output (`â‹¯`, `ðŸ”’`, `Aâ€“Z`).
  - Speech recognition depends entirely on browser support and permissions.
- duplicated code
  - OAuth UI duplicated in login and signup.
  - Old and new architectures coexist.
- anything that may block redesign
  - Most user flow logic is centralized in one giant file, so redesign work has high blast radius unless the app is first decomposed.
  - Because `/` holds both notebook list and notebook detail/editor states, route-based redesign will require untangling internal state transitions.

8. Design system / styling

- Styling approach
  - Plain CSS in `src/index.css` plus heavy inline style objects in `src/BrainDrainApp.jsx`.
  - `src/App.css` is a leftover stylesheet from the older UI and likely not active in the current routed app.
- Color system
  - Dark neon palette with black backgrounds, green accent, teal/blue support colors, muted gray text.
  - Uses CSS variables like `--neon-bg`, `--neon-accent`, `--neon-text-muted`.
- Typography patterns
  - Global body font is currently `Inter/system-ui` in `index.css`.
  - Brand/title areas use `Fraunces` or serif inline styles.
  - Older `App.css` references a different style system.
- Spacing/layout patterns
  - Auth screens use centered card layout.
  - Protected app uses fixed inline layout sections for sidebar/list/editor.
- Reusable UI primitives
  - Limited reuse. There are conceptual button/input styles, but many are inline objects instead of reusable components.
- Dark mode or theme handling
  - No theme switcher.
  - Entire app is effectively dark mode only.

9. Notebook and note architecture

- Where notebook data comes from
  - `localStorage` via `BrainDrainApp.jsx` state boot logic.
- Where note data comes from
  - Also `localStorage`, stored as `entries` within the same state object.
- How notebooks are created
  - `createNotebook(name)` inside `BrainDrainApp.jsx` creates a notebook object with `id`, `name`, `createdAt`, `isLocked`, `passwordHash`.
- How notes are created
  - `createNewEntry()` creates a new page for the active notebook.
  - Recording can also auto-create a new page when no page is active.
- How note detail opens
  - No route change.
  - Selecting a page updates internal state and swaps the editor pane.
- Any tags/archive/search logic
  - Search exists for notebooks and pages.
  - Sort exists for notebooks and pages.
  - No tags, archive, trash, or pinning model.

10. Capture / brain dump architecture

- Is there currently a capture-first flow?
  - Partially.
  - The live app has a transcription panel embedded in notebook detail.
  - The older unused `NewEntry.jsx` was more explicitly capture-first.
- Is there text entry?
  - Yes. Active page text is edited directly in a textarea.
- Is there voice input?
  - Yes, through browser `SpeechRecognition` / `webkitSpeechRecognition`.
- Is there any AI processing?
  - No true AI processing in the current app flow.
  - Speech-to-text is browser speech recognition, not an app-side AI pipeline.
- Which files control this behavior?
  - Active capture flow: `src/BrainDrainApp.jsx`.
  - Legacy capture flow: `src/pages/NewEntry.jsx` and `src/hooks/useSpeechRecognition.js`.

11. Best files to edit first for a flow redesign

- `src/BrainDrainApp.jsx`
  - The main protected experience and current flow choke point.
- `src/App.jsx`
  - Router entry point; needed if redesign introduces clearer route structure.
- `src/pages/AuthShell.jsx`
  - Shared public/auth identity shell.
- `src/pages/LoginPage.jsx`
  - Current first impression and dev-entry behavior.
- `src/index.css`
  - Current live visual token base.
- `src/auth/AuthContext.jsx`
  - Auth/session assumptions that affect all redesigned flows.
- `src/auth/neonAuthClient.js`
  - Service edge for auth behavior.
- `src/pages/Home.jsx`
  - Useful reference for the older simpler capture/list pattern, even if unused.
- `src/pages/NewEntry.jsx`
  - Useful reference if the redesign wants mobile to feel more capture-first.
- `src/context/EntriesContext.jsx`
  - Useful reference if redesign wants to recover a simpler state/store split instead of a single giant component.

12. Paste code for the most important files

- Included below for files that exist and are relevant to current or leftover architecture.
- There is no separate dedicated router file beyond `src/App.jsx`.
- There is no separate `MainLayout` component; current layout responsibility is split between `src/pages/AuthShell.jsx` and `src/BrainDrainApp.jsx`.
- There is no dedicated notebook list page route or notebook detail page route in the active router; both states currently live inside `src/BrainDrainApp.jsx`.
- There is no dedicated mobile nav or desktop nav component file.

13. Final summary

- current architecture in plain English
  - This app is a React/Vite auth shell around one large protected component that stores notebooks and pages in browser local storage and lets users type or dictate notes inside notebooks.
- what is working
  - Auth screens and auth routing, protected route gating, local notebook/page CRUD, local search/sort, browser speech capture into active pages, notebook list and editor views.
- what is messy
  - The protected app is concentrated in one huge component, backend data is not integrated, old and new architectures both remain in the repo, and route structure is much flatter than the UI concepts suggest.
- what should be redesigned first
  - Information architecture and route/state decomposition around notebooks, pages, and capture flow; then layout system and responsive behavior.
- what should definitely NOT be broken during redesign
  - Auth boot flow, local notebook/page persistence assumptions during transition, capture-to-page flow, and the user’s ability to quickly create/open notebooks and edit notes.

## Code Appendix
### Main app entry
Path: $path
`$lang
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

` 

### Router / app shell
Path: $path
`$lang
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import BrainDrainApp from "./BrainDrainApp";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SignupPage from "./pages/SignupPage";

function GuestOnly({ children }) {
  const { isReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isReady) return null;
  if (isAuthenticated) {
    const fallbackTarget = location.state?.from?.pathname ?? "/";
    return <Navigate to={fallbackTarget} replace />;
  }
  return children;
}

function AppHome() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return <BrainDrainApp key={user?.id ?? "authed"} user={user} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnly>
            <SignupPage />
          </GuestOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppHome />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

` 

### Auth shell / public layout
Path: $path
`$lang
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

` 

### Login page
Path: $path
`$lang
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { useAuth } from "../auth/AuthContext";
import { readRecentEmails, saveRecentEmail } from "../auth/recentEmailStore";

export default function LoginPage() {
  const { signIn, signInWithProvider, providerAvailability, devFallbackCredentials } = useAuth();
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
  const primaryRecentEmail = devFallbackCredentials?.email ?? recentEmails[0] ?? "";

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

  function handleDevShortcut() {
    if (!devFallbackCredentials) return;
    setEmail(devFallbackCredentials.email);
    setPassword(devFallbackCredentials.password);
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
            onClick={devFallbackCredentials ? handleDevShortcut : () => handleAutofillEmail(primaryRecentEmail)}
            disabled={!primaryRecentEmail}
            title={primaryRecentEmail ? `Use ${primaryRecentEmail}` : "No saved email yet"}
          >
            {devFallbackCredentials ? "Use dev login" : primaryRecentEmail ? "Use saved" : "No saved email"}
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
        {devFallbackCredentials ? (
          <p className="auth-provider-note">Dev shortcut fills the local practice account.</p>
        ) : null}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}

` 

### Signup page
Path: $path
`$lang
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { useAuth } from "../auth/AuthContext";
import { saveRecentEmail } from "../auth/recentEmailStore";

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
        saveRecentEmail(email);
        navigate("/", { replace: true });
        return;
      }

      // If Neon Auth requires email confirmation, this message guides the user.
      setInfo("Account created. Check your email to confirm your account, then sign in.");
      try {
        await signIn({ email, password });
        saveRecentEmail(email);
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

` 

### Forgot password page
Path: $path
`$lang
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


` 

### Reset password page
Path: $path
`$lang
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


` 

### Current protected app / notebook + note experience
Path: $path
`$lang
import { useEffect, useMemo, useRef, useState } from "react";
const LYRIC_LINE_COMMAND = /\b(?:new line|next line|line break|new paragraph)\b/i;
const LYRIC_LINE_COMMAND_GLOBAL = /\b(?:new line|next line|line break|new paragraph)\b/gi;
const LYRIC_PAUSE_BREAK_MS = 1400;
const TRANSCRIBE_LANGUAGES = [
  { label: "Auto (Browser)", value: "auto" },
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "Spanish (US)", value: "es-US" },
  { label: "Spanish (Puerto Rico)", value: "es-PR" },
  { label: "Spanish (Spain)", value: "es-ES" },
  { label: "Spanglish (English + Spanish)", value: "spanglish" },
  { label: "French", value: "fr-FR" },
  { label: "German", value: "de-DE" },
  { label: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "Italian", value: "it-IT" },
  { label: "Japanese", value: "ja-JP" },
  { label: "Korean", value: "ko-KR" },
  { label: "Hindi", value: "hi-IN" },
];

function getDefaultTranscribeLanguage() {
  if (typeof navigator === "undefined") return "auto";
  const browserLang = navigator.language;
  const supported = TRANSCRIBE_LANGUAGES.some((item) => item.value === browserLang);
  return supported ? browserLang : "auto";
}

function getRecognitionLang(selection) {
  if (selection === "auto") return navigator.language || "en-US";
  if (selection === "spanglish") return "es-US";
  return selection;
}

function formatTranscriptChunk(rawChunk, { lyricsLineBreaks, pauseMs }) {
  if (!rawChunk) return "";

  const compact = rawChunk.replace(/\s+/g, " ").trim();
  if (!compact) return "";

  if (!lyricsLineBreaks) {
    return `${compact} `;
  }

  const explicitBreakRequested = LYRIC_LINE_COMMAND.test(rawChunk);
  const commandProcessed = rawChunk
    .replace(LYRIC_LINE_COMMAND_GLOBAL, "\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!commandProcessed) {
    return explicitBreakRequested ? "\n" : "";
  }

  const shouldBreakFromPause = typeof pauseMs === "number" && pauseMs > LYRIC_PAUSE_BREAK_MS;
  const prefix = shouldBreakFromPause ? "\n" : "";
  const suffix = commandProcessed.endsWith("\n") ? "" : "\n";

  return `${prefix}${commandProcessed}${suffix}`;
}

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function BrainDrainApp({ user, onLogout }) {
  const storageKey = useMemo(() => {
    const userId = user?.id ?? user?.sub ?? "unknown";
    return `diary_state_v2_${userId}`;
  }, [user]);

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const now = new Date().toISOString();
          const defaultNotebookId = uid();
          return {
            notebooks: [{ id: defaultNotebookId, name: "Notebook 1", createdAt: now, isLocked: false, passwordHash: null }],
            activeNotebookId: defaultNotebookId,
            entries: parsed.map((e) => ({ ...e, notebookId: e.notebookId ?? defaultNotebookId })),
          };
        }
        if (parsed && !Array.isArray(parsed.notebooks)) {
          const now = new Date().toISOString();
          const defaultNotebookId = uid();
          return {
            notebooks: [{ id: defaultNotebookId, name: "Notebook 1", createdAt: now, isLocked: false, passwordHash: null }],
            activeNotebookId: parsed.activeNotebookId ?? defaultNotebookId,
            entries: (parsed.entries ?? []).map((e) => ({ ...e, notebookId: e.notebookId ?? defaultNotebookId })),
          };
        }
        const notebooksList = Array.isArray(parsed.notebooks) ? parsed.notebooks : [];
        const defaultNbId = notebooksList[0]?.id ?? uid();
        const entriesWithNotebook = (parsed.entries ?? []).map((e) => ({
          ...e,
          notebookId: e.notebookId ?? defaultNbId,
        }));
        if (notebooksList.length === 0 && entriesWithNotebook.length > 0) {
          const now = new Date().toISOString();
          const first = { id: defaultNbId, name: "Notebook 1", createdAt: now, isLocked: false, passwordHash: null };
          return {
            notebooks: [first],
            activeNotebookId: defaultNbId,
            entries: entriesWithNotebook,
          };
        }
        if (notebooksList.length === 0) {
          return { notebooks: [], activeNotebookId: null, entries: [] };
        }
        const normalizedNotebooks = notebooksList.map((n) => ({
          ...n,
          isLocked: n.isLocked ?? false,
          passwordHash: n.passwordHash ?? null,
        }));
        return { ...parsed, notebooks: normalizedNotebooks, entries: entriesWithNotebook };
      }

      return { notebooks: [], activeNotebookId: null, entries: [] };
    } catch {
      return { notebooks: [], activeNotebookId: null, entries: [] };
    }
  });

  const notebooks = useMemo(() => state.notebooks ?? [], [state.notebooks]);
  const entries = useMemo(() => state.entries ?? [], [state.entries]);
  const activeNotebookId = useMemo(() => {
    if (notebooks.length === 0) return null;
    if (notebooks.some((notebook) => notebook.id === state.activeNotebookId)) {
      return state.activeNotebookId;
    }
    return notebooks[0]?.id ?? null;
  }, [notebooks, state.activeNotebookId]);

  const hasNotebooks = notebooks.length > 0;
  const setEntries = (updater) =>
    setState((prev) => ({
      ...prev,
      entries: typeof updater === "function" ? updater(prev.entries) : updater,
    }));

  const setActiveNotebookId = (id) =>
    setState((prev) => ({
      ...prev,
      activeNotebookId: id,
    }));

  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [notebookSearch, setNotebookSearch] = useState("");
  const [notebookSort, setNotebookSort] = useState("A_Z");
  const [pageSort, setPageSort] = useState("recent");
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [lyricsLineBreaks, setLyricsLineBreaks] = useState(false);
  const [transcribeLanguage, setTranscribeLanguage] = useState(getDefaultTranscribeLanguage);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [showNewNotebookInput, setShowNewNotebookInput] = useState(false);
  const newNotebookInputRef = useRef(null);
  const [view, setView] = useState("notebooks");
  const [openMenuNotebookId, setOpenMenuNotebookId] = useState(null);
  const menuRef = useRef(null);
  const [isNotebookSortMenuOpen, setIsNotebookSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);

  const recognitionRef = useRef(null);
  const recordingEntryIdRef = useRef(null);
  const lastFinalResultAtRef = useRef(null);

  const activeNotebook = useMemo(
    () => notebooks.find((n) => n.id === activeNotebookId) ?? null,
    [notebooks, activeNotebookId]
  );

  // Persist state
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const entriesInActiveNotebook = useMemo(
    () => entries.filter((e) => e.notebookId === activeNotebookId),
    [entries, activeNotebookId]
  );

  const resolvedActiveId = useMemo(() => {
    if (!activeNotebookId) return null;
    const currentPageInThisNotebook = entriesInActiveNotebook.some((entry) => entry.id === activeId);
    if (currentPageInThisNotebook) return activeId;
    const newest = [...entriesInActiveNotebook].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    return newest?.id ?? null;
  }, [activeNotebookId, entriesInActiveNotebook, activeId]);

  const activeEntry = useMemo(
    () => entries.find((e) => e.id === resolvedActiveId) ?? null,
    [entries, resolvedActiveId]
  );

  const filteredNotebooks = useMemo(() => {
    const q = notebookSearch.trim().toLowerCase();

    let list = [...(notebooks ?? [])];

    if (q) {
      list = list.filter((n) => (n.name || "").toLowerCase().includes(q));
    }

    if (notebookSort === "A_Z") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (notebookSort === "Z_A") {
      list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (notebookSort === "NEWEST") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (notebookSort === "OLDEST") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    return list;
  }, [notebooks, notebookSearch, notebookSort]);

  const filteredEntries = useMemo(() => {
    const inNotebook = entries.filter((e) => e.notebookId === activeNotebookId);

    const q = search.trim().toLowerCase();
    const filtered = !q
      ? inNotebook
      : inNotebook.filter((e) => {
          const hay = `${e.title}\n${e.text}`.toLowerCase();
          return hay.includes(q);
        });

    const sorted = [...filtered];
    if (pageSort === "recent") sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    else if (pageSort === "oldest") sorted.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    else if (pageSort === "az") sorted.sort((a, b) => (a.title || "Untitled").localeCompare(b.title || "Untitled"));
    else if (pageSort === "za") sorted.sort((a, b) => (b.title || "Untitled").localeCompare(a.title || "Untitled"));
    return sorted;
  }, [entries, activeNotebookId, search, pageSort]);

  const canUseSpeech = useMemo(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return Boolean(SR);
  }, []);

  const createNewEntry = () => {
    if (!activeNotebookId) return null;
    const now = new Date().toISOString();
    const e = {
      id: uid(),
      notebookId: activeNotebookId,
      title: "Untitled",
      text: "",
      createdAt: now,
      updatedAt: now,
    };
    setEntries((prev) => [e, ...prev]);
    setActiveId(e.id);
    setInterim("");
    return e.id;
  };

  const createNotebook = (name) => {
    const trimmed = name == null ? "" : String(name).trim();
    if (trimmed === "") return;

    const now = new Date().toISOString();
    const nb = { id: uid(), name: trimmed, createdAt: now, isLocked: false, passwordHash: null };

    setState((prev) => {
      const nextNotebooks = [nb, ...(Array.isArray(prev.notebooks) ? prev.notebooks : [])];
      return {
        ...prev,
        notebooks: nextNotebooks,
        activeNotebookId: nb.id,
      };
    });

    setActiveId(null);
    setInterim("");
    setNewNotebookName("");
    setShowNewNotebookInput(false);
  };

  const handleAddNotebook = () => {
    createNotebook(newNotebookName);
  };

  const updateNotebook = (id, patch) => {
    setState((prev) => ({
      ...prev,
      notebooks: (prev.notebooks ?? []).map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  };

  const renameNotebook = (id) => {
    const nb = notebooks.find((n) => n.id === id);
    if (!nb) {
      setOpenMenuNotebookId(null);
      return;
    }
    const name = prompt("Rename notebook:", nb.name ?? "");
    if (name == null) {
      setOpenMenuNotebookId(null);
      return;
    }
    const trimmed = String(name).trim();
    if (trimmed === "") {
      setOpenMenuNotebookId(null);
      return;
    }
    updateNotebook(id, { name: trimmed });
    setOpenMenuNotebookId(null);
  };

  const deleteNotebook = (id) => {
    setOpenMenuNotebookId(null);
    if (!confirm("Delete this notebook and all its pages? This cannot be undone.")) return;
    setState((prev) => {
      const nextNotebooks = (prev.notebooks ?? []).filter((n) => n.id !== id);
      const nextEntries = (prev.entries ?? []).filter((e) => e.notebookId !== id);
      let nextActive = prev.activeNotebookId;
      if (nextActive === id) {
        nextActive = nextNotebooks[0]?.id ?? null;
        setView("notebooks");
      }
      return { ...prev, notebooks: nextNotebooks, entries: nextEntries, activeNotebookId: nextActive };
    });
    if (activeNotebookId === id) setActiveId(null);
  };

  const lockNotebook = async (id) => {
    const pwd = prompt("Set a password for this notebook:");
    if (pwd == null || pwd === "") {
      setOpenMenuNotebookId(null);
      return;
    }
    const again = prompt("Confirm password:");
    if (again !== pwd) {
      alert("Passwords did not match.");
      setOpenMenuNotebookId(null);
      return;
    }
    try {
      const hash = await sha256(pwd);
      updateNotebook(id, { isLocked: true, passwordHash: hash });
      setOpenMenuNotebookId(null);
    } catch (err) {
      console.error(err);
      alert("Could not set password. Use HTTPS or localhost.");
      setOpenMenuNotebookId(null);
    }
  };

  const unlockNotebook = async (id) => {
    const nb = notebooks.find((n) => n.id === id);
    if (!nb?.passwordHash) {
      setOpenMenuNotebookId(null);
      return;
    }
    const pwd = prompt("Enter password to unlock:");
    if (pwd == null) {
      setOpenMenuNotebookId(null);
      return;
    }
    try {
      const hash = await sha256(pwd);
      if (hash !== nb.passwordHash) {
        alert("Wrong password.");
        setOpenMenuNotebookId(null);
        return;
      }
      updateNotebook(id, { isLocked: false, passwordHash: null });
      setOpenMenuNotebookId(null);
    } catch (err) {
      console.error(err);
      alert("Could not verify password. Try again.");
      setOpenMenuNotebookId(null);
    }
  };

  const goToNotebookWithLock = async (n) => {
    if (n.isLocked && n.passwordHash) {
      const pwd = prompt("This notebook is locked. Enter password:");
      if (pwd == null) return;
      const hash = await sha256(pwd);
      if (hash !== n.passwordHash) {
        alert("Wrong password.");
        return;
      }
    }
    goToNotebook(n.id);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuNotebookId(null);
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setIsNotebookSortMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showNewNotebookInput && newNotebookInputRef.current) {
      newNotebookInputRef.current.focus();
    }
  }, [showNewNotebookInput]);

  function stopRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors when recognition has already ended.
      }
      recognitionRef.current = null;
    }
    recordingEntryIdRef.current = null;
    lastFinalResultAtRef.current = null;
    setIsRecording(false);
    setInterim("");
  }

  const updateActive = (patch) => {
    if (!activeEntry) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === activeEntry.id
          ? { ...e, ...patch, updatedAt: new Date().toISOString() }
          : e
      )
    );
  };

  const appendToEntryText = (entryId, textToAppend) => {
    if (!entryId || !textToAppend) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              text: `${e.text ?? ""}${textToAppend}`.replace(/\n{3,}/g, "\n\n"),
              updatedAt: new Date().toISOString(),
            }
          : e
      )
    );
  };

  const deleteActive = () => {
    if (!activeEntry) return;
    const ok = confirm("Delete this page?");
    if (!ok) return;
    stopRecording();
    setEntries((prev) => prev.filter((e) => e.id !== activeEntry.id));
    setInterim("");
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Try Chrome or Edge.");
      return;
    }
    if (!activeNotebookId) return;
    const entryId = activeEntry?.id ?? createNewEntry();
    if (!entryId) return;
    recordingEntryIdRef.current = entryId;
    lastFinalResultAtRef.current = null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = getRecognitionLang(transcribeLanguage);

    rec.onresult = (event) => {
      console.log("Speech: onresult fired", event.results?.length);
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }

      if (finalText) {
        const nowTs = typeof event.timeStamp === "number" ? event.timeStamp : Date.now();
        const pauseMs =
          lastFinalResultAtRef.current == null ? null : nowTs - lastFinalResultAtRef.current;
        const chunk = formatTranscriptChunk(finalText, { lyricsLineBreaks, pauseMs });
        appendToEntryText(recordingEntryIdRef.current, chunk);
        lastFinalResultAtRef.current = nowTs;
      }
      setInterim(interimText);
    };

    rec.onerror = (event) => {
      console.log("Speech: error", event.error);
      setIsRecording(false);
      recognitionRef.current = null;
      recordingEntryIdRef.current = null;
      lastFinalResultAtRef.current = null;
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Allow the microphone for this site and try again.");
      }
    };

    rec.onend = (e) => {
      console.log("Speech: ended", e.error || e.reason || "(no error/reason)");
      setIsRecording(false);
      recognitionRef.current = null;
      recordingEntryIdRef.current = null;
      lastFinalResultAtRef.current = null;
      setInterim("");
    };

    recognitionRef.current = rec;
    rec.start();
    console.log("Speech: started");
    setIsRecording(true);
  };

  const runSpeechTest = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const lines = [];
    lines.push("SR exists? " + (!!SR));
    if (!SR) {
      alert(lines.join("\n") + "\n\nUse Chrome or Edge on desktop.");
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = getRecognitionLang(transcribeLanguage);
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      try {
        r.abort();
      } catch {
        // Ignore abort errors when recognition is already closed.
      }
      alert(lines.join("\n"));
    };
    r.onstart = () => { lines.push("TEST start"); };
    r.onresult = (e) => {
      let s = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        s += (e.results[i].isFinal ? "[final] " : "[interim] ") + e.results[i][0].transcript;
      }
      lines.push("TEST result: " + (s || "(empty)"));
    };
    r.onerror = (e) => { lines.push("TEST error: " + (e.error || "unknown")); setTimeout(done, 100); };
    r.onend = () => { lines.push("TEST end"); setTimeout(done, 100); };
    r.start();
    lines.push("TEST called start()");
    setTimeout(done, 5000);
  };

  const goToNotebook = (id) => {
    stopRecording();
    setActiveNotebookId(id);
    setView("pages");
  };

  const goBackToNotebooks = () => {
    stopRecording();
    setView("notebooks");
  };

  const selectEntry = (id) => {
    if (isRecording && id !== recordingEntryIdRef.current) {
      stopRecording();
    }
    setActiveId(id);
  };

  // NEON vibe: deep black, luminous green accent, clean sans-serif
  const styles = {
    app: { height: "100vh", display: "grid", gridTemplateColumns: "320px 1fr", fontFamily: "var(--font)", background: "#000" },
    sidebar: { borderRight: "1px solid #222", padding: 16, display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.6)" },
    headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    title: { margin: 0, fontSize: 38, fontWeight: 300, color: "#fff", letterSpacing: "0" },
    btn: { padding: "10px 16px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", cursor: "pointer", fontWeight: 500, transition: "all 0.2s ease" },
    btnPrimary: { padding: "10px 16px", borderRadius: 10, border: "none", background: "#fff", color: "#000", cursor: "pointer", fontWeight: 600, transition: "all 0.2s ease" },
    btnOutline: { padding: "10px 16px", borderRadius: 10, border: "1px solid #fff", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 500, transition: "all 0.2s ease" },
    btnDanger: { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,71,87,0.4)", background: "rgba(255,71,87,0.1)", color: "#ff4757", cursor: "pointer", fontWeight: 500 },
    input: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", outline: "none" },
    compactInput: { width: "100%", height: 42, padding: "8px 12px", borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", outline: "none", fontSize: 15 },
    iconBtn: {
      width: 52,
      height: 52,
      borderRadius: 16,
      border: "1px solid #2a2a2a",
      background: "#0d0f14",
      color: "#ffffff",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
    },
    list: { overflow: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 },
    item: (active) => ({
      padding: 12,
      borderRadius: 12,
      border: active ? "1px solid #00e676" : "1px solid #222",
      background: active ? "rgba(0,230,118,0.12)" : "#0a0a0a",
      color: "#fff",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: active ? "0 0 20px rgba(0,230,118,0.15)" : "none",
    }),
    itemTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" },
    itemMeta: { margin: "6px 0 0", fontSize: 12, color: "#a0a0a0" },
    main: { padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "transparent" },
    topBar: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
    bigInput: { flex: 1, minWidth: 220, padding: 10, borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 16, outline: "none" },
    textarea: { width: "100%", flex: 1, minHeight: 260, resize: "vertical", padding: 12, borderRadius: 12, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 15, lineHeight: 1.6, outline: "none" },
    hint: { fontSize: 13, color: "#a0a0a0" },
    pill: { display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #333", background: "#111", color: "#a0a0a0", fontSize: 12 },
    sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 },
    sectionTitle: { margin: 0, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b6b6b" },
    select: { padding: "8px 10px", borderRadius: 10, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 13, cursor: "pointer", outline: "none" },
  };

  const editorValue = activeEntry
    ? activeEntry.text +
      (interim
        ? lyricsLineBreaks
          ? `${activeEntry.text.endsWith("\n") ? "" : "\n"}${interim}`
          : `\n${interim}`
        : "")
    : "";

  const brandIcon = (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: 24,
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 5,
        pointerEvents: "none",
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
    </div>
  );

  if (view === "notebooks") {
    return (
      <div className="neon-hero-bg" style={{ ...styles.app, gridTemplateColumns: "1fr", maxWidth: 520, margin: "0 auto", padding: 32 }}>
        {brandIcon}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ ...styles.pill, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email ?? user?.id ?? "Authenticated"}
          </span>
          <button type="button" style={styles.btnOutline} className="btn-outline" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div ref={sortMenuRef} style={{ marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              style={styles.compactInput}
              placeholder="Search notebooks..."
              value={notebookSearch}
              onChange={(e) => setNotebookSearch(e.target.value)}
            />
            <button
              type="button"
              style={styles.iconBtn}
              aria-label="Sort notebooks"
              title="Sort notebooks"
              onClick={() => setIsNotebookSortMenuOpen((v) => !v)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <line x1="3" y1="6" x2="13" y2="6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="17" y1="6" x2="21" y2="6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="15" cy="6" r="1.8" fill="#ffffff" />
                <line x1="3" y1="12" x2="7" y2="12" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="11" y1="12" x2="21" y2="12" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="9" cy="12" r="1.8" fill="#ffffff" />
                <line x1="3" y1="18" x2="13" y2="18" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="17" y1="18" x2="21" y2="18" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="15" cy="18" r="1.8" fill="#ffffff" />
              </svg>
            </button>
          </div>
          {isNotebookSortMenuOpen && (
            <div
              style={{
                marginTop: 8,
                marginLeft: "auto",
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: 10,
                padding: 6,
                width: 160,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4, padding: "8px 10px" }} onClick={() => { setNotebookSort("A_Z"); setIsNotebookSortMenuOpen(false); }}>
                A to Z
              </button>
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4, padding: "8px 10px" }} onClick={() => { setNotebookSort("Z_A"); setIsNotebookSortMenuOpen(false); }}>
                Z to A
              </button>
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4, padding: "8px 10px" }} onClick={() => { setNotebookSort("NEWEST"); setIsNotebookSortMenuOpen(false); }}>
                Most recent
              </button>
              <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", padding: "8px 10px" }} onClick={() => { setNotebookSort("OLDEST"); setIsNotebookSortMenuOpen(false); }}>
                Oldest
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            style={styles.btnPrimary}
            className="btn-primary"
            onClick={() => setShowNewNotebookInput((v) => !v)}
            aria-label="New notebook"
          >
            + New
          </button>
        </div>

        {showNewNotebookInput && (
          <div style={{ display: "flex", gap: 8, flexDirection: "column", marginTop: 4 }}>
            <input
              ref={newNotebookInputRef}
              style={styles.input}
              placeholder="Notebook name"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNotebook();
                if (e.key === "Escape") setShowNewNotebookInput(false);
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={styles.btnPrimary} className="btn-primary" onClick={handleAddNotebook} disabled={!newNotebookName.trim()}>
                Add notebook
              </button>
              <button type="button" style={styles.btnOutline} className="btn-outline" onClick={() => { setShowNewNotebookInput(false); setNewNotebookName(""); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ ...styles.list, flex: 1, minHeight: 200, marginTop: 12 }}>
          {filteredNotebooks.length === 0 ? (
            <div style={{ color: "#a0a0a0" }}>No notebooks yet. Click + New to create one.</div>
          ) : (
            filteredNotebooks.map((n) => (
              <div key={n.id} style={{ position: "relative" }}>
                <div
                  role="button"
                  tabIndex={0}
                  style={{ ...styles.item(n.id === activeNotebookId), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                  onClick={() => goToNotebookWithLock(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToNotebookWithLock(n);
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {n.isLocked && (
                      <span style={{ marginRight: 6, fontSize: 12 }} aria-label="Locked" title="Locked">
                        🔒
                      </span>
                    )}
                    <p style={styles.itemTitle}>{n.name}</p>
                    <p style={styles.itemMeta}>{formatDateTime(n.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    style={{ ...styles.btn, padding: "4px 8px", fontSize: 16 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuNotebookId(openMenuNotebookId === n.id ? null : n.id);
                    }}
                    aria-label="Notebook options"
                  >
                    ⋯
                  </button>
                </div>
                {openMenuNotebookId === n.id && (
                  <div
                    ref={menuRef}
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 4,
                      background: "#0a0a0a",
                      border: "1px solid #222",
                      borderRadius: 10,
                      padding: 6,
                      minWidth: 120,
                      zIndex: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4 }} onClick={() => renameNotebook(n.id)}>
                      Rename
                    </button>
                    <button type="button" style={{ ...styles.btn, width: "100%", textAlign: "left", marginBottom: 4 }} onClick={() => (n.isLocked ? unlockNotebook(n.id) : lockNotebook(n.id))}>
                      {n.isLocked ? "Unlock" : "Lock"}
                    </button>
                    <button type="button" style={{ ...styles.btnDanger, width: "100%", textAlign: "left" }} onClick={() => deleteNotebook(n.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {!hasNotebooks && (
          <div style={{ marginTop: 24 }}>
            <p style={{ margin: 0, color: "#a0a0a0", fontSize: 14 }}>Or create your first notebook below.</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <input
                style={{ ...styles.input, flex: 1, minWidth: 140 }}
                placeholder="Notebook name"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNotebook()}
              />
              <button type="button" style={styles.btnPrimary} className="btn-primary" onClick={handleAddNotebook} disabled={!newNotebookName.trim()}>
                Create notebook
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="neon-hero-bg" style={styles.app}>
      {brandIcon}
      <aside style={styles.sidebar}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            style={{ ...styles.btnOutline, alignSelf: "flex-start", marginBottom: 4 }}
            className="btn-outline"
            onClick={goBackToNotebooks}
            aria-label="Back to notebooks"
          >
            Back
          </button>
          <button
            type="button"
            style={{ ...styles.btn, marginBottom: 4 }}
            onClick={onLogout}
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "#fff", fontWeight: 600 }}>
          {activeNotebook?.name ?? "Notebook"}
        </h2>

        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Pages</span>
          <button type="button" style={styles.btnPrimary} className="btn-primary" onClick={createNewEntry}>
            New Page
          </button>
        </div>
        <input
          style={styles.input}
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={pageSort}
          onChange={(e) => setPageSort(e.target.value)}
          title="Sort pages"
        >
          <option value="recent">Most recent</option>
          <option value="oldest">Oldest</option>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
        </select>
        <div style={{ ...styles.list, flex: 1, minHeight: 0 }}>
          {filteredEntries.length === 0 ? (
            <div style={{ color: "#a0a0a0" }}>No pages yet. Hit "New Page".</div>
          ) : (
            filteredEntries.map((e) => (
              <div key={e.id} style={styles.item(e.id === resolvedActiveId)} onClick={() => selectEntry(e.id)}>
                <p style={styles.itemTitle}>{e.title || "Untitled"}</p>
                <p style={styles.itemMeta}>{formatDateTime(e.updatedAt)}</p>
              </div>
            ))
          )}
        </div>

        <div className="transcribe-panel">
          <div className="transcribe-head">
            <p className="transcribe-title">Transcribe</p>
            <span className={`transcribe-status ${isRecording ? "live" : ""}`}>
              {isRecording ? "Live" : canUseSpeech ? "Ready" : "Unsupported"}
            </span>
          </div>
          <div className="transcribe-language">
            <label htmlFor="transcribe-language">Language</label>
            <select
              id="transcribe-language"
              value={transcribeLanguage}
              onChange={(e) => setTranscribeLanguage(e.target.value)}
            >
              {TRANSCRIBE_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <p className="transcribe-copy">Record voice directly into the active page.</p>
          <label className="transcribe-toggle">
            <input
              type="checkbox"
              checked={lyricsLineBreaks}
              onChange={(e) => setLyricsLineBreaks(e.target.checked)}
            />
            <span>Lyrics mode (optional line break detection)</span>
          </label>
          <div className="transcribe-actions">
            <button style={styles.btnDanger} onClick={deleteActive} disabled={!activeEntry}>
              Delete
            </button>
            <button
              type="button"
              style={styles.btn}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!canUseSpeech}
              title={!canUseSpeech ? "Use Chrome/Edge for Speech Recognition" : ""}
            >
              {isRecording ? "Stop" : "Record"}
            </button>
            <button
              type="button"
              style={{ ...styles.btn, opacity: 0.9 }}
              onClick={runSpeechTest}
              title="Run speech diagnostic (no console needed)"
            >
              Test speech
            </button>
          </div>
          <div style={styles.hint}>
            {canUseSpeech ? (
              <span style={styles.pill}>Speech: Ready</span>
            ) : (
              <span style={styles.pill}>Speech: Not supported (try Chrome/Edge)</span>
            )}
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        {!activeEntry ? (
          <>
            <h2 style={{ margin: 0, color: "#fff", fontWeight: 600 }}>Create your first page</h2>
            <p style={{ margin: 0, color: "#a0a0a0" }}>
              Click <b style={{ color: "#00e676" }}>New Page</b>, then hit <b style={{ color: "#00e676" }}>Record</b> and talk.
            </p>
          </>
        ) : (
          <>
            <div style={styles.topBar}>
              <input
                style={styles.bigInput}
                value={activeEntry.title}
                onChange={(e) => updateActive({ title: e.target.value })}
                placeholder="Page title..."
              />
              <span style={styles.pill}>{formatDateTime(activeEntry.createdAt)}</span>
              {isRecording && <span style={styles.pill}>Recording...</span>}
            </div>

            <textarea
              style={styles.textarea}
              value={editorValue}
              onChange={(e) => updateActive({ text: e.target.value })}
              placeholder="Your thoughts will appear here..."
            />
          </>
        )}
      </main>
    </div>
  );
}

` 

### ProtectedRoute
Path: $path
`$lang
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


` 

### Auth context / provider
Path: $path
`$lang
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
const DEV_FALLBACK_SESSION_KEY = "brain-drain-dev-auth";
const DEV_FALLBACK_EMAIL = "[removed]";
const DEV_FALLBACK_PASSWORD = "[removed]";
const isDevFallbackEnabled = Boolean(import.meta.env.DEV);

function createDevFallbackSession() {
  return {
    access_token: "local-dev-access-token",
    refresh_token: "local-dev-refresh-token",
    token_type: "bearer",
    expires_in: 60 * 60 * 24 * 365,
    user: {
      id: "local-dev-user",
      email: DEV_FALLBACK_EMAIL,
    },
  };
}

function readDevFallbackSession() {
  if (typeof window === "undefined" || !isDevFallbackEnabled) return null;

  try {
    const raw = window.localStorage.getItem(DEV_FALLBACK_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.access_token ? parsed : null;
  } catch {
    return null;
  }
}

function persistDevFallbackSession(session) {
  if (typeof window === "undefined") return;

  try {
    if (!session || !isDevFallbackEnabled) {
      window.localStorage.removeItem(DEV_FALLBACK_SESSION_KEY);
      return;
    }

    window.localStorage.setItem(DEV_FALLBACK_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore local persistence failures in dev shortcut mode.
  }
}

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
    const isDevSession =
      nextSession?.access_token === "local-dev-access-token" && resolvedUser?.id === "local-dev-user";
    persistDevFallbackSession(isDevSession ? { ...nextSession, user: resolvedUser } : null);
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
        const devFallbackSession = readDevFallbackSession();
        if (devFallbackSession) {
          setAuthState(devFallbackSession);
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
      const normalizedEmail = String(email ?? "").trim().toLowerCase();
      if (
        isDevFallbackEnabled &&
        normalizedEmail === DEV_FALLBACK_EMAIL &&
        password === DEV_FALLBACK_PASSWORD
      ) {
        const fallbackSession = createDevFallbackSession();
        setAuthState(fallbackSession, fallbackSession.user);
        return fallbackSession;
      }

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
      devFallbackCredentials: isDevFallbackEnabled
        ? {
            email: DEV_FALLBACK_EMAIL,
            password: DEV_FALLBACK_PASSWORD,
          }
        : null,
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

` 

### Neon auth service
Path: $path
`$lang
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

` 

### Recent email local storage helper
Path: $path
`$lang
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

` 

### Legacy home page (unused)
Path: $path
`$lang
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntries } from '../context/EntriesContext';

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { dateStyle: 'medium' });
}

function excerpt(text, max = 80) {
  if (!text?.trim()) return 'No content';
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length <= max ? t : t.slice(0, max) + '…';
}

export default function Home() {
  const { searchEntries } = useEntries();
  const [query, setQuery] = useState('');
  const filtered = searchEntries(query);

  return (
    <div className="page home">
      <header className="page-header">
        <h1>Brain Drain</h1>
        <Link to="/new" className="btn primary">
          New entry
        </Link>
      </header>

      <div className="search-wrap">
        <input
          type="search"
          placeholder="Search entries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          aria-label="Search entries"
        />
      </div>

      <ul className="entry-list">
        {filtered.length === 0 ? (
          <li className="entry-list-empty">
            {query ? 'No entries match your search.' : 'No entries yet. Record your first thought.'}
          </li>
        ) : (
          filtered.map((entry) => (
            <li key={entry.id}>
              <Link to={`/entry/${entry.id}`} className="entry-card">
                <span className="entry-card-title">{entry.title || 'Untitled'}</span>
                <span className="entry-card-meta">{formatDate(entry.createdAt)}</span>
                <p className="entry-card-excerpt">{excerpt(entry.body)}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

` 

### Legacy capture page (unused)
Path: $path
`$lang
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEntries } from '../context/EntriesContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function NewEntry() {
  const navigate = useNavigate();
  const { addEntry } = useEntries();
  const { transcript, isListening, error, isSupported, start, stop, reset } = useSpeechRecognition();

  const [title, setTitle] = useState('');
  const [step, setStep] = useState('record'); // 'record' | 'review'

  const body = transcript.trim();

  const handleSave = () => {
    const id = addEntry({
      title: title.trim() || 'Untitled',
      body,
    });
    reset();
    navigate(`/entry/${id}`);
  };

  const handleCancel = () => {
    reset();
    navigate('/');
  };

  if (!isSupported) {
    return (
      <div className="page">
        <p className="unsupported">
          Voice input is not supported in this browser. Try Chrome or Edge.
        </p>
        <Link to="/">Back to Brain Drain</Link>
      </div>
    );
  }

  return (
    <div className="page new-entry-page">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← Brain Drain
        </Link>
      </header>

      <h2 className="new-entry-heading">New entry</h2>

      {error && <p className="error-msg" role="alert">{error}</p>}

      {step === 'record' ? (
        <>
          <div className="record-area">
            <button
              type="button"
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stop : start}
              aria-pressed={isListening}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
              <span className="mic-icon" aria-hidden="true">
                {isListening ? '■' : '🎤'}
              </span>
            </button>
            <p className="record-hint">
              {isListening ? 'Speaking…' : 'Tap the mic to start recording.'}
            </p>
          </div>

          {(body || transcript) && (
            <div className="transcript-preview">
              <p className="transcript-label">Live transcript</p>
              <div className="transcript-text">{body || transcript || '…'}</div>
              <button type="button" className="btn primary" onClick={() => setStep('review')}>
                Continue to save
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="review-area">
          <label className="field-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="Give this entry a title"
          />
          <label className="field-label">Entry</label>
          <div className="review-body">{body || 'No content recorded.'}</div>
          <div className="entry-actions">
            <button type="button" className="btn" onClick={() => setStep('record')}>
              Back
            </button>
            <button type="button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={handleSave}>
              Save entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

` 

### Legacy entry detail page (unused)
Path: $path
`$lang
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEntries } from '../context/EntriesContext';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Entry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEntry, updateEntry, deleteEntry } = useEntries();
  const entry = getEntry(id);
  const [editing, setEditing] = useState(false);

  if (!entry) {
    return (
      <div className="page">
        <p>Entry not found.</p>
        <Link to="/">Back to Brain Drain</Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Delete this entry? This cannot be undone.')) {
      deleteEntry(id);
      navigate('/');
    }
  };

  return (
    <div className="page entry-page">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← Brain Drain
        </Link>
      </header>

      <div className="entry-meta">{formatDateTime(entry.updatedAt)}</div>

      {editing ? (
        <EntryEditor
          key={entry.id}
          entry={entry}
          onCancel={() => setEditing(false)}
          onSave={(updates) => {
            updateEntry(id, updates);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <h2 className="entry-title">{entry.title || 'Untitled'}</h2>
          <div className="entry-body">{entry.body || <em>No content.</em>}</div>
          <div className="entry-actions">
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="btn danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EntryEditor({ entry, onCancel, onSave }) {
  const [title, setTitle] = useState(entry.title || '');
  const [body, setBody] = useState(entry.body || '');

  return (
    <div className="entry-edit">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="entry-title-input"
        placeholder="Title"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="entry-body-input"
        placeholder="What's on your mind?"
        rows={12}
      />
      <div className="entry-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => onSave({ title: title.trim() || 'Untitled', body: body.trim() })}
        >
          Save
        </button>
      </div>
    </div>
  );
}

` 

### Legacy entries context (unused)
Path: $path
`$lang
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'diary-entries';

const EntriesContext = createContext(null);

function readStoredEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function EntriesProvider({ children }) {
  const [entries, setEntries] = useState(readStoredEntries);

  const saveEntries = useCallback((next) => {
    setEntries((prev) => {
      const list = typeof next === 'function' ? next(prev) : next;
      const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      } catch (e) {
        console.warn('Failed to save entries', e);
      }
      return sorted;
    });
  }, []);

  const addEntry = useCallback(
    (entry) => {
      const id = crypto.randomUUID?.() ?? `entry-${Date.now()}`;
      const created = {
        id,
        title: entry.title || 'Untitled',
        body: entry.body || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveEntries((prev) => [created, ...prev]);
      return created.id;
    },
    [saveEntries]
  );

  const updateEntry = useCallback(
    (id, updates) => {
      saveEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    },
    [saveEntries]
  );

  const deleteEntry = useCallback(
    (id) => {
      saveEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [saveEntries]
  );

  const getEntry = useCallback(
    (id) => entries.find((e) => e.id === id) ?? null,
    [entries]
  );

  const searchEntries = useCallback(
    (query) => {
      if (!query?.trim()) return entries;
      const q = query.trim().toLowerCase();
      return entries.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.body && e.body.toLowerCase().includes(q))
      );
    },
    [entries]
  );

  const value = {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    searchEntries,
  };

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used within EntriesProvider');
  return ctx;
}

` 

### Legacy speech hook (unused)
Path: $path
`$lang
import { useState, useCallback, useRef, useEffect } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export function useSpeechRecognition(options = {}) {
  const { continuous = true, interimResults = true, lang = 'en-US' } = options;
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setTranscript(full);
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Microphone access was denied.');
      else if (e.error !== 'aborted') setError(e.error || 'Speech recognition error.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [continuous, interimResults, lang]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors when the recognition session is already closed.
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setError(null);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort errors during cleanup.
        }
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    error,
    isSupported: !!SpeechRecognition,
    start,
    stop,
    reset,
  };
}

` 

### Backend server
Path: $path
`$lang
import 'dotenv/config';
import process from 'node:process';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected', ping: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

` 
