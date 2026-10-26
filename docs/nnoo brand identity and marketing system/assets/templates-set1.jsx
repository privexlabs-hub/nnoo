// =========================================================
// Nnọọ Social Brand Playbook — pillar 1-3 templates
// Daily proverb · Word of the day · Elder spotlight
// All templates use REAL pixel sizes; scale handled by Canvas.
// =========================================================

// ======================================================
// PILLAR 1 — DAILY PROVERB (ilu)
// ======================================================

// 1A. Bold typographic — Instagram square (1080×1080)
function Proverb_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--bone)" }}>
      {/* paper texture */}
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(58,24,9,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px" }} />
      {/* eyebrow */}
      <div style={{ position: "absolute", top: 72, left: 72, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--brand)" }} />
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brand)" }}>
          Ilu · proverb of the day
        </div>
      </div>
      {/* main proverb */}
      <div style={{ position: "absolute", top: 220, left: 72, right: 72 }}>
        <div className="igbo" style={{
          fontFamily: "Outfit", fontWeight: 700, fontSize: 96, lineHeight: 1.04,
          letterSpacing: "-0.02em", color: "var(--ink-900)"
        }}>
          Onye aghụghọ<br/>na-ebi n'ọhịa.
        </div>
        {/* divider */}
        <div style={{ width: 96, height: 3, background: "var(--brand)", margin: "56px 0 32px", borderRadius: 999 }} />
        {/* translation */}
        <div style={{
          fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: 44, lineHeight: 1.3,
          color: "var(--ink-700)"
        }}>
          "The cunning one lives in the bush."
        </div>
        {/* gloss */}
        <div style={{ fontFamily: "DM Sans", fontSize: 28, color: "var(--fg-subtle)", marginTop: 32, lineHeight: 1.5, maxWidth: 760 }}>
          On deceit: the one who cannot live straight among others ends up alone.
        </div>
      </div>
      {/* footer band */}
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 64, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={36} />
        <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--fg-subtle)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Umudioka dialect · Anambra
        </div>
      </div>
    </Canvas>
  );
}

// 1B. Two-step poster — Instagram portrait 4:5 (1080×1350)
function Proverb_B() {
  return (
    <Canvas w={1080} h={1350} scale={1/3} style={{ background: "var(--clay-500)", color: "var(--fg-on-clay)" }}>
      <ArcsMotif size={520} color="#faf5ec" opacity={0.12} style={{ position: "absolute", top: -120, right: -120 }} />
      <ArcsMotif size={360} color="#faf5ec" opacity={0.10} style={{ position: "absolute", bottom: -80, left: -80, transform: "rotate(180deg)" }} />
      {/* eyebrow */}
      <div style={{ position: "absolute", top: 80, left: 80, fontFamily: "DM Sans", fontWeight: 600, fontSize: 22,
        letterSpacing: "0.18em", textTransform: "uppercase", color: "#faf5ec", opacity: 0.85 }}>
        Ilu — proverb 042 · Tuesday
      </div>
      {/* big Igbo */}
      <div className="igbo" style={{ position: "absolute", top: 200, left: 80, right: 80,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 124, lineHeight: 1.02,
        letterSpacing: "-0.025em", color: "#faf5ec"
      }}>
        Otu<br/>onye<br/>anaghị<br/>arị enu.
      </div>
      {/* lower zone — cream card */}
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 80,
        background: "var(--cream)", color: "var(--ink-900)",
        borderRadius: 32, padding: "44px 48px"
      }}>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 38, lineHeight: 1.3, color: "var(--ink-900)" }}>
          "One person does not climb up alone."
        </div>
        <div style={{ height: 1, background: "var(--ink-100)", margin: "28px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BrandLockup size={32} />
          <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--fg-subtle)" }}>
            From elder Nkechi Eze · Owerri
          </div>
        </div>
      </div>
    </Canvas>
  );
}

// 1C. Audio quote card — X/LinkedIn (1200×675)
function Proverb_C() {
  return (
    <Canvas w={1200} h={675} scale={0.4} style={{ background: "var(--cream)" }}>
      {/* left: forest-themed archive strip */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: "var(--forest-500)" }} />
      {/* eyebrow */}
      <div style={{ position: "absolute", top: 56, left: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ padding: "6px 14px", borderRadius: 999, background: "var(--forest-100)", color: "var(--forest-700)",
          fontFamily: "DM Sans", fontWeight: 600, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Ọbá · Archive
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 18, color: "var(--fg-subtle)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          0:42 audio
        </div>
      </div>
      {/* proverb */}
      <div style={{ position: "absolute", top: 130, left: 64, right: 480,
        fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 500, fontSize: 52,
        lineHeight: 1.18, color: "var(--ink-900)"
      }}>
        "Egbe bere, ugo bere — let the kite perch, let the eagle perch."
      </div>
      {/* attribution */}
      <div style={{ position: "absolute", left: 64, bottom: 130, fontFamily: "DM Sans", fontSize: 22, color: "var(--fg-muted)" }}>
        Elder Chukwuma Okoli · b. 1947 · Awka
      </div>
      {/* waveform */}
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 56,
        display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--forest-500)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#faf5ec", fontSize: 26 }}>▶</div>
        <Waveform w={680} h={56} color="var(--forest-500)" bars={56} />
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 20, color: "var(--fg-muted)" }}>0:42</div>
      </div>
      {/* logo */}
      <div style={{ position: "absolute", top: 64, right: 64 }}>
        <BrandLockup size={36} />
      </div>
    </Canvas>
  );
}

// ======================================================
// PILLAR 2 — WORD OF THE DAY
// ======================================================

// 2A. Hero word — Instagram square (1080×1080)
function Word_A() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{
      background: "var(--marigold-100)"
    }}>
      <ArcsMotif size={600} color="#b88214" opacity={0.16} style={{ position: "absolute", bottom: -140, right: -180 }} />
      {/* eyebrow */}
      <div style={{ position: "absolute", top: 72, left: 72, fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--marigold-700)" }}>
        Okwu · word of the day · #128
      </div>
      {/* the word, with tone marks called out */}
      <div className="igbo" style={{ position: "absolute", top: 280, left: 72, right: 72 }}>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 240, lineHeight: 0.95, letterSpacing: "-0.03em", color: "var(--ink-900)" }}>
          ụbọchị
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 36, color: "var(--ink-700)", marginTop: 24 }}>
          /ù.bó.chì/ — high · low · high
        </div>
      </div>
      {/* meaning */}
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 200 }}>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 56, lineHeight: 1.15, color: "var(--ink-900)" }}>
          day
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 26, lineHeight: 1.5, color: "var(--ink-700)", marginTop: 16, maxWidth: 760 }}>
          Often used in greetings and time. "Ụbọchị ọma" — a good day to you.
        </div>
      </div>
      {/* footer w/ audio cue */}
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 64,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={32} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 20px",
          background: "var(--ink-900)", color: "var(--bone)", borderRadius: 999,
          fontFamily: "DM Sans", fontWeight: 600, fontSize: 22 }}>
          <span style={{ fontSize: 16 }}>▶</span> Hear it
        </div>
      </div>
    </Canvas>
  );
}

// 2B. Vertical story format — Instagram story (1080×1920)
function Word_B() {
  return (
    <Canvas w={1080} h={1920} scale={1/5} style={{
      background: "linear-gradient(180deg, var(--clay-500) 0%, var(--clay-700) 100%)"
    }}>
      <ArcsMotif size={680} color="#faf5ec" opacity={0.10} style={{ position: "absolute", top: 240, right: -180 }} />
      <div style={{ position: "absolute", top: 220, left: 60, right: 60, color: "#faf5ec",
        fontFamily: "DM Sans", fontWeight: 600, fontSize: 32, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.85 }}>
        How is this said?
      </div>
      <div className="igbo" style={{ position: "absolute", top: 340, left: 60, right: 60,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 220, lineHeight: 0.96,
        letterSpacing: "-0.03em", color: "#faf5ec"
      }}>
        nnà<br/>m<br/>ọma
      </div>
      {/* options stack */}
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 480, display: "flex", flexDirection: "column", gap: 28 }}>
        {[
          { label: "/n.nà.m ó.má/", state: "default" },
          { label: "/n.ná.m ó.má/", state: "selected" },
          { label: "/n.nà.m ò.mà/", state: "default" },
        ].map((it, i) => (
          <div key={i} style={{
            padding: "26px 32px",
            background: it.state === "selected" ? "#faf5ec" : "rgba(250,245,236,0.16)",
            color: it.state === "selected" ? "var(--ink-900)" : "#faf5ec",
            borderRadius: 24,
            fontFamily: "DM Sans", fontWeight: 600, fontSize: 40,
            border: it.state === "selected" ? "none" : "2px solid rgba(250,245,236,0.35)"
          }}>{it.label}</div>
        ))}
      </div>
      {/* swipe up CTA */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 240, textAlign: "center", color: "#faf5ec" }}>
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 28, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>
          Tap to hear · swipe up to learn
        </div>
      </div>
    </Canvas>
  );
}

// 2C. Sentence card — X/LinkedIn (1200×675)
function Word_C() {
  return (
    <Canvas w={1200} h={675} scale={0.4} style={{ background: "var(--bone)" }}>
      <div style={{ position: "absolute", top: 56, left: 64, fontFamily: "DM Sans", fontWeight: 600, fontSize: 18,
        letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brand)" }}>
        Okwu · word
      </div>
      <div className="igbo" style={{ position: "absolute", top: 100, left: 64,
        fontFamily: "Outfit", fontWeight: 700, fontSize: 156, lineHeight: 1, letterSpacing: "-0.025em", color: "var(--ink-900)" }}>
        ọmụmụ
      </div>
      <div style={{ position: "absolute", top: 290, left: 64, fontFamily: "DM Sans", fontSize: 26, color: "var(--fg-muted)" }}>
        /ọ.mụ.mụ/ · noun · learning, study
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: 380,
        padding: "32px 36px", background: "var(--paper)", borderRadius: 18, border: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-subtle)" }}>
          In a sentence
        </div>
        <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 36, color: "var(--ink-900)", marginTop: 14 }}>
          Ọmụmụ asụsụ na-ewu obi.
        </div>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 24, color: "var(--ink-700)", marginTop: 10 }}>
          "Learning a language builds the heart."
        </div>
      </div>
      <div style={{ position: "absolute", top: 64, right: 64 }}><BrandLockup size={32} /></div>
    </Canvas>
  );
}

// ======================================================
// PILLAR 3 — ELDER SPOTLIGHT
// ======================================================

// 3A. Portrait poster — Instagram portrait (1080×1350)
function Elder_A() {
  return (
    <Canvas w={1080} h={1350} scale={1/3.2} style={{ background: "var(--ink-900)" }}>
      <PhotoField tone="clay" w={1080} h={1350} />
      {/* darken bottom for text */}
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(180deg, transparent 35%, rgba(26,18,11,0.85) 75%, rgba(26,18,11,0.95) 100%)" }} />
      {/* corner tag */}
      <div style={{ position: "absolute", top: 64, left: 64, padding: "8px 18px",
        background: "rgba(46,93,58,0.92)", color: "#faf5ec",
        fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase",
        borderRadius: 999 }}>
        Ọbá · Archive
      </div>
      {/* lower block */}
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 80, color: "var(--bone)" }}>
        <div style={{ fontFamily: "DM Sans", fontWeight: 600, fontSize: 22, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--marigold-300)" }}>
          Elder Spotlight
        </div>
        <div style={{ fontFamily: "Fraunces", fontWeight: 500, fontSize: 88, lineHeight: 1, letterSpacing: "-0.02em", marginTop: 18 }}>
          Mama Adaeze
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 26, color: "var(--clay-100)", marginTop: 16, lineHeight: 1.5 }}>
          b. 1942 · Nri, Anambra · 14 recordings<br/>Speaks the old form of Nri dialect.
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40 }}>
          <BrandLockup size={28} color="#faf5ec" reversed />
          <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--clay-100)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Listen on Ọbá
          </div>
        </div>
      </div>
    </Canvas>
  );
}

// 3B. Elder quote card — Instagram square (1080×1080) — serif-led
function Elder_B() {
  return (
    <Canvas w={1080} h={1080} scale={1/3} style={{ background: "var(--cream)" }}>
      {/* provenance strip */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: "var(--forest-500)" }} />
      <div style={{ position: "absolute", top: 80, left: 80, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--forest-500)" }}>
          <PhotoField tone="marigold" w={64} h={64} />
        </div>
        <div>
          <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 26, color: "var(--ink-900)" }}>Papa Emeka Nwosu</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 18, color: "var(--fg-subtle)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            b. 1939 · Nnewi · Igbo-Ukwu dialect
          </div>
        </div>
      </div>
      {/* big quote */}
      <div style={{ position: "absolute", top: 260, left: 80, right: 80 }}>
        <div style={{ fontFamily: "Fraunces", fontWeight: 400, fontStyle: "italic", fontSize: 64, lineHeight: 1.18, color: "var(--ink-900)" }}>
          "When I was a boy, we did not say goodbye when we walked through a compound — we said <span style={{ fontStyle: "normal", fontWeight: 500, color: "var(--brand)" }}>ka anyị fọrọ</span>: <span style={{ fontStyle: "italic", fontWeight: 400 }}>we are still here together.</span>"
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 80,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLockup size={28} />
        <div style={{ fontFamily: "DM Sans", fontSize: 20, color: "var(--forest-700)", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Recording · 2:14 · 2026.04
        </div>
      </div>
    </Canvas>
  );
}

// 3C. YouTube thumbnail (1280×720)
function Elder_C() {
  return (
    <Canvas w={1280} h={720} scale={0.38} style={{ background: "var(--ink-900)" }}>
      {/* portrait on left half */}
      <div style={{ position: "absolute", inset: 0, width: "55%" }}>
        <PhotoField tone="clay" w={704} h={720} />
      </div>
      {/* gradient overlay onto right side */}
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(90deg, transparent 40%, var(--ink-900) 70%)" }} />
      {/* right text */}
      <div style={{ position: "absolute", top: 80, right: 64, left: "55%", paddingLeft: 64 }}>
        <div style={{ display: "inline-block", padding: "8px 18px", borderRadius: 999,
          background: "var(--marigold-400)", color: "var(--ink-900)",
          fontFamily: "DM Sans", fontWeight: 700, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Elders · Ep. 04
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 88, lineHeight: 1, color: "#faf5ec", marginTop: 32, letterSpacing: "-0.025em" }}>
          The day<br/>I named<br/>my son.
        </div>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 28, color: "var(--clay-100)", marginTop: 32 }}>
          With Mama Adaeze · Nri, Anambra
        </div>
      </div>
      {/* corner brand */}
      <div style={{ position: "absolute", bottom: 40, right: 48 }}>
        <BrandLockup size={36} color="#c85a26" reversed={false} />
      </div>
    </Canvas>
  );
}

Object.assign(window, {
  Proverb_A, Proverb_B, Proverb_C,
  Word_A, Word_B, Word_C,
  Elder_A, Elder_B, Elder_C,
});
