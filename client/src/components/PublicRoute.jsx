/**
 * PublicRoute
 * -----------
 * Opposite of ProtectedRoute.
 * Redirects authenticated users AWAY from pages like /login and /register
 * (they don't need to see those if they're already logged in).
 *
 * Usage:
 *   <Route path="/login" element={
 *     <PublicRoute>
 *       <Login />
 *     </PublicRoute>
 *   } />
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;