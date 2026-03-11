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
