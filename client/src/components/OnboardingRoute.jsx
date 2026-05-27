// client/src/components/OnboardingRoute.jsx

/**
 * OnboardingRoute
 * ---------------
 * Wraps carer-only routes that require onboarding to be complete.
 *
 * Flow:
 *   Loading                        → spinner
 *   Not authenticated              → /login
 *   Authenticated, wrong role      → their correct home (roleDestination)
 *   Authenticated, no onboarding   → /onboarding
 *   Authenticated + onboarding ✓  → render children
 *
 * Admin and employer users are redirected to their own home pages —
 * they should never land on /dashboard or /assessment.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function OnboardingRoute({ children }) {
  const { isAuthenticated, loading, user, activeRole, roleDestination } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Checking your session..." />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search + location.hash }}
        replace
      />
    );
  }

  // Defensive: if activeRole hasn't resolved yet but user is loaded,
  // compute it directly from user.roles to avoid a premature redirect.
  const effectiveRole = activeRole || (
    user?.roles?.includes("admin") ? "admin"
    : user?.roles?.includes("employer") ? "employer"
    : "carer"
  );

  // Only carers belong on /dashboard and /assessment.
  // Admins → /admin-x7k9p, Employers → /employer/dashboard
  if (effectiveRole !== "carer") {
    return <Navigate to={roleDestination(effectiveRole)} replace />;
  }

  // Carer hasn't finished onboarding yet
  if (!user?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default OnboardingRoute;
