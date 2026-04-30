/* eslint-disable react-refresh/only-export-components */
/**
 * AuthContext
 * -----------
 * Global authentication state.
 *
 * Features:
 *   - Bootstrap on mount: validate saved token with /auth/me
 *   - login / register / logout / refreshUser helpers
 *   - Cross-tab sync: logout in one tab logs out all tabs
 *
 * Note: useAuth hook is in src/hooks/useAuth.js (separate for Fast Refresh).
 */

import { createContext, useEffect, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- Bootstrap: validate token on app load ----
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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrapAuth();
  }, []);

  // ---- Cross-tab sync ----
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        if (!e.newValue) {
          setUser(null);
        } else if (e.newValue !== e.oldValue) {
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

  // ---- Auth helpers ----
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    const { token, user } = res.data.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Refresh user data without re-login (used by VerifyEmail page)
  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data.user);
    } catch (err) {
      console.error("Refresh user failed:", err);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,   // ← exposed so any component can call it
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}