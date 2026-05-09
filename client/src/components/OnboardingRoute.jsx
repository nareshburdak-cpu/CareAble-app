// client/src/components/OnboardingRoute.jsx

/**
 * OnboardingRoute
 * ---------------
 * Wraps protected routes that require onboarding to be complete.
 *
 * Flow:
 *   Loading            → spinner
 *   Not authenticated  → /login
 *   Authenticated but onboarding incomplete → /onboarding
 *   Authenticated + onboarding complete     → render children
 *
 * Admin users skip onboarding entirely.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function OnboardingRoute({ children }) {
  const { isAuthenticated, loading, user, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Checking your session..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admins skip onboarding
  if (hasRole("admin")) return children;

  // Redirect to onboarding if not complete
  if (!user?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default OnboardingRoute;