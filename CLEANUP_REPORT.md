# CLEANUP REPORT

## 1. SAFE TO REMOVE — no imports, no references anywhere, purely dead code

- `client/src/assets/CareAble_logo_brand.png`
  - Reason: No imports or string references found in client or server source. Also uses naming that differs from the surrounding asset style.
  - Confidence: high

- `client/src/assets/hero.png`
  - Reason: No imports or string references found in client or server source.
  - Confidence: high

- `client/src/assets/vite.svg`
  - Reason: Default Vite asset remains in `src/assets` but is not imported or referenced anywhere.
  - Confidence: high

- `client/src/components/AssessmentSecurityShell.jsx`
  - Reason: No imports or references found. It appears to be an unused wrapper for assessment/results privacy UI.
  - Confidence: high

- `client/src/components/CategorySection.jsx`
  - Reason: No reachable imports from the app entry point. It imports `ProgressBar` and `QuestionCard`, but nothing imports `CategorySection`.
  - Confidence: high

- `client/src/components/CategoryScoreCard.jsx`
  - Reason: No imports or references found. Results rendering appears to use other summary/heatmap components instead.
  - Confidence: high

- `client/src/components/ProgressBar.jsx`
  - Reason: Only referenced by dead `CategorySection.jsx`; not reachable from the app entry point.
  - Confidence: high

- `client/src/components/QuestionCard.jsx`
  - Reason: Only referenced by dead `CategorySection.jsx`. `client/src/pages/Assessment.jsx` defines and uses its own local `QuestionCard`, making this component chain unused.
  - Confidence: high

- `client/src/components/answers/FrequencyScale.jsx`
  - Reason: Not imported by any reachable component. It appears to belong to the unused standalone `QuestionCard.jsx` flow.
  - Confidence: high

- `client/src/components/answers/LikertScale.jsx`
  - Reason: Not imported by any reachable component. It appears to belong to the unused standalone `QuestionCard.jsx` flow.
  - Confidence: high

- `client/src/components/answers/MultiSelect.jsx`
  - Reason: Not imported by any reachable component. It appears to belong to the unused standalone `QuestionCard.jsx` flow.
  - Confidence: high

- `client/src/utils/categoryColors.js`
  - Reason: Only imported by dead `CategorySection.jsx` and dead `CategoryScoreCard.jsx`; no reachable source imports it.
  - Confidence: high

- `client/src/hooks/useDebounce.js`
  - Reason: No imports or references found anywhere in client source.
  - Confidence: high

- `client/src/utils/ToastBody.jsx`
  - Reason: No imports or references found. It is also a stub/near-duplicate of the real `ToastBody` implementation inside `client/src/utils/toast.jsx`. ESLint reports its `hotToast` import and props as unused.
  - Confidence: high

## 2. NEEDS MANUAL REVIEW — possibly used dynamically or via string references

- `client/public/logo-text.svg`
  - Reason: No source references found, but files in `public/` can be served directly by URL outside the import graph.
  - Confidence: medium

- `client/public/logo-icon.svg`
  - Reason: No source references found. The PNG variant is actively used via `/logo-icon.png`, but this SVG may still be used externally or kept as a brand asset.
  - Confidence: medium

- `server/server.js`
  - Reason: Contains production-path `console.log` startup messages at server boot. These may be acceptable operational logs, but they are still raw console output.
  - Confidence: medium

- `server/utils/sendEmail.js`
  - Reason: Contains several `console.log` statements for dev-mode email previews and successful send logging. The dev preview logs are intentional-looking; the production success log may need a logging policy decision.
  - Confidence: medium

- `client/src/assets/team/Phu.png`
  - Reason: Referenced by `client/src/constants/brand.js`, so not removable. Naming is inconsistent with nearby lowercase team image filenames; any rename would need a case-sensitive import update.
  - Confidence: low

## 3. KEEP — exists for a reason even if it looks unused

- `client/src/context/DEL_AuthProvider.jsx`
  - Reason: It is not imported by the current app, but it is auth-related and explicitly excluded from cleanup flagging.
  - Confidence: high

- `server/utils/categories.js`
  - Reason: Not used by the running server path, but it is imported by `server/seed/categories.seed.js` and `server/seed/questions.seed.js`. Seed support files are intentionally kept per cleanup scope.
  - Confidence: high

- `client/package.json`
  - Reason: No clearly unused runtime dependencies found. `tailwindcss` has no direct source import, but it is part of the Tailwind v4 setup used through `@tailwindcss/vite` in `client/vite.config.js`.
  - Confidence: high

- `server/package.json`
  - Reason: No clearly unused runtime dependencies found in non-excluded server code. Dependencies are referenced by server entry, controllers, models, utilities, or routing layers.
  - Confidence: high

- `server/controllers/*`, `server/routes/*`, `server/models/*`, `server/config/*`, and `server/middleware/*`
  - Reason: These areas are related to routing, auth, database schemas, config, or API response behavior and were intentionally excluded from cleanup findings.
  - Confidence: high
