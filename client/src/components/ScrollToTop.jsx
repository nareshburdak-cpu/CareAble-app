// client/src/components/ScrollToTop.jsx

/**
 * ScrollToTop
 * -----------
 * Scrolls the window to the top on every route change.
 * React Router v6 does not do this automatically.
 * Place inside <BrowserRouter> in App.jsx.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search, hash]);

  return null;
}
