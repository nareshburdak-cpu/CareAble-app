// client/src/components/EmployerRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function EmployerRoute({ children }) {
  const { isAuthenticated, loading, hasRole, activeRole, roleDestination } = useAuth();
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

  // Only employer or admin can access employer routes
  if (!hasRole("employer") && !hasRole("admin")) {
    return <Navigate to={roleDestination(activeRole)} replace />;
  }

  return children;
}

export default EmployerRoute;
