/**
 * Axios instance
 * --------------
 * Pre-configured HTTP client for all API calls.
 *
 *   - baseURL: "/api" (Vite proxy forwards to backend)
 *   - Auto-attaches JWT token from localStorage
 *   - Normalizes error messages
 *   - Handles 401 globally: clears auth & redirects to /login
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Request interceptor: attach JWT ----
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: normalize errors + handle 401 ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    // Global 401: token expired or invalid.
    //
    // We only auto-logout for requests OTHER THAN login/register — otherwise
    // a wrong-password attempt would cause a full redirect loop.
    const isAuthEndpoint =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      // Clear stale auth
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if we're not already on a public page
      const publicPaths = ["/", "/login", "/register"];
      if (!publicPaths.includes(window.location.pathname)) {
        // Using window.location here (not useNavigate) because we're outside React.
        window.location.href = "/login";
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;