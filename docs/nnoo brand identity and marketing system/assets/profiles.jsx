// =========================================================
// Nnọọ Social Brand Playbook — profile mockups per platform
// IG · TikTok · YouTube · X · LinkedIn · Facebook
// =========================================================

const NNOO_AVATAR = (size = 64) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", overflow: "hidden",
    background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0
  }}>
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 80 80">
      <path d="M22 32 Q40 14 58 32" stroke="#faf5ec" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M22 48 Q40 66 58 48" stroke="#faf5ec" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="40" r="4.5" fill="#faf5ec" />
    </svg>
  </div>
);

// ----- Instagram profile (mobile)
function ProfileInstagram() {
  const posts = [
    { kind: "proverb", bg: "var(--bone)" },
    { kind: "word", bg: "var(--marigold-100)" },
    { kind: "elder-photo", bg: "var(--clay-500)" },
    { kind: "hometown", bg: "var(--plum-500)" },
    { kind: "field-notes", bg: "var(--cream)" },
    { kind: "elder-quote", bg: "var(--cream)" },
    { kind: "proverb", bg: "var(--clay-500)" },
    { kind: "milestone", bg: "var(--forest-500)" },
    { kind: "cta", bg: "var(--brand)" },
  ];
  return (
    <div className="profile-mock" style={{ width: 360, fontFamily: "system-ui" }}>
      <div className="profile-mock__chrome">
        <span /><span /><span />
        <div className="url">instagram.com/nnoo</div>
      </div>
      <div style={{ background: "#fff", padding: "16px 16px 0" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            padding: 2, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--clay-500), var(--marigold-400))"
          }}>
            {NNOO_AVATAR(72)}
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            {[["1.2K","posts"], ["48K","followers"], ["6","following"]].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 16, color: "var(--ink-900)" }}>{s[0]}</div>
                <div style={{ fontFamily: "DM Sans", fontSize: 11, color: "var(--fg-muted)" }}>{s[1]}</div>
              </div>
            ))}
          </div>
        </div>
        {/* bio */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14, color: "var(--ink-900)" }}>Nnọọ</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "var(--fg-subtle)", marginTop: 2 }}>Education · Nonprofit</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--ink-900)", lineHeight: 1.45, marginTop: 8 }}>
            Welcome home. Learn Igbo from the people who speak it.<br />
            <span style={{ color: "var(--fg-subtle)" }}>A living archive of Ndị Igbo · recorded with elders, shared with the diaspora.</span><br />
            <span style={{ color: "var(--brand)" }}>nnoo.app/get</span>
          </div>
        </div>
        {/* story highlights */}
        <div style={{ display: "flex", gap: 14, marginTop: 16, overflow: "hidden" }}>
          {["Ilu", "Elders", "Hometowns", "Behind", "Learn"].map(h => (
            <div key={h} style={{ textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "1.5px solid var(--ink-100)",
                background: "var(--cream)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "var(--brand)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#faf5ec", fontFamily: "Outfit", fontSize: 11, fontWeight: 700
                }}>{h.slice(0,1)}</div>
              </div>
              <div style={{ fontFamily: "DM Sans", fontSize: 10, color: "var(--ink-900)", marginTop: 4 }}>{h}</div>
            </div>
          ))}
        </div>
        {/* tabs */}
        <div style={{ display: "flex", marginTop: 16, borderTop: "1px solid var(--ink-100)" }}>
          {["Grid","Reels","Tagged"].map((t, i) => (
            <div key={t} style={{
              flex: 1, padding: "10px 0", textAlign: "center",
              borderBottom: i === 0 ? "2px solid var(--ink-900)" : "none",
              fontFamily: "DM Sans", fontSize: 11, fontWeight: 600,
              color: i === 0 ? "var(--ink-900)" : "var(--fg-subtle)",
              letterSpacing: "0.08em", textTransform: "uppercase"
            }}>{t}</div>
          ))}
        </div>
      </div>
      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        {posts.map((p, i) => (
          <div key={i} style={{ aspectRatio: "1", background: p.bg, position: "relative", overflow: "hidden" }}>
            {p.kind === "proverb" && (
              <div style={{ padding: 12, fontFamily: "Outfit", fontWeight: 700, fontSize: 16, lineHeight: 1.05, color: p.bg === "var(--clay-500)" ? "#faf5ec" : "var(--ink-900)" }}>
                Onye<br/>aghụghọ
              </div>
            )}
            {p.kind === "word" && (
              <div style={{ padding: 12 }}>
                <div style={{ fontFamily: "DM Sans", fontSize: 8, color: "var(--marigold-700)", letterSpacing: "0.12em", textTransform: "uppercase" }}>okwu</div>
                <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 28, color: "var(--ink-900)", marginTop: 18, letterSpacing: "-0.02em" }}>ụbọchị</div>
              </div>
            )}
            {p.kind === "elder-photo" && (
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 80% at 30% 30%, #c85a26 0%, #5f2811 70%)" }} />
                <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, color: "#faf5ec", fontFamily: "Fraunces", fontSize: 14, fontWeight: 500 }}>Mama Adaeze</div>
              </div>
            )}
            {p.kind === "hometown" && (
              <div style={{ padding: 10, color: "#faf5ec", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "DM Sans", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.8 }}>Hometown</div>
                <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Nnewi<br/>+14</div>
              </div>
            )}
            {p.kind === "field-notes" && (
              <div style={{ padding: 10, fontFamily: "Fraunces", fontStyle: "italic", fontSize: 11, color: "var(--ink-900)", lineHeight: 1.4 }}>
                Day three. Sat with Papa Ikenna...
              </div>
            )}
            {p.kind === "elder-quote" && (
              <div style={{ padding: 10, fontFamily: "Fraunces", fontStyle: "italic", fontSize: 12, color: "var(--ink-900)", lineHeight: 1.3 }}>
                "We did not say goodbye…"
              </div>
            )}
            {p.kind === "milestone" && (
              <div style={{ padding: 10, color: "#faf5ec", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 38, letterSpacing: "-0.03em" }}>1K</div>
              </div>
            )}
            {p.kind === "cta" && (
              <div style={{ padding: 10, color: "#faf5ec", height: "100%", display: "flex", alignItems: "center" }}>
                <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14, lineHeight: 1.05 }}>Welcome<br/>home.</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- TikTok profile (mobile)
function ProfileTikTok() {
  return (
    <div className="profile-mock" style={{ width: 320 }}>
      <div className="profile-mock__chrome">
        <span /><span /><span />
        <div className="url">tiktok.com/@nnoo</div>
      </div>
      <div style={{ background: "#000", color: "#fff", padding: 20, textAlign: "center" }}>
        {NNOO_AVATAR(72)}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div style={{ width: 72, height: 72 }} />
        </div>
        <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 17, marginTop: -64 }}>@nnoo</div>
        <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Nnọọ · Igbo, kept alive</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 12, fontSize: 12 }}>
          {[["18","Following"], ["32.4K","Followers"], ["412K","Likes"]].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 15 }}>{s[0]}</div>
              <div style={{ fontFamily: "DM Sans", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{s[1]}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
          <div style={{ padding: "8px 24px", background: "#c85a26", color: "#fff", borderRadius: 4, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>Follow</div>
          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.12)", borderRadius: 4, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>↗</div>
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 12, marginTop: 14, lineHeight: 1.5, textAlign: "left" }}>
          A living archive of Ndị Igbo, kept by elders.<br/>
          One word, one proverb, one story per day.<br/>
          <span style={{ color: "#eebb3a" }}>📍 nnoo.app/learn</span>
        </div>
      </div>
      {/* tabs */}
      <div style={{ background: "#000", display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {["Videos", "Reposts", "Liked"].map((t, i) => (
          <div key={t} style={{
            flex: 1, padding: "10px 0", textAlign: "center",
            borderBottom: i === 0 ? "2px solid #fff" : "none",
            fontFamily: "DM Sans", fontSize: 12, fontWeight: 600, color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)"
          }}>{t}</div>
        ))}
      </div>
      {/* video grid */}
      <div style={{ background: "#000", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
        {[
          { bg: "var(--clay-500)", title: "ụbọchị", views: "342K" },
          { bg: "var(--ink-900)", title: "Mama Adaeze", views: "128K" },
          { bg: "var(--forest-500)", title: "Tones, 8 of them", views: "92K" },
          { bg: "var(--marigold-400)", title: "okwu #128", views: "78K" },
          { bg: "var(--plum-500)", title: "Nnewi market", views: "54K" },
          { bg: "var(--clay-700)", title: "kola nut", views: "41K" },
        ].map((v, i) => (
          <div key={i} style={{ aspectRatio: "9/16", background: v.bg, padding: 8, position: "relative", display: "flex", alignItems: "flex-end" }}>
            <div style={{ color: "#fff", fontFamily: "Outfit", fontWeight: 600, fontSize: 9 }}>
              {v.title}<br/><span style={{ fontFamily: "DM Sans", fontSize: 8, opacity: 0.7 }}>▶ {v.views}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- YouTube channel (desktop-ish)
function ProfileYouTube() {
  return (
    <div className="profile-mock" style={{ width: 720 }}>
      <div className="profile-mock__chrome">
        <span /><span /><span />
        <div className="url">youtube.com/@nnoo</div>
      </div>
      {/* banner */}
      <div style={{ height: 120, background: "linear-gradient(135deg, var(--clay-500), var(--clay-700) 70%, var(--ink-900))",
        position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", top: -40, right: -40, opacity: 0.18 }} width="280" height="280" viewBox="0 0 80 80">
          <path d="M10 32 Q40 -4 70 32" stroke="#faf5ec" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M10 48 Q40 84 70 48" stroke="#faf5ec" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="40" r="2.5" fill="#faf5ec" />
        </svg>
        <div style={{ position: "absolute", left: 32, top: 32, color: "#faf5ec" }}>
          <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 16, color: "var(--marigold-200)" }}>Nnọọ —</div>
          <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 40, marginTop: 4, lineHeight: 1, letterSpacing: "-0.02em" }}>Welcome home.</div>
        </div>
      </div>
      {/* channel header */}
      <div style={{ padding: 24, display: "flex", gap: 20, background: "#fff", alignItems: "flex-start" }}>
        {NNOO_AVATAR(96)}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 24, color: "var(--ink-900)" }}>Nnọọ</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--fg-subtle)", marginTop: 4 }}>@nnoo · 12.4K subscribers · 84 videos</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--ink-900)", marginTop: 8, lineHeight: 1.5, maxWidth: 480 }}>
            Welcome home. We record elders, we teach the next generation, and we put both of those things back in your hand.<br/>
            <span style={{ color: "var(--brand)" }}>nnoo.app</span> and 2 more links
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ padding: "8px 18px", background: "var(--ink-900)", color: "#fff", borderRadius: 999, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>Subscribe</div>
            <div style={{ padding: "8px 14px", background: "var(--cream)", color: "var(--ink-900)", borderRadius: 999, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13, border: "1px solid var(--border)" }}>Join</div>
          </div>
        </div>
      </div>
      {/* tabs */}
      <div style={{ background: "#fff", display: "flex", borderTop: "1px solid var(--ink-100)", borderBottom: "1px solid var(--ink-100)", padding: "0 24px" }}>
        {["Home", "Videos", "Shorts", "Playlists", "Community", "About"].map((t, i) => (
          <div key={t} style={{
            padding: "12px 18px",
            borderBottom: i === 0 ? "2px solid var(--ink-900)" : "none",
            fontFamily: "DM Sans", fontWeight: 600, fontSize: 13,
            color: i === 0 ? "var(--ink-900)" : "var(--fg-muted)"
          }}>{t}</div>
        ))}
      </div>
      {/* video row */}
      <div style={{ background: "#fff", padding: 24 }}>
        <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 14, color: "var(--ink-900)", marginBottom: 12 }}>Elders · 12 episodes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { title: "The day I named my son.", who: "Mama Adaeze · 14:22", bg: "var(--clay-500)" },
            { title: "The eight tones of one syllable.", who: "Dr. Ngozi Eze · 14:22", bg: "var(--marigold-400)" },
            { title: "Recording at the kola-nut table.", who: "Field notes · 8:12", bg: "var(--forest-500)" },
          ].map((v, i) => (
            <div key={i}>
              <div style={{ aspectRatio: "16/9", background: v.bg, borderRadius: 8, position: "relative", overflow: "hidden", padding: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14, color: "#faf5ec", lineHeight: 1.1 }}>{v.title}</div>
              </div>
              <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "var(--fg-muted)", marginTop: 6, lineHeight: 1.4 }}>{v.who}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- X / Twitter profile
function ProfileX() {
  return (
    <div className="profile-mock" style={{ width: 540 }}>
      <div className="profile-mock__chrome">
        <span /><span /><span />
        <div className="url">x.com/nnoo</div>
      </div>
      <div style={{ background: "#fff" }}>
        {/* banner */}
        <div style={{ height: 120, background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0,
            background: "radial-gradient(800px 300px at 30% 100%, var(--clay-100) 0%, transparent 60%), radial-gradient(600px 300px at 90% 0%, var(--marigold-100) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", left: 24, top: 22, fontFamily: "Fraunces", fontStyle: "italic", fontSize: 22, color: "var(--ink-700)" }}>
            Welcome home.
          </div>
        </div>
        {/* avatar */}
        <div style={{ padding: "0 20px", position: "relative" }}>
          <div style={{ marginTop: -40, padding: 3, borderRadius: "50%", background: "#fff", display: "inline-block" }}>
            {NNOO_AVATAR(72)}
          </div>
          <div style={{ position: "absolute", right: 20, top: 12, padding: "6px 14px",
            border: "1px solid var(--ink-300)", borderRadius: 999, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>
            Follow
          </div>
        </div>
        <div style={{ padding: "8px 20px 16px" }}>
          <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 18, color: "var(--ink-900)" }}>Nnọọ</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--fg-subtle)" }}>@nnoo</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--ink-900)", marginTop: 8, lineHeight: 1.45 }}>
            A living archive of Ndị Igbo — recorded with elders, shared with the diaspora. Daily proverb, weekly elder.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontFamily: "DM Sans", fontSize: 12, color: "var(--fg-subtle)" }}>
            <span>🌍 nnoo.app</span><span>📍 Lagos · London · Atlanta</span><span>Joined Apr 2026</span>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 8, fontFamily: "DM Sans", fontSize: 12, color: "var(--fg-subtle)" }}>
            <span><b style={{ color: "var(--ink-900)" }}>142</b> Following</span>
            <span><b style={{ color: "var(--ink-900)" }}>8.4K</b> Followers</span>
          </div>
        </div>
        {/* pinned tweet */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--ink-100)" }}>
          <div style={{ fontFamily: "DM Sans", fontSize: 11, color: "var(--fg-subtle)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>📌 Pinned</div>
          <div className="igbo" style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 16, color: "var(--ink-900)", marginTop: 8, lineHeight: 1.4 }}>
            We are starting with one promise: every recording we keep, we keep with the elder's name and the elder's permission. No exceptions.
          </div>
          <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "var(--cream)",
            border: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 14, color: "var(--ink-900)" }}>
              "Egbe bere, ugo bere — let the kite perch, let the eagle perch."
            </div>
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: "var(--fg-subtle)", marginTop: 6 }}>Papa Chukwuma · Awka · 0:42</div>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 10, fontFamily: "DM Sans", fontSize: 11, color: "var(--fg-subtle)" }}>
            <span>💬 84</span><span>🔁 1.2K</span><span>♡ 6.1K</span><span>👁 84K</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- LinkedIn page
function ProfileLinkedIn() {
  return (
    <div className="profile-mock" style={{ width: 720 }}>
      <div className="profile-mock__chrome">
        <span /><span /><span />
        <div className="url">linkedin.com/company/nnoo</div>
      </div>
      <div style={{ background: "#fff" }}>
        {/* banner */}
        <div style={{ height: 130, background: "var(--clay-500)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0,
            background: "radial-gradient(700px 400px at 0% 100%, rgba(0,0,0,0.25) 0%, transparent 60%)" }} />
          <svg style={{ position: "absolute", top: -40, right: -40, opacity: 0.12 }} width="280" height="280" viewBox="0 0 80 80">
            <path d="M10 32 Q40 -4 70 32" stroke="#faf5ec" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M10 48 Q40 84 70 48" stroke="#faf5ec" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="40" r="2.5" fill="#faf5ec" />
          </svg>
          <div style={{ position: "absolute", left: 28, top: 26, color: "#faf5ec" }}>
            <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: 18, color: "var(--marigold-200)" }}>
              "Two hands, one body."
            </div>
            <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 32, marginTop: 6, letterSpacing: "-0.02em" }}>A living archive of Ndị Igbo.</div>
          </div>
        </div>
        {/* header */}
        <div style={{ padding: "0 24px 24px", position: "relative" }}>
          <div style={{ marginTop: -32, padding: 4, borderRadius: 16, background: "#fff", display: "inline-block" }}>
            <div style={{ width: 80, height: 80, borderRadius: 14, background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="56" height="56" viewBox="0 0 80 80">
                <path d="M22 32 Q40 14 58 32" stroke="#faf5ec" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M22 48 Q40 66 58 48" stroke="#faf5ec" strokeWidth="5" strokeLinecap="round" fill="none" />
                <circle cx="40" cy="40" r="4.5" fill="#faf5ec" />
              </svg>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 22, color: "var(--ink-900)" }}>Nnọọ</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 14, color: "var(--ink-900)", marginTop: 6, lineHeight: 1.45, maxWidth: 540 }}>
              Voice-first preservation of the Igbo language and living culture — recorded with elders, taught to the diaspora.
            </div>
            <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "var(--fg-subtle)", marginTop: 8 }}>
              Education · Nonprofit · 11–50 employees · Lagos, Nigeria · 4,210 followers
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <div style={{ padding: "7px 18px", background: "var(--ink-900)", color: "#fff", borderRadius: 999, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>+ Follow</div>
            <div style={{ padding: "7px 18px", border: "1px solid var(--ink-300)", borderRadius: 999, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>Visit website ↗</div>
            <div style={{ padding: "7px 14px", border: "1px solid var(--ink-300)", borderRadius: 999, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>···</div>
          </div>
        </div>
        {/* About strip */}
        <div style={{ padding: 24, borderTop: "1px solid var(--ink-100)" }}>
          <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 14, color: "var(--ink-900)" }}>About</div>
          <div style={{ fontFamily: "DM Sans", fontSize: 13, color: "var(--ink-900)", marginTop: 8, lineHeight: 1.6 }}>
            We sit with elders and we record them — properly, with their permission, with their names attached, with their dialects credited.
            Then we put those recordings in front of the diaspora children who have only ever heard the language in greetings.
            <span style={{ color: "var(--fg-subtle)" }}> We are hiring facilitators across Anambra, Imo, Enugu, Abia, and Ebonyi.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Facebook page (placeholder tier — minimal but on-brand)
function ProfileFacebook() {
  return (
    <div className="profile-mock" style={{ width: 540 }}>
      <div className="profile-mock__chrome">
        <span /><span /><span />
        <div className="url">facebook.com/nnoo</div>
      </div>
      <div style={{ background: "#fff" }}>
        <div style={{ height: 130, position: "relative",
          background: "linear-gradient(135deg, var(--clay-500) 0%, var(--clay-700) 100%)" }}>
          <div style={{ position: "absolute", left: 24, bottom: 16, color: "#faf5ec", fontFamily: "Fraunces", fontStyle: "italic", fontSize: 18 }}>
            Welcome home.
          </div>
        </div>
        <div style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-end", marginTop: -30 }}>
          <div style={{ padding: 4, borderRadius: "50%", background: "#fff" }}>{NNOO_AVATAR(72)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 18, color: "var(--ink-900)" }}>Nnọọ</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "var(--fg-subtle)" }}>Nonprofit organization · 1.2K followers</div>
          </div>
        </div>
        <div style={{ padding: "8px 16px 16px", fontFamily: "DM Sans", fontSize: 13, color: "var(--ink-900)", lineHeight: 1.5 }}>
          Learn Igbo from the people who speak it.<br/>
          <span style={{ color: "var(--fg-subtle)" }}>This page is updated weekly. For daily, find us on Instagram or TikTok.</span><br/>
          <span style={{ color: "var(--brand)" }}>nnoo.app</span>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
          <div style={{ flex: 1, padding: "8px 0", background: "var(--ink-900)", color: "#fff", textAlign: "center", borderRadius: 6, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>Follow</div>
          <div style={{ flex: 1, padding: "8px 0", background: "var(--cream)", border: "1px solid var(--border)", textAlign: "center", borderRadius: 6, fontFamily: "DM Sans", fontWeight: 600, fontSize: 13 }}>Message</div>
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--ink-100)", background: "var(--bg-raised)" }}>
          <div style={{ fontFamily: "DM Sans", fontSize: 11, color: "var(--fg-subtle)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
            About
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "var(--ink-900)", lineHeight: 1.5, marginTop: 4 }}>
            We preserve and we teach. Two hands, one body.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ProfileInstagram, ProfileTikTok, ProfileYouTube,
  ProfileX, ProfileLinkedIn, ProfileFacebook,
});
