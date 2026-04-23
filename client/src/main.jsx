/**
 * main.jsx — Entry point
 * ----------------------
 * Renders <App /> into the #root div and hides the pre-React loader.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";

// Render the app
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
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