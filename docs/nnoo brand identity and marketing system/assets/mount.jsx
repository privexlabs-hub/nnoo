// =========================================================
// Nnọọ Social Brand Playbook — mount script
// Finds every <div data-mount="ComponentName"> and renders the
// corresponding global component into it.
// =========================================================

// ----- Vertical gallery: 4 vertical templates side-by-side
function VerticalGallery() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
      {/* Story — word of day */}
      <div className="mockup">
        <div className="phone-frame">
          <div className="phone-frame__screen">
            <div style={{ width: 1080, height: 1920, transform: "scale(0.2)", transformOrigin: "top left",
              position: "relative", background: "linear-gradient(180deg, var(--clay-500) 0%, var(--clay-700) 100%)" }}>
              <ArcsMotif size={680} color="#faf5ec" opacity={0.10} style={{ position: "absolute", top: 240, right: -180 }} />
              <div style={{ position: "absolute", top: 100, left: 60, right: 60, display: "flex", gap: 8 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.4)", borderRadius: 4 }}>
                    {i === 1 && <div style={{ width: "60%", height: "100%", background: "#fff", borderRadius: 4 }} />}
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", top: 160, left: 60, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--marigold-400)", border: "5px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit", fontWeight: 700, fontSize: 36, color: "#1a120b" }}>n</div>
                <div style={{ color: "#fff", fontFamily: "Outfit", fontWeight: 600, fontSize: 36, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  nnoo · <span style={{ opacity: 0.7, fontWeight: 400 }}>2h</span>
                </div>
              </div>
              <div style={{ position: "absolute", top: 380, left: 60, right: 60, color: "#faf5ec",
                fontFamily: "DM Sans", fontWeight: 600, fontSize: 36, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.85 }}>
                Okwu · how is this said?
              </div>
              <div className="igbo" style={{ position: "absolute", top: 500, left: 60, right: 60,
                fontFamily: "Outfit", fontWeight: 700, fontSize: 220, lineHeight: 0.96,
                letterSpacing: "-0.03em", color: "#faf5ec" }}>
                nnà m
              </div>
              <div style={{ position: "absolute", left: 60, right: 60, bottom: 600, display: "flex", flexDirection: "column", gap: 28 }}>
                {[
                  { label: "/n.nà.m/", state: "default" },
                  { label: "/n.ná.m/", state: "selected" },
                  { label: "/n.ná.m̀/", state: "default" },
                ].map((it, i) => (
                  <div key={i} style={{
                    padding: "30px 36px",
                    background: it.state === "selected" ? "#faf5ec" : "rgba(250,245,236,0.16)",
                    color: it.state === "selected" ? "var(--ink-900)" : "#faf5ec",
                    borderRadius: 24,
                    fontFamily: "DM Sans", fontWeight: 600, fontSize: 40,
                    border: it.state === "selected" ? "none" : "2px solid rgba(250,245,236,0.35)"
                  }}>{it.label}</div>
                ))}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 360, textAlign: "center", color: "#faf5ec",
                fontFamily: "DM Sans", fontWeight: 600, fontSize: 28, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>
                Tap to hear · swipe up to learn
              </div>
            </div>
          </div>
        </div>
        <div className="mockup__label">IG Story · 1080×1920 · "How is this said?"</div>
      </div>

      {/* Reel cover — Diaspora before/after */}
      <div className="mockup">
        <div className="phone-frame">
          <div className="phone-frame__screen">
            <div style={{ width: 1080, height: 1920, transform: "scale(0.2)", transformOrigin: "top left",
              position: "relative", background: "var(--bone)" }}>
              <div style={{ position: "absolute", top: 200, left: 60, right: 60, height: 700,
                background: "var(--cream)", borderRadius: 36, padding: 56, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 32,
                    letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>Week 1</div>
                  <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 120, color: "var(--ink-900)",
                    marginTop: 32, lineHeight: 1, letterSpacing: "-0.025em" }}>ụmụ aka</div>
                  <div style={{ fontFamily: "DM Sans", fontSize: 28, color: "var(--fg-muted)", marginTop: 20 }}>
                    Three flat tones, no rhythm.
                  </div>
                </div>
                <Waveform w={900} h={120} color="#c85a26" bars={36} style={{ opacity: 0.4 }} />
              </div>
              <div style={{ position: "absolute", top: 980, left: 60, right: 60, height: 760,
                background: "var(--clay-500)", borderRadius: 36, padding: 56, color: "#faf5ec",
                display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 32,
                    letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.78 }}>Week 6</div>
                  <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 120,
                    marginTop: 32, lineHeight: 1, letterSpacing: "-0.025em" }}>ụmụ ákà</div>
                  <div style={{ fontFamily: "DM Sans", fontSize: 28, marginTop: 20, opacity: 0.92 }}>
                    "Children." Grandma understood.
                  </div>
                </div>
                <Waveform w={900} h={120} color="#faf5ec" bars={36} />
              </div>
            </div>
          </div>
        </div>
        <div className="mockup__label">Reel/TikTok · Before/after</div>
      </div>

      {/* BTS reel */}
      <div className="mockup">
        <div className="phone-frame">
          <div className="phone-frame__screen">
            <div style={{ width: 1080, height: 1920, transform: "scale(0.2)", transformOrigin: "top left",
              position: "relative", background: "var(--ink-900)" }}>
              <PhotoField tone="forest" w={1080} h={1920} />
              <div style={{ position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 30%, transparent 50%, rgba(26,18,11,0.85) 95%)" }} />
              <div style={{ position: "absolute", top: 200, left: 60,
                padding: "16px 30px", background: "var(--marigold-400)", color: "var(--ink-900)",
                borderRadius: 999, fontFamily: "DM Sans", fontWeight: 700, fontSize: 32,
                letterSpacing: "0.12em", textTransform: "uppercase" }}>
                BTS · 02:14
              </div>
              <div style={{ position: "absolute", left: 60, right: 60, bottom: 480, color: "#faf5ec" }}>
                <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 130, lineHeight: 0.96, letterSpacing: "-0.025em" }}>
                  We mic'd<br/>the kettle.
                </div>
                <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 40, lineHeight: 1.3,
                  color: "var(--clay-100)", marginTop: 36 }}>
                  The tea steeps for nine minutes. That's the part of the story we never knew to record.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mockup__label">Reel · BTS · field-notes cover</div>
      </div>

      {/* YT Short — proverb */}
      <div className="mockup">
        <div className="phone-frame">
          <div className="phone-frame__screen">
            <div style={{ width: 1080, height: 1920, transform: "scale(0.2)", transformOrigin: "top left",
              position: "relative", background: "var(--clay-500)" }}>
              <ArcsMotif size={680} color="#faf5ec" opacity={0.12} style={{ position: "absolute", top: -120, right: -120 }} />
              <div style={{ position: "absolute", top: 240, left: 60,
                fontFamily: "DM Sans", fontWeight: 600, fontSize: 32, letterSpacing: "0.18em", textTransform: "uppercase",
                color: "#faf5ec", opacity: 0.85 }}>
                Ilu · proverb of the day
              </div>
              <div className="igbo" style={{ position: "absolute", top: 380, left: 60, right: 60,
                fontFamily: "Outfit", fontWeight: 700, fontSize: 144, lineHeight: 1.02,
                letterSpacing: "-0.025em", color: "#faf5ec" }}>
                Onye<br/>aghụghọ<br/>na-ebi<br/>n'ọhịa.
              </div>
              <div style={{ position: "absolute", left: 60, right: 60, bottom: 640,
                fontFamily: "Fraunces", fontStyle: "italic", fontSize: 40, lineHeight: 1.35, color: "var(--clay-100)" }}>
                "The cunning one lives in the bush." On deceit — the one who cannot live straight ends up alone.
              </div>
              <div style={{ position: "absolute", left: 60, right: 60, bottom: 380,
                display: "flex", alignItems: "center", gap: 20 }}>
                <Waveform w={760} h={64} color="#faf5ec" bars={36} />
                <div style={{ color: "#faf5ec", fontFamily: "DM Sans", fontWeight: 600, fontSize: 28 }}>0:42</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mockup__label">YT Short · daily proverb · audio</div>
      </div>
    </div>
  );
}

window.VerticalGallery = VerticalGallery;

// ----- Mount: scan the page and render every data-mount target
(function mountAll() {
  function go() {
    const nodes = document.querySelectorAll("[data-mount]");
    nodes.forEach(node => {
      if (node.dataset.mounted) return;
      const name = node.getAttribute("data-mount");
      const Comp = window[name];
      if (!Comp) {
        console.warn("[playbook] component not found:", name);
        node.innerHTML = `<div style="padding:24px;background:#fdf6e3;border:1px dashed #b88214;color:#684809;font-family:DM Sans;font-size:14px;border-radius:12px;">Missing component: ${name}</div>`;
        return;
      }
      const root = ReactDOM.createRoot(node);
      root.render(<Comp />);
      node.dataset.mounted = "true";
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", go);
  } else {
    go();
  }
})();
