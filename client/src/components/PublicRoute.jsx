// client/src/components/PublicRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function PublicRoute({ children }) {
  const { isAuthenticated, loading, activeRole, roleDestination, user } = useAuth();
  const effectiveRole = activeRole || (
    user?.roles?.includes("admin") ? "admin"
    : user?.roles?.includes("employer") ? "employer"
    : "carer"
  );

  if (loading) return <LoadingSpinner />;

  // Already logged in → send to their role's correct home page
  if (isAuthenticated) {
    return <Navigate to={roleDestination(effectiveRole)} replace />;
  }

  return children;
}

export default PublicRoute;
