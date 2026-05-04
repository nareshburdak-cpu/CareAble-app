/**
 * AdminRoute
 * ----------
 * Wrapper for admin-only routes.
 *
 * Behavior:
 *   - Loading: spinner
 *   - Logged out: redirect to /login
 *   - Logged in but not admin: redirect to /dashboard (404 feel)
 *   - Logged in as admin: render the protected content
 *
 * Usage in App.jsx:
 *   <Route element={<AdminRoute />}>
 *     <Route path="/admin-x7k9p" element={<AdminLayout />}>
 *       ...nested routes
 *     </Route>
 *   </Route>
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

function AdminRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    // Silently redirect — don't tell them this URL exists
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;