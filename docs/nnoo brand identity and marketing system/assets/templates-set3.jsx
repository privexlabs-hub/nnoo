// =========================================================
// Nnọọ Social Brand Playbook — pillar 7-9 templates
// Culture explainers · Product updates · Call-to-action
// =========================================================

// ======================================================
// PILLAR 7 — CULTURE EXPLAINERS
// ======================================================

// 7A. Carousel cover — IG square (1080×1080)
function Culture_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--forest-500)" }}>
      <ArcsMotif size={500} color="#faf5ec" opacity={0.10} style={{ position: "absolute", top: -120, left: -120 }} />
      <div style={{ position: "absolute", top: 80, left: 80, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--marigold-300)" }} />
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase", color: "#faf5ec", opacity: 0.85 }}>
          Culture · explainer · 7 slides
        </div>
      </div>
      {/* eyebrow phrase */}
      <div style={{ position: "absolute", top: 220, left: 80,
        fontFamily: "Fraunces", fontStyle: "italic", fontSize: 44, color: "var(--marigold-200)" }}>
        On naming —
      </div>
      <div style={{ position: "absolute", top: 320, left: 80, right: 80,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 124, lineHeight: 0.96,
        letterSpacing: "-0.025em", color: "#faf5ec" }}>
        Why we say<br/>the names<br/>of the day.
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 120 }}>
        <div style={{ fontFamily: "DM Sans", fontSize: 30, color: "var(--forest-100)", lineHeight: 1.4, maxWidth: 880 }}>
          Eke. Orie. Afọ. Nkwọ. The four market days are how the week is counted, how children are named, and how the old farmers still plan.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 56 }}>
          <BrandLockup size={28} color="#c85a26" reversed />
          <div style={{ padding: "10px 22px", border: "2px solid rgba(250,245,236,0.4)",
            borderRadius: 999, color: "#faf5ec", fontFamily: "DM Sans", fontWeight: 600, fontSize: 20,
            letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Swipe to read →
          </div>
        </div>
      </div>
    </Canvas>
  );
}

// 7B. LinkedIn essay-teaser — horizontal (1200×675)
function Culture_B() {
  return (
    <Canvas w={1200} h={675} scale={0.4} style={{ background: "var(--paper)" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 14, background: "var(--brand)" }} />
      <div style={{ position: "absolute", top: 64, left: 64, fontFamily: "DM Sans", fontWeight: 600, fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brand)" }}>
        Essay · 6 min read
      </div>
      <div style={{ position: "absolute", top: 110, left: 64, right: 64,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 64, lineHeight: 1.04, letterSpacing: "-0.02em", color: "var(--ink-900)" }}>
        What we lose when a language only lives in greetings.
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 120,
        fontFamily: "Fraunces", fontStyle: "italic", fontSize: 26, color: "var(--ink-700)", lineHeight: 1.45, maxWidth: 900 }}>
        "Hello, how are you" survives long after the names of plants, the rhythms of mourning, and the words for a specific kind of late-afternoon light have gone.
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 56,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={32} />
        <div style={{ fontFamily: "DM Sans", fontSize: 18, color: "var(--fg-subtle)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Read on the Nnọọ journal →
        </div>
      </div>
    </Canvas>
  );
}

// 7C. YouTube thumbnail (1280×720)
function Culture_C() {
  return (
    <Canvas w={1280} h={720} scale={0.38} style={{ background: "var(--clay-500)" }}>
      <PhotoField tone="clay" w={1280} h={720} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(26,18,11,0.0) 30%, rgba(26,18,11,0.92) 100%)" }} />
      {/* corner tag */}
      <div style={{ position: "absolute", top: 48, left: 48, padding: "10px 22px",
        background: "var(--marigold-400)", color: "var(--ink-900)", borderRadius: 999,
        fontFamily: "DM Sans", fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Explainer
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, bottom: 56, color: "#faf5ec" }}>
        <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 108, lineHeight: 0.96, letterSpacing: "-0.025em" }}>
          The eight tones<br/>of one syllable.
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 36 }}>
          <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 30, color: "var(--clay-100)" }}>
            with Dr. Ngozi Eze, linguist · 14:22
          </div>
          <BrandLockup size={32} color="#c85a26" reversed />
        </div>
      </div>
    </Canvas>
  );
}

// ======================================================
// PILLAR 8 — APP / PRODUCT UPDATES
// ======================================================

// 8A. Feature card with mock phone — IG square (1080×1080)
function Update_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--bone)" }}>
      <ArcsMotif size={400} color="#c85a26" opacity={0.08} style={{ position: "absolute", top: -60, left: -60 }} />
      <div style={{ position: "absolute", top: 80, left: 80, padding: "6px 18px",
        background: "var(--brand-soft)", color: "var(--brand-soft-fg)", borderRadius: 999,
        fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        New · v0.4
      </div>
      <div style={{ position: "absolute", top: 180, left: 80, right: 600,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 84, lineHeight: 0.98, letterSpacing: "-0.025em", color: "var(--ink-900)" }}>
        Tone feedback,<br/>now in real time.
      </div>
      <div style={{ position: "absolute", top: 580, left: 80, right: 600,
        fontFamily: "DM Sans", fontSize: 26, lineHeight: 1.5, color: "var(--fg-muted)" }}>
        Speak a word. See the tones you hit and the tones you missed, side by side.
      </div>
      {/* mock phone */}
      <div style={{ position: "absolute", right: 80, top: 200, width: 380, height: 720,
        background: "#1a120b", borderRadius: 48, padding: 14, boxShadow: "0 28px 72px rgba(58,24,9,0.18)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 36, background: "var(--bone)", padding: 28, overflow: "hidden" }}>
          <div style={{ fontFamily: "DM Sans", fontSize: 16, color: "var(--fg-subtle)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Lesson 04
          </div>
          <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 76, color: "var(--ink-900)", marginTop: 16, lineHeight: 1, letterSpacing: "-0.02em" }}>
            ụbọchị
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 17, color: "var(--fg-subtle)", marginTop: 8 }}>your attempt</div>
          <Waveform w={324} h={80} color="#c85a26" bars={28} style={{ marginTop: 18 }} />
          <div style={{ marginTop: 24, padding: 16, background: "var(--cream)", borderRadius: 14 }}>
            <div style={{ fontFamily: "DM Sans", fontSize: 14, color: "var(--forest-700)", fontWeight: 600 }}>Tone 2 ✓</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 14, color: "var(--clay-700)", fontWeight: 600, marginTop: 4 }}>Tone 3 — try lifting at the end</div>
          </div>
          <div style={{ marginTop: 24, padding: 14, background: "var(--brand)", color: "#faf5ec",
            borderRadius: 999, textAlign: "center", fontFamily: "DM Sans", fontWeight: 600, fontSize: 18 }}>Try again</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 80 }}><BrandLockup size={28} /></div>
    </Canvas>
  );
}

// 8B. Milestone numeric — IG square (1080×1080)
function Update_B() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--forest-500)" }}>
      <div style={{ position: "absolute", top: 100, left: 80, fontFamily: "DM Sans", fontWeight: 600, fontSize: 22,
        letterSpacing: "0.16em", textTransform: "uppercase", color: "#faf5ec", opacity: 0.78 }}>
        Milestone · April 2026
      </div>
      <div style={{ position: "absolute", top: 200, left: 80, right: 80, color: "#faf5ec",
        fontFamily: "Outfit", fontWeight: 800, fontSize: 360, lineHeight: 0.86, letterSpacing: "-0.04em" }}>
        1,000
      </div>
      <div style={{ position: "absolute", top: 580, left: 80, right: 80,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 64, lineHeight: 1.04, color: "#faf5ec", letterSpacing: "-0.02em" }}>
        recordings in Ọbá.
      </div>
      <div style={{ position: "absolute", top: 700, left: 80, right: 80,
        fontFamily: "Fraunces", fontStyle: "italic", fontSize: 32, lineHeight: 1.35, color: "var(--forest-100)", maxWidth: 880 }}>
        From 73 elders across 14 LGAs in 9 states. Eleven dialects represented. Six of them not in any dictionary.
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 80,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={28} color="#c85a26" reversed />
        <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--forest-100)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Thank you. Daalụ.
        </div>
      </div>
    </Canvas>
  );
}

// 8C. Release notes carousel cover — IG portrait 4:5 (1080×1350)
function Update_C() {
  return (
    <Canvas w={1080} h={1350} scale={1/3.2} style={{ background: "var(--paper)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: 80, background: "var(--bone)",
        borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brand)" }}>
          Release notes · v0.4 — Onye
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 100, lineHeight: 0.98, color: "var(--ink-900)", marginTop: 28, letterSpacing: "-0.025em" }}>
          Six small<br/>fixes. Three<br/>real changes.
        </div>
      </div>
      {/* list */}
      <div style={{ position: "absolute", top: 580, left: 80, right: 80 }}>
        {[
          { tag: "NEW", text: "Real-time tonal pronunciation feedback in lessons" },
          { tag: "NEW", text: "Dialect filter in Ọbá archive (six dialects)" },
          { tag: "FIX", text: "Igbo diacritics now render correctly on offline cards" },
        ].map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 32, padding: "24px 0",
            borderBottom: i < 2 ? "1px solid var(--ink-100)" : "none", alignItems: "flex-start" }}>
            <div style={{ padding: "6px 14px", background: it.tag === "NEW" ? "var(--brand-soft)" : "var(--forest-100)",
              color: it.tag === "NEW" ? "var(--brand-soft-fg)" : "var(--forest-700)", borderRadius: 6,
              fontFamily: "DM Sans", fontWeight: 700, fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase",
              minWidth: 76, textAlign: "center" }}>{it.tag}</div>
            <div style={{ fontFamily: "Outfit", fontWeight: 500, fontSize: 32, color: "var(--ink-900)", lineHeight: 1.3, flex: 1 }}>
              {it.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={28} />
        <div style={{ fontFamily: "DM Sans", fontSize: 22, color: "var(--fg-subtle)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Swipe for all 9 →
        </div>
      </div>
    </Canvas>
  );
}

// ======================================================
// PILLAR 9 — CALL TO ACTION
// ======================================================

// 9A. Become a facilitator — IG square (1080×1080)
function CTA_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--ink-900)" }}>
      <PhotoField tone="forest" w={1080} h={1080} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,93,58,0.85) 0%, rgba(26,18,11,0.85) 100%)" }} />
      <ArcsMotif size={600} color="#faf5ec" opacity={0.08} style={{ position: "absolute", top: -100, right: -150 }} />
      <div style={{ position: "absolute", top: 100, left: 80, padding: "10px 22px",
        border: "2px solid rgba(250,245,236,0.4)", borderRadius: 999,
        fontFamily: "DM Sans", fontWeight: 600, fontSize: 20, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "#faf5ec" }}>
        Call · facilitator
      </div>
      <div style={{ position: "absolute", top: 230, left: 80, right: 80, color: "#faf5ec" }}>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 116, lineHeight: 0.96, letterSpacing: "-0.025em" }}>
          Do you<br/>have an elder<br/>at home?
        </div>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 36, color: "var(--marigold-200)", marginTop: 40, lineHeight: 1.35, maxWidth: 880 }}>
          You don't need to be a recordist. You need an afternoon, a phone, and someone who has stories to tell.
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ padding: "18px 30px", background: "var(--marigold-400)", color: "var(--ink-900)",
          borderRadius: 999, fontFamily: "DM Sans", fontWeight: 700, fontSize: 26, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Become a facilitator →
        </div>
        <BrandLockup size={28} color="#c85a26" reversed />
      </div>
    </Canvas>
  );
}

// 9B. Donate — IG square (1080×1080) — restrained, archival
function CTA_B() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--cream)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: "var(--forest-500)" }} />
      <div style={{ position: "absolute", top: 80, left: 80, fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--forest-700)" }}>
        Support the archive
      </div>
      <div style={{ position: "absolute", top: 200, left: 80, right: 80,
        fontFamily: "Fraunces", fontWeight: 500, fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ink-900)" }}>
        An hour with<br/>an elder costs<br/>about $40 to<br/>archive properly.
      </div>
      <div style={{ position: "absolute", top: 760, left: 80, right: 80,
        fontFamily: "DM Sans", fontSize: 26, lineHeight: 1.5, color: "var(--fg-muted)", maxWidth: 880 }}>
        Audio gear, a facilitator's travel, transcription, careful metadata, and storage that outlives us.
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 80, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={28} />
        <div style={{ padding: "16px 28px", background: "var(--forest-500)", color: "#faf5ec",
          borderRadius: 999, fontFamily: "DM Sans", fontWeight: 700, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Give once · $40 →
        </div>
      </div>
    </Canvas>
  );
}

// 9C. Download — IG square (1080×1080) — warm, learner-aimed
function CTA_C() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--brand)", color: "#faf5ec" }}>
      <ArcsMotif size={680} color="#faf5ec" opacity={0.10} style={{ position: "absolute", top: -180, right: -180 }} />
      <ArcsMotif size={420} color="#faf5ec" opacity={0.10} style={{ position: "absolute", bottom: -120, left: -120, transform: "rotate(180deg)" }} />
      <div style={{ position: "absolute", top: 100, left: 80, fontFamily: "Fraunces", fontStyle: "italic", fontSize: 40, color: "var(--marigold-200)" }}>
        Nnọọ —
      </div>
      <div style={{ position: "absolute", top: 180, left: 80, right: 80,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 152, lineHeight: 0.92, letterSpacing: "-0.03em", color: "#faf5ec" }}>
        Welcome<br/>home.
      </div>
      <div style={{ position: "absolute", top: 600, left: 80, right: 80,
        fontFamily: "DM Sans", fontSize: 30, lineHeight: 1.5, color: "var(--clay-100)", maxWidth: 880 }}>
        Learn Igbo with the people who speak it.<br/>10-minute lessons. Real elders. Honest pronunciation feedback.
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ padding: "14px 24px", background: "var(--ink-900)", color: "#faf5ec", borderRadius: 14,
            fontFamily: "DM Sans", fontWeight: 600, fontSize: 22 }}>App Store</div>
          <div style={{ padding: "14px 24px", background: "var(--ink-900)", color: "#faf5ec", borderRadius: 14,
            fontFamily: "DM Sans", fontWeight: 600, fontSize: 22 }}>Google Play</div>
        </div>
        <BrandLockup size={32} color="#1a120b" reversed />
      </div>
    </Canvas>
  );
}

Object.assign(window, {
  Culture_A, Culture_B, Culture_C,
  Update_A, Update_B, Update_C,
  CTA_A, CTA_B, CTA_C,
});
