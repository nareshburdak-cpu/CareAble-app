// client/src/utils/employerHistory.js

/**
 * Employer lookup history — local persistence layer.
 * --------------------------------------------------
 * Stores the employer's recent certificate verifications + interest markers.
 *
 * ⚠️ MIGRATION NOTE:
 * This currently uses localStorage (per-device). When we move to cross-device
 * account-bound storage, ONLY the bodies of these four functions change — they
 * become `async` and call the backend via `api`. The dashboard already awaits
 * them, so no component changes are needed.
 *
 * Public API:
 *   getHistory()                  → Lookup[]   (newest first, max 5)
 *   saveLookup(lookup)            → Lookup[]   (returns updated list)
 *   setInterest(certId, interest) → Lookup[]   interest: "yes" | "no" | null
 *   removeLookup(certId)          → Lookup[]
 *   clearHistory()                → []
 *
 * Lookup shape (what we persist — intentionally minimal, no domain breakdowns):
 *   { certificateId, name, email, level, overallScore, issuedAt,
 *     interest: "yes"|"no"|null, savedAt: ISOString }
 */

const STORAGE_KEY = "careable.employer.history.v1";
const MAX_ITEMS = 5;

// Read raw array from storage (safe — never throws)
function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Write array to storage (safe — never throws)
function write(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full or unavailable — fail silently; history is non-critical.
  }
  return list;
}

/**
 * Return saved lookups, newest first, capped at MAX_ITEMS.
 * Async so a future backend swap is a drop-in.
 */
export async function getHistory() {
  return read();
}

/**
 * Persist a lookup. Dedupes by certificateId (most recent wins),
 * preserves any existing interest marker, and caps the list at MAX_ITEMS.
 * Only the fields an employer needs to recall a candidate are stored —
 * no domain scores, no IDs.
 */
export async function saveLookup(lookup) {
  const existing = read();
  const prior = existing.find((h) => h.certificateId === lookup.certificateId);

  const entry = {
    certificateId: lookup.certificateId,
    name: lookup.name ?? null,
    email: lookup.email ?? null,
    level: lookup.level ?? null,
    overallScore: lookup.overallScore ?? null,
    issuedAt: lookup.issuedAt ?? null,
    // Preserve a prior interest marker if the employer re-verifies the same cert
    interest: prior?.interest ?? null,
    savedAt: new Date().toISOString(),
  };

  const deduped = existing.filter((h) => h.certificateId !== lookup.certificateId);
  const next = [entry, ...deduped].slice(0, MAX_ITEMS);
  return write(next);
}

/**
 * Set/clear the interest marker on a saved lookup.
 * interest: "yes" | "no" | null  (null toggles it off)
 */
export async function setInterest(certificateId, interest) {
  const next = read().map((h) =>
    h.certificateId === certificateId ? { ...h, interest } : h
  );
  return write(next);
}

/** Remove a single lookup. */
export async function removeLookup(certificateId) {
  const next = read().filter((h) => h.certificateId !== certificateId);
  return write(next);
}

/** Clear all saved lookups. */
export async function clearHistory() {
  return write([]);
}