// client/src/components/CinematicCarousel.jsx
// v7 — clean, no broken tags

import { useState, useEffect, useCallback } from "react";
import { TEAM, PARTNERS } from "../constants/brand";

const AUTO_ADVANCE_MS = 2500;
const SLIDE = "transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms cubic-bezier(0.16,1,0.3,1)";
const FLIP  = "transform 650ms cubic-bezier(0.16,1,0.3,1)";

const CARD_W  = 210;
const CARD_VW = 62;
const CARD_H  = 215;
const GAP_SM  = 140;
const GAP_LG  = 185;
const TRACK_H = `${CARD_H + 8}px`;

function Blobs() {
  return (
    <>
      <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none animate-blob-float"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.45), transparent 70%)" }} />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none animate-blob-float"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.45), transparent 70%)", animationDelay: "5s" }} />
    </>
  );
}

function Dots({ count, active, onSelect }) {
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <button key={i} onClick={() => onSelect(i)} aria-label={`Item ${i + 1}`}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === active ? "w-7 bg-indigo-500" : "w-1.5 bg-stone-300 hover:bg-stone-400"
          }`} />
      ))}
    </div>
  );
}

function getOffset(active, i, len) {
  let d = i - active;
  const h = Math.floor(len / 2);
  if (d > h)  d -= len;
  if (d < -h) d += len;
  return d;
}

function gap() { return window.innerWidth < 640 ? GAP_SM : GAP_LG; }

function FlipShell({ isActive, flipped, front, back }) {
  const w = `min(${CARD_W}px, ${CARD_VW}vw)`;
  return (
    <div
      className="rounded-3xl transition-all duration-300 cursor-pointer select-none"
      style={{
        width: w,
        height: `${CARD_H}px`,
        perspective: "1100px",
        boxShadow: isActive
          ? "0 0 0 2px rgb(129,140,248), 0 20px 60px -10px rgba(99,102,241,0.45), 0 8px 24px rgba(0,0,0,0.15)"
          : "0 4px 16px rgba(0,0,0,0.10)",
      }}
    >
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: FLIP,
      }}>
        <div className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          {front}
        </div>
        <div className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          {back}
        </div>
      </div>
    </div>
  );
}

function useCarousel(len, initialIdx = 0) {
  const [ui, setUi] = useState({ idx: initialIdx, flipped: null, hovered: false });

  const go = useCallback((i) =>
    setUi((p) => ({ ...p, idx: ((i % len) + len) % len, flipped: null })), [len]);

  const toggle = useCallback((i) =>
    setUi((p) => ({ ...p, flipped: p.flipped === i ? null : i })), []);

  useEffect(() => {
    if (len <= 1) return;
    const id = setInterval(() => {
      setUi((p) => {
        if (p.hovered || p.flipped !== null) return p;
        return { ...p, idx: (p.idx + 1) % len, flipped: null };
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [len]);

  const hover = useCallback((v) => setUi((p) => ({ ...p, hovered: v })), []);

  return { ui, go, toggle, hover };
}

function CarouselTrack({ items, ui, go, toggle, hover, renderCard }) {
  return (
    <div className="relative overflow-hidden" style={{ height: TRACK_H }}
      onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      {items.map((item, i) => {
        const off = getOffset(ui.idx, i, items.length);
        const isActive = off === 0;
        const abs = Math.abs(off);
        if (abs > 2) return null;
        const scale   = isActive ? 1 : abs === 1 ? 0.8  : 0.62;
        const opacity = isActive ? 1 : abs === 1 ? 0.48 : 0.18;
        return (
          <div key={i} className="absolute top-1 left-1/2"
            style={{
              transform: `translateX(-50%) translateX(${off * gap()}px) scale(${scale})`,
              opacity, zIndex: 10 - abs,
              transition: SLIDE, willChange: "transform, opacity",
            }}
            onClick={() => isActive ? toggle(i) : go(i)}
          >
            {renderCard(item, i, isActive, ui.flipped === i)}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// TEAM CAROUSEL
// =============================================================================
export function TeamCarousel({ initialIdx = 0 }) {
  const members = TEAM.filter((m) => m.confirmed);
  const safeInit = Math.min(initialIdx, members.length - 1);
  const { ui, go, toggle, hover } = useCarousel(members.length, safeInit);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <Blobs />
      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 font-semibold mb-2">Our team</p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 mb-3 leading-tight">
            The people behind CareAble
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto text-sm">
            A multidisciplinary team from La Trobe University's research and technology community.
          </p>
        </div>
        <CarouselTrack
          items={members} ui={ui} go={go} toggle={toggle} hover={hover}
          renderCard={(m, _i, isActive, flipped) => (
            <TeamFlipCard member={m} isActive={isActive} flipped={flipped} />
          )}
        />
        <Dots count={members.length} active={ui.idx} onSelect={go} />
      </div>
    </section>
  );
}

function TeamFlipCard({ member, isActive, flipped }) {
  const front = (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          className="w-full h-full object-cover scale-105"
          style={{ objectPosition: "center 15%" }}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${member.gradient} flex items-center justify-center`}>
          <span className="text-6xl font-bold text-white/90 tracking-tight">{member.initials}</span>
        </div>
      )}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 40%, transparent 65%)",
      }} />
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <div className="rounded-2xl px-3.5 py-1.5" style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}>
          <p className="font-bold text-white text-sm leading-tight tracking-tight">{member.name}</p>
          <p className="text-[11px] font-medium mt-0" style={{ color: "rgba(167,139,250,1)" }}>{member.role}</p>
          {isActive && (
            <p className="text-[10px] text-white/40 text-right mt-0.5">tap for bio →</p>
          )}
        </div>
      </div>
    </div>
  );

  const back = (
    <div className={`w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br ${member.gradient}`}>
      <div className="relative">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/30">
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="w-full h-full object-cover" style={{ objectPosition: "center 15%" }} />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{member.initials}</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-white text-xs leading-tight">{member.name}</p>
            <p className="text-[10px] text-white/70">{member.org}</p>
          </div>
        </div>
        <div className="h-px bg-white/20 mb-3" />
        <p className="text-[11px] text-white/85 leading-relaxed line-clamp-5">{member.bio}</p>
      </div>
      <p className="text-[10px] text-white/40 text-right">tap to close →</p>
    </div>
  );

  return <FlipShell isActive={isActive} flipped={flipped} front={front} back={back} />;
}

// =============================================================================
// PARTNERS CAROUSEL
// =============================================================================
export function PartnersCarousel() {
  const partners = PARTNERS.filter((p) => p.confirmed);
  const { ui, go, toggle, hover } = useCarousel(partners.length);

  return (
    <section className="relative py-16 md:py-24 bg-stone-50/70 border-y border-stone-200 overflow-hidden">
      <Blobs />
      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 font-semibold mb-2">Our partners</p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 mb-3">
            Backed by leading institutions
          </h2>
          <p className="text-stone-500 max-w-lg mx-auto text-sm">
            Developed in collaboration with La Trobe University and supported by partner organisations across the care and research sectors.
          </p>
        </div>
        <CarouselTrack
          items={partners} ui={ui} go={go} toggle={toggle} hover={hover}
          renderCard={(p, _i, isActive, flipped) => (
            <PartnerFlipCard partner={p} isActive={isActive} flipped={flipped} />
          )}
        />
        <Dots count={partners.length} active={ui.idx} onSelect={go} />
        <p className="text-center text-xs text-stone-400 mt-6">
          Interested in partnering with CareAble?{" "}
          <a href="#contact" className="text-indigo-600 hover:underline">Get in touch →</a>
        </p>
      </div>
    </section>
  );
}

function PartnerFlipCard({ partner, isActive, flipped }) {
  const gradientMap = {
    "bg-red-600":   "from-red-500 to-rose-700",
    "bg-blue-700":  "from-blue-500 to-indigo-700",
    "bg-stone-400": "from-stone-300 to-stone-500",
  };
  const grad = gradientMap[partner.bgColor] || "from-indigo-500 to-purple-700";

  const front = (
    <div className="w-full h-full relative overflow-hidden">
      <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
        {partner.logo ? (
          <img src={partner.logo} alt={partner.name} className="w-16 h-16 object-contain drop-shadow-lg" />
        ) : (
          <span className="text-3xl font-bold text-white/90 tracking-tight">{partner.abbr}</span>
        )}
      </div>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 40%, transparent 65%)",
      }} />
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <div className="rounded-2xl px-3.5 py-1.5" style={{
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}>
          <p className="font-bold text-white text-sm leading-tight tracking-tight">{partner.name}</p>
          <p className="text-[11px] font-medium mt-0" style={{ color: "rgba(167,139,250,1)" }}>
            Partner organisation
          </p>
          {isActive && (
            <p className="text-[10px] text-white/40 text-right mt-0.5">tap for info →</p>
          )}
        </div>
      </div>
    </div>
  );

  const back = (
    <div className={`w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br ${grad}`}>
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-white/30 flex items-center justify-center ${partner.bgColor}`}>
            <span className="text-xs font-bold text-white">{partner.abbr.slice(0, 2)}</span>
          </div>
          <div>
            <p className="font-bold text-white text-xs leading-tight">{partner.name}</p>
            <p className="text-[10px] text-white/70">Partner organisation</p>
          </div>
        </div>
        <div className="h-px bg-white/20 mb-3" />
        <p className="text-[11px] text-white/85 leading-relaxed">{partner.description}</p>
      </div>
      <div className="flex items-center justify-between mt-3">
        {partner.url ? (
          <a
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-white font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition"
          >
            Visit website →
          </a>
        ) : (
          <span />
        )}
        <span className="text-[10px] text-white/40">← close</span>
      </div>
    </div>
  );

  return <FlipShell isActive={isActive} flipped={flipped} front={front} back={back} />;
}