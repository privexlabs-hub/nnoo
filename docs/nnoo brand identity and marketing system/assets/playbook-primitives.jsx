// =========================================================
// Nnọọ Social Brand Playbook — post template components
// Each template is designed at its real export pixel size and
// scaled down with transform: scale() for display.
// =========================================================

const { useEffect } = React;

// ---- shared shells ---------------------------------------

// A canvas with explicit real pixel dimensions, scaled to fit.
// All children style values are in REAL pixels (e.g. fontSize: 72).
function Canvas({ w, h, scale = 1/3, style, children, className }) {
  const dispW = Math.round(w * scale);
  const dispH = Math.round(h * scale);
  return (
    <div className={"mockup__frame " + (className || "")} style={{ width: dispW, height: dispH, borderRadius: 12 }}>
      <div style={{
        width: w, height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        position: "relative",
        ...style
      }}>
        {children}
      </div>
    </div>
  );
}

// A labelled mockup with format caption underneath
function Mockup({ label, children }) {
  return (
    <div className="mockup">
      <div>{children}</div>
      <div className="mockup__label">{label}</div>
    </div>
  );
}

// Phone shell for vertical 9:16 content (stories / reels / shorts)
function PhoneVertical({ scale = 1/5, children, label, platform }) {
  const w = 1080, h = 1920;
  return (
    <Mockup label={label}>
      <div className="phone-frame" style={{ width: w * scale + 16, height: h * scale + 16 }}>
        <div className="phone-frame__screen" style={{ width: w * scale, height: h * scale }}>
          <div style={{
            width: w, height: h,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            overflow: "hidden"
          }}>
            {children}
            {platform && <PlatformChrome platform={platform} />}
          </div>
        </div>
      </div>
    </Mockup>
  );
}

// Subtle UI chrome overlay for vertical content (story bar / reel CTAs)
function PlatformChrome({ platform }) {
  if (platform === "ig-story") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* top progress bars */}
        <div style={{ position: "absolute", top: 24, left: 32, right: 32, display: "flex", gap: 6 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, background: "rgba(255,255,255,0.4)", borderRadius: 2
            }}>
              {i === 1 && <div style={{ width: "60%", height: "100%", background: "#fff", borderRadius: 2 }} />}
            </div>
          ))}
        </div>
        {/* user row */}
        <div style={{ position: "absolute", top: 56, left: 32, right: 32, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--clay-500)",
            border: "3px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#faf5ec", fontFamily: "Outfit", fontWeight: 700, fontSize: 24
          }}>n</div>
          <div style={{ color: "#fff", fontFamily: "Outfit", fontWeight: 600, fontSize: 28, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            nnoo · <span style={{ opacity: 0.7, fontWeight: 400 }}>2h</span>
          </div>
        </div>
      </div>
    );
  }
  if (platform === "tiktok" || platform === "reel" || platform === "short") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* right rail icons */}
        <div style={{ position: "absolute", right: 32, bottom: 280, display: "flex", flexDirection: "column", gap: 36, alignItems: "center" }}>
          {[
            { label: "12.4K", glyph: "♡" },
            { label: "284", glyph: "💬" },
            { label: "Share", glyph: "↗" },
          ].map((it, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 32
              }}>{it.glyph}</div>
              <div style={{ color: "#fff", fontSize: 18, marginTop: 6, fontFamily: "DM Sans" }}>{it.label}</div>
            </div>
          ))}
        </div>
        {/* bottom caption */}
        <div style={{ position: "absolute", left: 32, right: 140, bottom: 120, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
          <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 28 }}>@nnoo</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 24, opacity: 0.92, marginTop: 6, lineHeight: 1.35 }}>
            Tones change meaning. Try this one.
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Photo placeholder — uses a tonal gradient field per the design system
function PhotoField({ tone = "clay", label, w, h, style }) {
  const palettes = {
    clay:   ["#c85a26", "#873818", "#3a1809"],
    marigold: ["#d9a019", "#b88214", "#684809"],
    plum:   ["#a8678a", "#6d2c4f", "#421630"],
    forest: ["#6f9778", "#2e5d3a", "#153a1f"],
    cream:  ["#f3ead8", "#d6c8ad", "#a99983"],
  };
  const [c1, c2, c3] = palettes[tone] || palettes.clay;
  return (
    <div style={{
      width: w, height: h,
      background: `radial-gradient(60% 80% at 30% 25%, ${c1} 0%, ${c2} 55%, ${c3} 100%)`,
      position: "relative",
      overflow: "hidden",
      ...style
    }}>
      {/* warm light gleam */}
      <div style={{
        position: "absolute", top: "10%", left: "8%", width: "40%", height: "40%",
        background: "radial-gradient(circle, rgba(255,230,180,0.45) 0%, transparent 70%)",
        filter: "blur(2px)"
      }} />
      {label && (
        <div style={{
          position: "absolute", left: 24, bottom: 20,
          color: "rgba(255,255,255,0.75)",
          fontFamily: "DM Sans", fontSize: 14,
          letterSpacing: "0.08em", textTransform: "uppercase",
          background: "rgba(0,0,0,0.32)", padding: "6px 12px", borderRadius: 6,
          backdropFilter: "blur(4px)"
        }}>{label}</div>
      )}
    </div>
  );
}

// Waveform — simple decorative bars
function Waveform({ w, h, color = "#faf5ec", bars = 48, style }) {
  const items = Array.from({ length: bars }, (_, i) => {
    // pseudo-organic envelope
    const t = i / bars;
    const env = Math.sin(t * Math.PI) * 0.85 + 0.15;
    const noise = 0.5 + 0.5 * Math.abs(Math.sin(i * 1.7) + Math.cos(i * 0.9));
    return env * noise;
  });
  return (
    <div style={{ width: w, height: h, display: "flex", alignItems: "center", gap: w / bars * 0.3, ...style }}>
      {items.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${Math.max(8, v * 100)}%`,
          background: color, borderRadius: 999, opacity: 0.92
        }} />
      ))}
    </div>
  );
}

// Logo lock-up element — re-used a lot
function BrandLockup({ size = 40, color = "var(--brand)", reversed = false }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="38" fill={color} />
        <path d="M22 32 Q40 14 58 32" stroke={reversed ? "#1a120b" : "#faf5ec"} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M22 48 Q40 66 58 48" stroke={reversed ? "#1a120b" : "#faf5ec"} strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="40" cy="40" r="4.5" fill={reversed ? "#1a120b" : "#faf5ec"} />
      </svg>
      <span style={{
        fontFamily: "Outfit", fontWeight: 700, fontSize: size * 0.85,
        color: reversed ? "#faf5ec" : "var(--ink-900)",
        letterSpacing: "-0.02em"
      }}>Nnọọ</span>
    </div>
  );
}

// ----- Decorative "two arcs" motif used in some templates
function ArcsMotif({ size = 200, color = "#faf5ec", opacity = 0.18, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ opacity, ...style }}>
      <path d="M10 32 Q40 -4 70 32" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M10 48 Q40 84 70 48" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="40" r="3" fill={color} />
    </svg>
  );
}

Object.assign(window, {
  Canvas, Mockup, PhoneVertical, PhotoField, Waveform, BrandLockup, ArcsMotif
});
