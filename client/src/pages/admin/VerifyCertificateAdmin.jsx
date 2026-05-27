import { useState } from "react";
import api from "../../api/axios";

const CERT_PATTERN = /^CA-[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){0,3}$/i;

const LEVEL_COLORS = {
  Strength: "border-emerald-200 bg-emerald-100 text-emerald-700",
  Growth: "border-indigo-200 bg-indigo-100 text-indigo-700",
  Support: "border-amber-200 bg-amber-100 text-amber-700",
};

export default function VerifyCertificateAdmin() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleVerify = async (certId) => {
    const id = (certId || input).trim().toUpperCase();

    if (!id) return;

    if (!CERT_PATTERN.test(id)) {
      setStatus("invalid");
      setResult(null);
      return;
    }

    setStatus("loading");
    setResult(null);

    try {
      const res = await api.get(`/verify/admin/${id}`);
      const data = res.data.data;

      setResult(data);
      setStatus(data.isRevoked ? "revoked" : "found");
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.certificateId !== data.certificateId);
        return [{ ...data, searchedAt: new Date() }, ...filtered].slice(0, 12);
      });
    } catch (err) {
      if (err.status === 404) {
        setStatus("not-found");
      } else if (err.status === 410) {
        setStatus("revoked");
      } else {
        setStatus("error");
      }
      setResult(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(input);
  };

  const handleReset = () => {
    setInput("");
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-4 p-4 md:p-8 xl:p-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-bold text-stone-900 md:text-3xl">Verify Certificates</h1>
          <p className="text-sm text-stone-500">
            Confirm certificate validity and inspect linked account details.
          </p>
        </div>

        <div className="mt-1 shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          {history.length} recent
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-3 md:space-y-4">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value.toUpperCase());
                      if (status !== "idle") setStatus("idle");
                    }}
                    placeholder="Enter certificate ID"
                    className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={status === "loading" || !input.trim()}
                    className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {status === "loading" ? "Checking..." : "Verify"}
                  </button>

                  {status !== "idle" && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                <span className="rounded-full bg-white px-2 py-1 font-mono text-stone-500">CA-YYYY-XXXXXX</span>
                <span>Case insensitive. Admin view includes account and assessment details.</span>
              </div>
            </form>

            {status === "invalid" && (
              <InlineStatusCard
                tone="amber"
                title="Invalid format"
                message="Use a certificate ID like CA-2026-FNVX9W."
              />
            )}

            {status === "not-found" && (
              <InlineStatusCard
                tone="stone"
                title="No match found"
                message="No certificate exists with that ID. Double-check the value and try again."
              />
            )}

            {status === "error" && (
              <InlineStatusCard
                tone="red"
                title="Verification failed"
                message="The lookup could not be completed right now. Please try again."
              />
            )}

            {(status === "found" || status === "revoked") && result && <ResultCard result={result} />}
          </div>

          <div className="space-y-3 md:space-y-4">
            <PanelCard
              eyebrow="Workflow"
              title="How this check works"
              note="Use the certificate ID from a PDF or shared record."
              className="hidden md:block"
            >
              <div className="grid gap-2">
                <WorkflowStep number="1" text="Paste or type the certificate ID." />
                <WorkflowStep number="2" text="Review the validity banner and linked account data." />
                <WorkflowStep number="3" text="Confirm score, level, and latest assessment context." />
              </div>
            </PanelCard>

            <PanelCard
              eyebrow="Recent"
              title="Verification history"
              note={history.length > 0 ? "Latest checks in this session" : "No checks yet in this session"}
            >
              {history.length === 0 ? (
                <div className="rounded-xl bg-stone-50 px-3 py-4 text-sm text-stone-500">
                  Recent certificate checks will appear here.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.certificateId}
                      onClick={() => {
                        setInput(item.certificateId);
                        handleVerify(item.certificateId);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-stone-800">{item.certificateId}</p>
                        <p className="mt-1 truncate text-sm text-stone-500">{item.name}</p>
                      </div>

                      <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                        {item.isRevoked ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            Revoked
                          </span>
                        ) : (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[item.level] || "bg-stone-100 text-stone-600"}`}
                          >
                            {item.level || "Unknown"}
                          </span>
                        )}
                        <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </PanelCard>
          </div>
        </div>
    </div>
  );
}

function PanelCard({ eyebrow, title, note, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-sm ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">{eyebrow}</p>
      <h3 className="mt-1 text-sm font-semibold text-stone-900 md:text-base">{title}</h3>
      <p className="mt-1 text-sm text-stone-500">{note}</p>
      <div className="mt-2.5 md:mt-3">{children}</div>
    </div>
  );
}

function WorkflowStep({ number, text }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-stone-50 px-3 py-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
        {number}
      </div>
      <p className="text-sm text-stone-600">{text}</p>
    </div>
  );
}

function InlineStatusCard({ tone, title, message }) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    stone: "border-stone-200 bg-stone-50 text-stone-700",
  };

  return (
    <div className={`rounded-[1.1rem] border px-4 py-4 ${tones[tone] || tones.stone}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-85">{message}</p>
    </div>
  );
}

function ResultCard({ result }) {
  const isRevoked = result.isRevoked;
  const domainEntries = result.domainScores
    ? Object.entries(result.domainScores).sort((a, b) => b[1] - a[1])
    : [];

  const issuedAt = result.issuedAt
    ? new Date(result.issuedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        isRevoked ? "border-red-200" : "border-emerald-200"
      }`}
    >
      <div className={`flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 ${isRevoked ? "bg-red-50" : "bg-emerald-50"}`}>
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            isRevoked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isRevoked ? "!" : "✓"}
        </span>
        <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${isRevoked ? "text-red-700" : "text-emerald-700"}`}>
          {isRevoked ? "Certificate revoked" : "Certificate verified"}
        </span>
        <span className="truncate font-mono text-[11px] text-stone-500">{result.certificateId}</span>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-stone-900 md:text-lg">{result.name}</h2>
            <p className="truncate text-sm text-stone-500">{result.email}</p>
            <p className="mt-1 text-xs text-stone-400">Issued {issuedAt}</p>
          </div>

          {result.level && (
            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${LEVEL_COLORS[result.level] || "bg-stone-100 text-stone-600"}`}
            >
              {result.level}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <InfoBox label="Overall score">
            {result.overallScore != null ? `${result.overallScore.toFixed(2)} / 5` : "-"}
          </InfoBox>
          <InfoBox label="Assessment ID" mono>
            {result.assessmentId || "-"}
          </InfoBox>
          <InfoBox label="User ID" mono>
            {result.userId || "-"}
          </InfoBox>
          <InfoBox label="Account created">
            {result.accountCreatedAt ? new Date(result.accountCreatedAt).toLocaleDateString("en-AU") : "-"}
          </InfoBox>
          <InfoBox label="Completion time">
            {result.completionTimeMs ? `${Math.round(result.completionTimeMs / 60000)} min` : "-"}
          </InfoBox>
          <InfoBox label="Flag">
            {result.rushed ? "Rushed" : "Clear"}
          </InfoBox>
        </div>

        {result.topAreas?.length > 0 && (
          <div>
             <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Top capability areas
            </p>
            <div className="flex flex-wrap gap-2">
              {result.topAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {domainEntries.length > 0 && (
          <div>
             <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Domain scores
            </p>
            <div className="space-y-2.5">
              {domainEntries.map(([domain, score]) => {
                const pct = ((score - 1) / 4) * 100;
                const barColor = score >= 4.0 ? "bg-emerald-500" : score >= 3.0 ? "bg-indigo-500" : "bg-amber-500";

                return (
                  <div key={domain}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-stone-600">{domain}</span>
                      <span className="flex-shrink-0 text-sm font-semibold text-stone-900">{score.toFixed(2)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function InfoBox({ label, children, mono = false }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className={`mt-1 text-sm font-medium text-stone-800 ${mono ? "break-all font-mono text-[10px]" : ""}`}>{children}</p>
    </div>
  );
}
