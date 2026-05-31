/** @file Authentication provider and role-selection state for the React app. */
// client/src/context/AuthContext.jsx

/* eslint-disable react-refresh/only-export-components */
/**
 * AuthContext
 * -----------
 * Global authentication state.
 *
 * Phase 12-B: Role switcher support.
 *   - activeRole: the currently active role context
 *   - preferredRole: the user's default landing role
 *   - switchRole(role): switch active role, persists to localStorage
 *   - setPreferredRole(role): set default landing role
 */

import { createContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";

export const AuthContext = createContext(null);

// Priority order for first-time role selection.
const ROLE_PRIORITY = ["admin", "employer", "carer"];

function preferredRoleKey(email) {
  return email ? `preferredRole:${email.toLowerCase()}` : null;
}

function computeDefaultRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return "carer";
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return roles[0];
}

function getStoredPreferredRole(u) {
  const roles = u?.roles || [];
  const key = preferredRoleKey(u?.email);
  const savedForUser = key ? localStorage.getItem(key) : null;

  if (savedForUser && roles.includes(savedForUser)) return savedForUser;
  return null;
}

function resolvePreferredRole(u) {
  return getStoredPreferredRole(u) || computeDefaultRole(u?.roles);
}

function persistPreferredRole(u, role) {
  if (!u?.roles?.includes(role)) return;
  const key = preferredRoleKey(u.email);
  if (key) localStorage.setItem(key, role);
}

function resolveSessionRole(u) {
  const roles = u?.roles || [];
  const savedSession = localStorage.getItem("activeRole");

  if (savedSession && roles.includes(savedSession)) return savedSession;
  return resolvePreferredRole(u);
}

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [preferredRole, setPreferredRoleState] = useState(null);
  const [activeRole, setActiveRoleState] = useState(() => {
    return localStorage.getItem("activeRole") || null;
  });

  const applyAuthenticatedUser = useCallback((u) => {
    localStorage.setItem("user", JSON.stringify(u));

    const defaultRole = resolvePreferredRole(u);

    localStorage.setItem("activeRole", defaultRole);
    persistPreferredRole(u, defaultRole);
    setPreferredRoleState(defaultRole);
    setActiveRoleState(defaultRole);
    setUser(u);
  }, []);

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
        const u = res.data.data.user;
        setUser(u);

        const defaultRole = resolvePreferredRole(u);
        const sessionRole = resolveSessionRole(u);
        persistPreferredRole(u, defaultRole);
        setPreferredRoleState(defaultRole);
        setActiveRoleState(sessionRole);
        localStorage.setItem("activeRole", sessionRole);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("activeRole");
        setUser(null);
        setPreferredRoleState(null);
        setActiveRoleState(null);
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
          setPreferredRoleState(null);
          setActiveRoleState(null);
        } else if (e.newValue !== e.oldValue) {
          api
            .get("/auth/me")
            .then((res) => {
              const u = res.data.data.user;
              setUser(u);
              const defaultRole = resolvePreferredRole(u);
              const sessionRole = resolveSessionRole(u);
              persistPreferredRole(u, defaultRole);
              setPreferredRoleState(defaultRole);
              setActiveRoleState(sessionRole);
              localStorage.setItem("activeRole", sessionRole);
            })
            .catch(() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("activeRole");
              setUser(null);
              setPreferredRoleState(null);
              setActiveRoleState(null);
            });
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem("token", token);
    applyAuthenticatedUser(u);
    return u;
  };

  const requestLoginOtp = async (email) => {
    const res = await api.post("/auth/login-otp/request", { email });
    return res.data;
  };

  const loginWithOtp = async (email, otp) => {
    const res = await api.post("/auth/login-otp/verify", { email, otp });
    const { token, user: u } = res.data.data;
    localStorage.setItem("token", token);
    applyAuthenticatedUser(u);
    return u;
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post("/auth/google/login", { credential });
    const { token, user: u } = res.data.data;
    localStorage.setItem("token", token);
    applyAuthenticatedUser(u);
    return u;
  };

  const registerWithGoogle = async (credential, payload = {}) => {
    const res = await api.post("/auth/google/register", { credential, ...payload });
    const { token, user: u } = res.data.data;
    localStorage.setItem("token", token);
    applyAuthenticatedUser(u);
    return u;
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    const { token, user: u } = res.data.data;
    localStorage.setItem("token", token);
    applyAuthenticatedUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    setUser(null);
    setPreferredRoleState(null);
    setActiveRoleState(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data.user);
    } catch (err) {
      console.error("Refresh user failed:", err);
    }
  };

  // Switch active role — persists to localStorage
  const switchRole = useCallback((role) => {
    if (!user?.roles?.includes(role)) return;
    localStorage.setItem("activeRole", role);
    setActiveRoleState(role);
  }, [user]);

  const setPreferredRole = useCallback((role) => {
    if (!user?.roles?.includes(role)) return;
    persistPreferredRole(user, role);
    setPreferredRoleState(role);
  }, [user]);

  const hasRole = (roleName) =>
    Array.isArray(user?.roles) && user.roles.includes(roleName);

  // Destination URL per role
  const roleDestination = (role) => {
    if (role === "admin") return "/admin-x7k9p";
    if (role === "employer") return "/employer/dashboard";
    return "/dashboard";
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    activeRole,
    preferredRole,
    switchRole,
    setPreferredRole,
    roleDestination,
    login,
    requestLoginOtp,
    loginWithOtp,
    loginWithGoogle,
    registerWithGoogle,
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
