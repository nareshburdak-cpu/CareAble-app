// client/src/context/AuthContext.jsx

/* eslint-disable react-refresh/only-export-components */
/**
 * AuthContext
 * -----------
 * Global authentication state.
 *
 * Phase 12-A: register() now accepts a roles array for multi-role signup.
 */

import { createContext, useEffect, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: validate saved token on app load
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

  // Cross-tab sync
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

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  // roles: ["carer"] | ["employer"] | ["carer", "employer"]
  // Pass entire signup payload as object to handle all Appendix 1 fields
  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
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

  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data.user);
    } catch (err) {
      console.error("Refresh user failed:", err);
    }
  };

  // hasRole: convenience helper for components
  // Usage: hasRole("employer") | hasRole("admin")
  const hasRole = (roleName) => {
    return Array.isArray(user?.roles) && user.roles.includes(roleName);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}