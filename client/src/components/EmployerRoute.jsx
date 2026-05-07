// client/src/components/EmployerRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function EmployerRoute({ children }) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admins can access employer features — they need to verify certs too
  if (!hasRole("employer") && !hasRole("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default EmployerRoute;