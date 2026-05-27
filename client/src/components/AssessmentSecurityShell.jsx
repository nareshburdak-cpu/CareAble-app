/**
 * AssessmentSecurityShell
 * -----------------------
 * Lightweight wrapper for the assessment + results pages.
 *
 * Currently provides:
 *   - Right-click context menu disabled
 *   - Optional dismissible confidentiality notice
 *
 * That's it. Kept intentionally minimal to avoid annoying real users.
 */

import { useState } from "react";

function AssessmentSecurityShell({ children, showNotice = true }) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      {showNotice && !dismissed && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-800 flex-1">
              Your assessment is private. Please answer honestly — only you will see these results.
            </span>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded p-1 transition flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export default AssessmentSecurityShell;
