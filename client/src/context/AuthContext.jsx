/**
 * AuthContext
 * -----------
 * Provides global authentication state to the entire app.
 *
 * Features:
 *   - bootstrap on mount: check localStorage + validate with /auth/me
 *   - login / register / logout helpers
 *   - cross-tab sync: if user logs out in another tab, this tab catches up
 *
 * Note: The `useAuth` hook lives in src/hooks/useAuth.js
 * for better Fast Refresh support.
 */

import { createContext, useEffect, useState } from "react";
import api from "../api/axios";

// Exported so useAuth.js can import it
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- On mount: verify saved token with the server ----
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data.user);
      } catch {
        // Invalid or expired token — clean up
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  // ---- Cross-tab sync: react when localStorage changes in another tab ----
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        if (!e.newValue) {
          // Token was removed (logout in another tab) → log out here too
          setUser(null);
        } else if (e.newValue !== e.oldValue) {
          // Token changed → re-validate
          api
            .get("/auth/me")
            .then((res) => setUser(res.data.data.user))
            .catch(() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setUser(null);
            });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ---- Login ----
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    return user;
  };

  // ---- Register ----
  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    const { token, user } = res.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    return user;
  };

  // ---- Logout ----
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}