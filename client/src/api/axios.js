/** @file HTTP client configuration with auth headers and normalized API errors. */
/**
 * Axios instance
 * --------------
 * Pre-configured HTTP client for all API calls.
 *
 * Base URL:
 *   - Dev:   "/api"  (Vite proxy forwards to backend)
 *   - Prod:  VITE_API_URL  (e.g., https://careable-api.onrender.com/api)
 *
 * Errors are normalized to include `message`, `status`, and `extra` fields.
 */

import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
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
    const data = error.response?.data;
    const message =
      data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    const isAuthEndpoint =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const publicPaths = ["/", "/login", "/register"];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }

    // Build a normalized error that carries the extra metadata + status
    // so callers can read err.extra.cooldown, err.status, etc.
    const normalized = new Error(message);
    normalized.status = status;
    normalized.extra = data?.extra || null;

    return Promise.reject(normalized);
  }
);

export default api;