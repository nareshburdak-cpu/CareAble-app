// client/src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

/**
 * ProtectedRoute
 * --------------
 * Props:
 *   allowedRoles: string[] — if provided, only these roles can enter.
 *                            Others are redirected to their own home page.
 *   children: ReactNode
 *
 * Usage (role-restricted):
 *   <ProtectedRoute allowedRoles={["carer"]}>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 * Usage (any authenticated user):
 *   <ProtectedRoute>
 *     <Profile />
 *   </ProtectedRoute>
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, activeRole, roleDestination, user } = useAuth();
  const location = useLocation();
  const effectiveRole = activeRole || (
    user?.roles?.includes("admin") ? "admin"
    : user?.roles?.includes("employer") ? "employer"
    : "carer"
  );

  if (loading) {
    return <LoadingSpinner message="Checking your session..." />;
  }

  // Not logged in → go to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search + location.hash }}
        replace
      />
    );
  }

  // Role restriction check
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    // Redirect them to their correct home — not a 404, just wrong door
    return <Navigate to={roleDestination(effectiveRole)} replace />;
  }

  return children;
}

export default ProtectedRoute;
