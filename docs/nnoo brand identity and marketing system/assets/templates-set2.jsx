// =========================================================
// Nnọọ Social Brand Playbook — pillar 4-6 templates
// Hometown stories · Behind the archive · Diaspora voices
// =========================================================

// ======================================================
// PILLAR 4 — HOMETOWN STORIES
// ======================================================

// 4A. Numeric milestone — IG square (1080×1080) — community signal in plum
function Hometown_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--plum-500)" }}>
      <ArcsMotif size={520} color="#faf5ec" opacity={0.10} style={{ position: "absolute", top: -130, left: -120 }} />
      <div style={{ position: "absolute", top: 80, left: 80, fontFamily: "DM Sans", fontWeight: 600, fontSize: 22,
        letterSpacing: "0.18em", textTransform: "uppercase", color: "#faf5ec", opacity: 0.78 }}>
        Hometown · Obodo
      </div>
      <div style={{ position: "absolute", top: 200, left: 80, right: 80,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 92, lineHeight: 1.02, letterSpacing: "-0.025em",
        color: "#faf5ec" }}>
        Nnewi has<br/>added 14 new<br/>recordings<br/>this month.
      </div>
      {/* large numeric corner */}
      <div style={{ position: "absolute", right: 80, bottom: 200,
        fontFamily: "Outfit", fontWeight: 800, fontSize: 360, lineHeight: 0.85,
        color: "var(--marigold-300)", letterSpacing: "-0.04em" }}>
        14
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 80, right: 80,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <BrandLockup size={32} color="#c85a26" reversed />
          <div style={{ fontFamily: "DM Sans", fontSize: 22, color: "#faf5ec", opacity: 0.7, marginTop: 12 }}>
            Anambra · Nnewi LGA · 87 total
          </div>
        </div>
        <div style={{ padding: "10px 22px", border: "2px solid rgba(250,245,236,0.4)",
          borderRadius: 999, color: "#faf5ec", fontFamily: "DM Sans", fontWeight: 600, fontSize: 20,
          letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Browse Nnewi →
        </div>
      </div>
    </Canvas>
  );
}

// 4B. Place + voice — IG square (1080×1080)
function Hometown_B() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--bone)" }}>
      {/* top photo half */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 540 }}>
        <PhotoField tone="marigold" w={1080} h={540} />
        <div style={{ position: "absolute", left: 64, bottom: 36,
          background: "var(--ink-900)", color: "#faf5ec",
          padding: "12px 22px", borderRadius: 8,
          fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase"
        }}>
          Onitsha · Anambra
        </div>
      </div>
      {/* bottom transcript */}
      <div style={{ position: "absolute", top: 540, left: 0, right: 0, bottom: 0,
        padding: "64px 80px 80px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 20, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brand)" }}>
            From the archive · transcript
          </div>
          <div className="igbo" style={{ fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: 44,
            lineHeight: 1.25, color: "var(--ink-900)", marginTop: 24, maxWidth: 880 }}>
            "Onitsha market was the river itself. My mother kept stockfish under the bench, and I learned numbers counting kobo."
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BrandLockup size={28} />
          <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--fg-subtle)" }}>
            Recorded by Ifeoma N. · 2026
          </div>
        </div>
      </div>
    </Canvas>
  );
}

// 4C. Map-anchored card — X / LinkedIn (1200×675)
function Hometown_C() {
  return (
    <Canvas w={1200} h={675} scale={0.4} style={{ background: "var(--bone)" }}>
      {/* Left: typographic */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 720, padding: "64px" }}>
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--community)" }}>
          Hometown · Obodo
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 92, lineHeight: 0.98, color: "var(--ink-900)", marginTop: 24, letterSpacing: "-0.025em" }}>
          Awka.
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 22, color: "var(--fg-muted)", marginTop: 22, lineHeight: 1.5, maxWidth: 600 }}>
          53 recordings · 11 elders · 4 dialect variations across the LGA.<br/>
          Looking for ndị Awka now living abroad.
        </div>
        <div style={{ display: "inline-block", marginTop: 36, padding: "14px 26px",
          background: "var(--ink-900)", color: "var(--bone)", borderRadius: 999,
          fontFamily: "DM Sans", fontWeight: 600, fontSize: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Add a story →
        </div>
      </div>
      {/* Right: abstract map block */}
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 480, background: "var(--cream)",
        borderLeft: "1px solid var(--border)", padding: "64px 48px" }}>
        <svg viewBox="0 0 200 200" style={{ width: "100%", height: 280 }}>
          {/* abstract Nigeria-shape blob */}
          <path d="M40 90 Q30 60 60 50 Q90 30 130 45 Q170 55 168 90 Q172 130 145 155 Q120 180 85 175 Q50 170 42 135 Q35 110 40 90 Z"
            fill="#d6c8ad" stroke="#a99983" strokeWidth="1" />
          {/* Anambra dot */}
          <circle cx="105" cy="92" r="6" fill="#6d2c4f" />
          <circle cx="105" cy="92" r="14" fill="none" stroke="#6d2c4f" strokeWidth="1.5" opacity="0.6" />
          <circle cx="105" cy="92" r="22" fill="none" stroke="#6d2c4f" strokeWidth="1" opacity="0.35" />
          {/* label */}
          <text x="115" y="80" fontFamily="DM Sans" fontSize="9" fill="#6d2c4f" fontWeight="600">Awka</text>
        </svg>
        <div style={{ fontFamily: "DM Sans", fontSize: 18, color: "var(--fg-subtle)", marginTop: 24, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Anambra State · South-East
        </div>
        <div style={{ marginTop: 36 }}><BrandLockup size={28} /></div>
      </div>
    </Canvas>
  );
}

// ======================================================
// PILLAR 5 — BEHIND THE ARCHIVE
// ======================================================

// 5A. Field notes journal — IG square (1080×1080)
function Behind_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{
      background: "var(--cream)",
      backgroundImage: "repeating-linear-gradient(transparent 0 56px, rgba(58,24,9,0.06) 56px 57px)"
    }}>
      {/* red margin line */}
      <div style={{ position: "absolute", left: 132, top: 0, bottom: 0, width: 1.5, background: "var(--clay-300)", opacity: 0.6 }} />
      <div style={{ position: "absolute", top: 56, left: 64, fontFamily: "DM Sans", fontWeight: 600, fontSize: 20,
        letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>
        Field notes · 14.04.2026 · Owerri
      </div>
      <div style={{ position: "absolute", top: 132, left: 160, right: 80,
        fontFamily: "Fraunces", fontWeight: 400, fontSize: 38, lineHeight: 1.45, color: "var(--ink-900)" }}>
        <div style={{ marginBottom: 28 }}>
          <strong style={{ fontWeight: 500 }}>Day three.</strong> Sat with Papa Ikenna for the third afternoon. He keeps wanting to start with songs his mother taught him, and we keep meaning to record the kola-nut blessing first.
        </div>
        <div style={{ marginBottom: 28 }}>
          We let him start with the songs.
        </div>
        <div style={{ color: "var(--ink-700)" }}>
          Two hours later, the kola-nut words came on their own. Better recordings than I could have planned.
        </div>
      </div>
      <div style={{ position: "absolute", left: 160, right: 80, bottom: 64,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--fg-muted)" }}>
          — Chinyere O., facilitator
        </div>
        <BrandLockup size={28} />
      </div>
    </Canvas>
  );
}

// 5B. Process / Reel cover — vertical 9:16 (1080×1920) — BTS
function Behind_B() {
  return (
    <Canvas w={1080} h={1920} scale={1/5.5} style={{ background: "var(--ink-900)" }}>
      <PhotoField tone="forest" w={1080} h={1920} />
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 30%, transparent 50%, rgba(26,18,11,0.85) 95%)" }} />
      {/* top tag */}
      <div style={{ position: "absolute", top: 200, left: 60,
        padding: "16px 30px", background: "var(--marigold-400)", color: "var(--ink-900)",
        borderRadius: 999, fontFamily: "DM Sans", fontWeight: 700, fontSize: 32,
        letterSpacing: "0.12em", textTransform: "uppercase" }}>
        BTS · 02:14
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 280, color: "#faf5ec" }}>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 130, lineHeight: 0.96,
          letterSpacing: "-0.025em" }}>
          We mic'd<br/>the kettle.
        </div>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 40, lineHeight: 1.3,
          color: "var(--clay-100)", marginTop: 36 }}>
          The tea steeps for nine minutes. That's the part of the story we never knew to record.
        </div>
      </div>
    </Canvas>
  );
}

// 5C. Carousel cover — IG square (1080×1080) — "How a recording happens"
function Behind_C() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--bone)" }}>
      <div style={{ position: "absolute", top: 80, left: 80, display: "flex", gap: 12 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ width: 22, height: 22, borderRadius: 999,
            background: i === 0 ? "var(--brand)" : "var(--ink-100)",
            border: i === 0 ? "none" : "1px solid var(--border)" }} />
        ))}
        <div style={{ marginLeft: 8, fontFamily: "DM Sans", fontWeight: 600, fontSize: 20,
          letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>
          1 of 6
        </div>
      </div>
      <div style={{ position: "absolute", top: 200, left: 80, right: 80 }}>
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brand)" }}>
          How a recording happens
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 132, lineHeight: 0.96,
          letterSpacing: "-0.025em", color: "var(--ink-900)", marginTop: 28 }}>
          We sit.<br/>We listen.<br/>We don't<br/>hurry.
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={28} />
        <div style={{ fontFamily: "DM Sans", fontSize: 22, color: "var(--fg-muted)",
          letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 12 }}>
          Swipe →
        </div>
      </div>
    </Canvas>
  );
}

// ======================================================
// PILLAR 6 — DIASPORA VOICES
// ======================================================

// 6A. Learner testimonial — IG square (1080×1080)
function Diaspora_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--bone)" }}>
      {/* top: portrait circle */}
      <div style={{ position: "absolute", top: 120, left: 80,
        width: 200, height: 200, borderRadius: "50%", overflow: "hidden",
        border: "5px solid var(--paper)", boxShadow: "0 14px 40px rgba(58,24,9,0.14)" }}>
        <PhotoField tone="plum" w={200} h={200} />
      </div>
      <div style={{ position: "absolute", top: 160, left: 320, right: 80 }}>
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 20, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--community)" }}>
          Diaspora voices
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 48, color: "var(--ink-900)", marginTop: 12, letterSpacing: "-0.01em" }}>
          Chioma, age 11
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 22, color: "var(--fg-subtle)", marginTop: 8 }}>
          Atlanta · learning since Jan
        </div>
      </div>
      {/* big quote */}
      <div style={{ position: "absolute", top: 420, left: 80, right: 80 }}>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 92, color: "var(--brand)", lineHeight: 1, marginBottom: 12 }}>
          "
        </div>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 52, lineHeight: 1.22, color: "var(--ink-900)" }}>
          Grandma laughed when I said <span style={{ fontStyle: "normal", color: "var(--brand)", fontWeight: 500 }}>nnà m</span> on the phone. She said I sounded like my uncle.
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 80,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={28} />
        <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--fg-subtle)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          A learner from Ọha
        </div>
      </div>
    </Canvas>
  );
}

// 6B. Before/after pronunciation — Reel/Short (1080×1920)
function Diaspora_B() {
  return (
    <Canvas w={1080} h={1920} scale={1/5.5} style={{ background: "var(--bone)" }}>
      {/* top half - "before" */}
      <div style={{ position: "absolute", top: 200, left: 60, right: 60, height: 700,
        background: "var(--cream)", borderRadius: 36, padding: 56, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 32,
            letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>
            Week 1
          </div>
          <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 120, color: "var(--ink-900)",
            marginTop: 32, lineHeight: 1, letterSpacing: "-0.025em" }}>
            ụmụ aka
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 28, color: "var(--fg-muted)", marginTop: 20 }}>
            Three flat tones, no rhythm.
          </div>
        </div>
        <Waveform w={900} h={120} color="#c85a26" bars={36} style={{ opacity: 0.4 }} />
      </div>
      {/* bottom half - "after" */}
      <div style={{ position: "absolute", top: 980, left: 60, right: 60, height: 760,
        background: "var(--clay-500)", borderRadius: 36, padding: 56, color: "#faf5ec",
        display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 32,
            letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.78 }}>
            Week 6
          </div>
          <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 120,
            marginTop: 32, lineHeight: 1, letterSpacing: "-0.025em" }}>
            ụmụ ákà
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 28, marginTop: 20, opacity: 0.92 }}>
            "Children." Grandma understood.
          </div>
        </div>
        <Waveform w={900} h={120} color="#faf5ec" bars={36} />
      </div>
    </Canvas>
  );
}

// 6C. Family connection card — IG portrait 4:5 (1080×1350)
function Diaspora_C() {
  return (
    <Canvas w={1080} h={1350} scale={1/3.2} style={{ background: "var(--marigold-100)" }}>
      <ArcsMotif size={420} color="#b88214" opacity={0.18} style={{ position: "absolute", top: 80, right: -100 }} />
      <div style={{ position: "absolute", top: 80, left: 80, fontFamily: "DM Sans", fontWeight: 600, fontSize: 22,
        letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--marigold-700)" }}>
        Why we learn · 03
      </div>
      <div style={{ position: "absolute", top: 200, left: 80, right: 80,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 96, lineHeight: 0.98,
        letterSpacing: "-0.025em", color: "var(--ink-900)" }}>
        So my dad's<br/>mother knows<br/>I tried.
      </div>
      {/* mid: photo strip */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 720, height: 320,
        borderRadius: 24, overflow: "hidden" }}>
        <PhotoField tone="clay" w={920} h={320} label="Three generations · Lagos · 2024" />
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 100 }}>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 32, lineHeight: 1.35, color: "var(--ink-700)" }}>
          — Tobi M., London. Started learning the week before his first visit home.
        </div>
        <div style={{ marginTop: 28 }}><BrandLockup size={28} /></div>
      </div>
    </Canvas>
  );
}

Object.assign(window, {
  Hometown_A, Hometown_B, Hometown_C,
  Behind_A, Behind_B, Behind_C,
  Diaspora_A, Diaspora_B, Diaspora_C,
});
