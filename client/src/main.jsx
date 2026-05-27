/**
 * main.jsx — Entry point
 * ----------------------
 * Renders <App /> into the #root div and hides the pre-React loader.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Render the app
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </StrictMode>
);

// Hide the pre-React loading screen once the app is mounted
const loader = document.getElementById("initial-loader");
if (loader) {
  // Use requestAnimationFrame so we fade out AFTER the first paint
  requestAnimationFrame(() => {
    loader.classList.add("hidden");
    // Remove entirely after the fade-out transition
    setTimeout(() => loader.remove(), 300);
  });
}
