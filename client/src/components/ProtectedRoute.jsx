/**
 * ProtectedRoute
 * --------------
 * Wraps routes that require authentication.
 *
 * Flow:
 *   - If auth is still loading → show spinner
 *   - If not authenticated → redirect to /login (remembering where they wanted to go)
 *   - Otherwise → render the protected page
 *
 * Usage:
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   } />
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Still verifying session? Show a spinner.
  if (loading) {
    return <LoadingSpinner message="Checking your session..." />;
  }

  // Not logged in? Redirect to /login and remember where they wanted to go.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Authenticated — render the protected children.
  return children;
}

export default ProtectedRoute;