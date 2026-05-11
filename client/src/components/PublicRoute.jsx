// client/src/components/PublicRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function PublicRoute({ children }) {
  const { isAuthenticated, loading, activeRole, roleDestination } = useAuth();

  if (loading) return <LoadingSpinner />;

  // Already logged in → send to their role's correct home page
  if (isAuthenticated) {
    return <Navigate to={roleDestination(activeRole)} replace />;
  }

  return children;
}

export default PublicRoute;