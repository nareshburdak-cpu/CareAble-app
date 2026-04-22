/**
 * AuthContext — shared Context object
 * -----------------------------------
 * Just the React context itself.
 * The provider lives in AuthProvider.jsx.
 * The hook lives in hooks/useAuth.js.
 *
 * This split is required for Vite's Fast Refresh to work properly.
 */

import { createContext } from "react";

export const AuthContext = createContext(null);