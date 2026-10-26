// Nnọọ — top-level app shell. Chooser landing + iOS/Android phones + facilitator tablet + marketing.

// FitScaler: scales a fixed-size design to fit the available width AND reserves the right height
// so the scaled layout box matches the visible size (CSS transform alone doesn't affect layout).
function FitScaler({ designWidth, designHeight, maxScale = 1, children }) {
  const outerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth;
      const s = Math.min(maxScale, avail / designWidth);
      setScale(s > 0 ? s : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [designWidth, maxScale]);

  const fittedHeight = designHeight ? designHeight * scale : undefined;

  return (
    <div ref={outerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: designWidth * scale, height: fittedHeight, position: 'relative' }}>
        <div style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PhoneShell({ platform = 'ios', children, screenLabel }) {
  // Android variant is a softer-cornered frame. iOS uses IOSDevice from shared.
  if (platform === 'ios') {
    return (
      <div data-screen-label={screenLabel}>
        <IOSDevice>
          <div style={{ background: NnooTheme.bg, minHeight: '100%', position: 'relative' }}>
            {children}
          </div>
        </IOSDevice>
      </div>
    );
  }
  // Android
  return (
    <div data-screen-label={screenLabel} style={{
      width: 400, height: 868, borderRadius: 40, overflow: 'hidden', position: 'relative',
      background: NnooTheme.bg,
      boxShadow: '0 40px 80px rgba(0,0,0,0.22), 0 0 0 1.5px rgba(0,0,0,0.12)',
      fontFamily: NnooTheme.fontBody,
    }}>
      {/* Android status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 40 }}>
        <span style={{ fontFamily: 'Roboto, -apple-system, system-ui', fontSize: 13, fontWeight: 600, color: NnooTheme.ink900 }}>9:41</span>
        <div style={{ width: 12, height: 12, borderRadius: 999, background: NnooTheme.ink900, opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0" y="6" width="3" height="4" rx="1" fill="#1a120b"/><rect x="4" y="4" width="3" height="6" rx="1" fill="#1a120b"/><rect x="8" y="2" width="3" height="8" rx="1" fill="#1a120b"/><rect x="12" y="0" width="3" height="10" rx="1" fill="#1a120b"/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="#1a120b" fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill="#1a120b"/><rect x="19" y="3" width="2" height="4" rx="0.5" fill="#1a120b"/></svg>
        </div>
      </div>
      <div style={{ height: '100%', paddingTop: 0 }}>{children}</div>
      {/* Android nav pill */}
      <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 60 }}>
        <div style={{ width: 120, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.35)' }} />
      </div>
    </div>
  );
}

// ——— Learner app (shared by iOS and Android shells) ———
function LearnerApp({ platform = 'ios' }) {
  const [screen, setScreen] = React.useState('home');
  const [tab, setTab] = React.useState('home');
  const [showProverb, setShowProverb] = React.useState(false);
  const [recording, setRecording] = React.useState(null);
  const [ikpeCase, setIkpeCase] = React.useState(null);

  const goHome    = () => { setScreen('home'); setTab('home'); };
  const goLesson  = () => setScreen('lesson');
  const goArchive = () => { setScreen('archive'); setTab('oba'); };
  const goIkpe    = () => { setScreen('ikpe'); setTab('ikpe'); };
  const goOha     = () => { setScreen('oha'); setTab('oha'); };
  const goYou     = () => { setScreen('you'); setTab('me'); };

  const openRecording = (r) => { setRecording(r); setScreen('recording'); };
  const openNso = () => setScreen('nso');
  const openCase = (c) => { setIkpeCase(c); setScreen('ikpeCase'); };

  const pendingCount = (window.IKPE_PENDING || []).filter(q => !q.passed).length;

  return (
    <>
      {screen === 'home'     && <HomeScreen onStartLesson={goLesson} onOpenArchive={goArchive} onOpenOha={goOha} onOpenProverb={() => setShowProverb(true)} onOpenIkpe={goIkpe} />}
      {screen === 'lesson'   && <LessonScreen onComplete={goHome} onBack={goHome} />}
      {screen === 'archive'  && <ArchiveScreen onBack={goHome} onOpenRecording={openRecording} onOpenNso={openNso} />}
      {screen === 'recording'&& <RecordingDetail rec={recording} onBack={goArchive} />}
      {screen === 'nso'      && <NsoGate onBack={goArchive} />}
      {screen === 'ikpe'     && <IkpeScreen onBack={goHome} onOpenCase={openCase} />}
      {screen === 'ikpeCase' && <IkpeCaseDetail q={ikpeCase} onBack={goIkpe} />}
      {screen === 'oha'      && <OhaScreen onBack={goHome} />}
      {screen === 'you'      && <YouScreen onBack={goHome} />}

      {screen !== 'lesson' && screen !== 'recording' && screen !== 'nso' && screen !== 'ikpeCase' && (
        <TabBar active={tab} ikpePending={pendingCount} onChange={(t) => {
          setTab(t);
          if (t === 'home') goHome();
          else if (t === 'oba') goArchive();
          else if (t === 'ikpe') goIkpe();
          else if (t === 'oha') goOha();
          else if (t === 'me') goYou();
        }} />
      )}

      {showProverb && <ProverbSheet onClose={() => setShowProverb(false)} />}
    </>
  );
}

// ——— Facilitator tablet (reused, inline) ———
function FacilitatorTablet() {
  const [phase, setPhase] = React.useState('setup');
  return (
    <div data-screen-label="Facilitator tablet" style={{
      padding: 22, background: '#0e0805', borderRadius: 42,
      boxShadow: '0 40px 80px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: 1180, height: 820, background: NnooTheme.bg,
        borderRadius: 28, overflow: 'hidden', display: 'flex',
        fontFamily: NnooTheme.fontBody,
      }}>
        {/* Left rail */}
        <div style={{ width: 320, background: NnooTheme.raised, padding: 24, borderRight: '1px solid #e8dfc9', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="shared/assets/logo-mark.svg" width="36" height="36" />
            <div>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 18, color: NnooTheme.ink900, letterSpacing: '-0.01em' }}>Nnọọ</div>
              <Eyebrow>Facilitator</Eyebrow>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <Eyebrow>Session</Eyebrow>
            <div style={{ marginTop: 10, background: NnooTheme.paper, borderRadius: 14, padding: 14, border: '1px solid #e8dfc9' }}>
              <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 18, color: NnooTheme.ink900 }}>Mama Ada Nwosu</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 3 }}>Nnewi · age 79</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <ConsentBadge tier="oha" />
              </div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 10 }}>Consent captured · Apr 17, 2026</div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Eyebrow>Checklist</Eyebrow>
            {[
              ['Quiet room', true],
              ['Mic level good', true],
              ['Consent recorded', true],
              ['Topic chosen', phase !== 'setup'],
              ['Recording reviewed', phase === 'review' || phase === 'sent'],
              ['Sent to Ikpe', phase === 'sent'],
            ].map(([l, done], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${done ? NnooTheme.forest : NnooTheme.ink100}`, background: done ? NnooTheme.forest : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done && <Icon name="check" size={12} color="#fff" />}
                </div>
                <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: done ? NnooTheme.ink700 : NnooTheme.ink500 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 14, color: NnooTheme.ink700, lineHeight: 1.6 }}>
            "Every recording belongs to the elder and their community. You can always stop. There is no hurry."
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 44, display: 'flex', flexDirection: 'column' }}>
          {phase === 'setup' && (
            <>
              <Eyebrow>Step 2 of 4</Eyebrow>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 40, color: NnooTheme.ink900, letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.05 }}>
                What will Mama Ada share today?
              </div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, color: NnooTheme.ink700, marginTop: 10, maxWidth: 540, lineHeight: 1.55 }}>
                Pick a topic so the recording finds the right learners later. You can add more after.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24, maxWidth: 720 }}>
                {[
                  { t: 'A story', d: 'Folktales, family histories, how it was', hi: true },
                  { t: 'A proverb', d: 'Ilu — and what it teaches' },
                  { t: 'A song', d: 'Lullabies, work songs, ceremony' },
                  { t: 'A recipe', d: 'Ofe, jollof, traditional dishes' },
                  { t: 'A craft', d: 'How to make, grow, build, tap' },
                  { t: 'Place-lore', d: 'About a shrine, river, market' },
                ].map((x, i) => (
                  <button key={i} onClick={() => setPhase('recording')} style={{
                    background: x.hi ? NnooTheme.clay100 : NnooTheme.paper,
                    border: `1.5px solid ${x.hi ? NnooTheme.clay : '#e8dfc9'}`,
                    borderRadius: 16, padding: 18, textAlign: 'left', cursor: 'pointer',
                  }}>
                    <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 18, color: NnooTheme.ink900 }}>{x.t}</div>
                    <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 4, lineHeight: 1.4 }}>{x.d}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                <NnooButton variant="outline">Back</NnooButton>
                <NnooButton onClick={() => setPhase('recording')}>Continue to recording</NnooButton>
              </div>
            </>
          )}

          {phase === 'recording' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Eyebrow>Now recording · A story</Eyebrow>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 36, color: NnooTheme.ink900, letterSpacing: '-0.02em', marginTop: 6 }}>
                Take your time. There is no hurry.
              </div>

              <div style={{
                marginTop: 24, padding: 28, borderRadius: 20,
                background: 'radial-gradient(600px 300px at 20% 0%, #fbe4d4 0%, transparent 60%), #f3ead8',
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 999, background: NnooTheme.danger, animation: 'pulse 1.8s ease-in-out infinite' }} />
                    <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 20, color: NnooTheme.ink900 }}>04:12</div>
                    <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink500 }}>· levels good</div>
                  </div>
                </div>
                <div>
                  <LiveWaveform recording={true} bars={80} />
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
                  <NnooButton variant="outline" size="lg">Pause</NnooButton>
                  <button onClick={() => setPhase('review')} style={{
                    width: 96, height: 96, borderRadius: 999, background: NnooTheme.danger,
                    border: '5px solid ' + NnooTheme.paper, boxShadow: '0 14px 40px rgba(58,24,9,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <div style={{ width: 24, height: 24, background: '#faf5ec', borderRadius: 4 }} />
                  </button>
                  <NnooButton variant="outline" size="lg">Add note</NnooButton>
                </div>
              </div>
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
            </div>
          )}

          {phase === 'sent' && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', flex: 1, maxWidth: 640 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: NnooTheme.plum100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="users" size={30} color={NnooTheme.plum} />
              </div>
              <Eyebrow style={{ marginTop: 24 }}>Sent to Ikpe</Eyebrow>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 42, color: NnooTheme.ink900, letterSpacing: '-0.025em', marginTop: 10, lineHeight: 1.05 }}>
                Now the people decide.
              </div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 16, color: NnooTheme.ink700, marginTop: 14, lineHeight: 1.6 }}>
                Mama Ada's recording is now in Ikpe. Kin from Nnewi will hear it, vote, and comment. It goes live in Ọbá once quorum agrees — usually 2–4 days.
              </div>
              <div style={{ marginTop: 20, padding: 16, background: NnooTheme.raised, borderRadius: 14, borderLeft: `3px solid ${NnooTheme.plum}`, fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 18, color: NnooTheme.ink900, lineHeight: 1.4 }}>
                "Igbo enwe eze." — the Igbo have no king.
              </div>
              <div style={{ marginTop: 26, display: 'flex', gap: 12 }}>
                <NnooButton variant="outline" onClick={() => setPhase('setup')}>Record another</NnooButton>
                <NnooButton>View the case in Ikpe</NnooButton>
              </div>
            </div>
          )}

          {phase === 'review' && (
            <>
              <Eyebrow>Review · before saving</Eyebrow>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 36, color: NnooTheme.ink900, letterSpacing: '-0.02em', marginTop: 6 }}>
                4 minutes, 12 seconds of Mama Ada
              </div>

              <div style={{ marginTop: 20, background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 20, padding: 22 }}>
                <Waveform progress={0.4} bars={100} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <NnooChip tone="forest">Story</NnooChip>
                  <NnooChip tone="neutral">Nnewi</NnooChip>
                  <NnooChip tone="neutral">Central dialect</NnooChip>
                  <ConsentBadge tier="oha" />
                </div>
              </div>

              <div style={{ marginTop: 20, background: NnooTheme.raised, borderRadius: 18, padding: 20, borderLeft: `4px solid ${NnooTheme.forest}` }}>
                <Eyebrow>Provenance captured</Eyebrow>
                <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700, marginTop: 8, lineHeight: 1.6 }}>
                  Recorded by <b style={{ color: NnooTheme.ink900 }}>Chinyere Okeke</b> with <b style={{ color: NnooTheme.ink900 }}>Mama Ada Nwosu</b> in Nnewi, Anambra on April 17, 2026.
                  Mama Ada chose to share with: <b style={{ color: NnooTheme.ink900 }}>anyone (Ọha)</b>.
                  A contributor payment of <b style={{ color: NnooTheme.ink900 }}>₦15,000</b> will be sent when Ikpe passes it. No one person publishes — the people do.
                </div>
              </div>

              <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                <NnooButton variant="outline" onClick={() => setPhase('recording')}>Record more</NnooButton>
                <NnooButton size="lg" onClick={() => setPhase('sent')}>Send to Ikpe</NnooButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ——— Marketing panel (compact, inside the chooser) ———
function MarketingInline() {
  return (
    <div data-screen-label="Marketing home" style={{
      width: 1180, background: NnooTheme.bg, borderRadius: 28, overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
    }}>
      <div style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="shared/assets/logo-horizontal.svg" height="40" alt="Nnọọ" />
        <div style={{ display: 'flex', gap: 28, fontFamily: NnooTheme.fontBody, fontSize: 14, fontWeight: 500, color: NnooTheme.ink700 }}>
          <span>Learn</span><span>Ọbá</span><span>Ọha</span><span>Contribute</span>
        </div>
        <button style={{ background: NnooTheme.clay, color: '#faf5ec', fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>Download</button>
      </div>

      <div style={{
        padding: '60px 40px 80px',
        background: 'radial-gradient(900px 500px at 10% 0%, #fbe4d4 0%, transparent 55%), radial-gradient(800px 450px at 100% 100%, #fae9b8 0%, transparent 55%), transparent',
      }}>
        <Eyebrow>Nnọọ · welcome home</Eyebrow>
        <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 800, fontSize: 100, color: NnooTheme.ink900, letterSpacing: '-0.035em', lineHeight: 0.95, marginTop: 12 }}>
          A language<br />is a <span style={{ color: NnooTheme.clay }}>homecoming</span>.
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 20, color: NnooTheme.ink700, marginTop: 24, maxWidth: 660, lineHeight: 1.5 }}>
          Nnọọ helps diaspora Igbo children learn the tongue their grandparents spoke — with real recordings of real elders, tonal feedback, and people from the same hometown as you.
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
          <button style={{ background: NnooTheme.clay, color: '#faf5ec', fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 16, padding: '14px 26px', borderRadius: 14, border: 'none', cursor: 'pointer' }}>Begin, free</button>
          <button style={{ background: 'transparent', color: NnooTheme.ink900, fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 16, padding: '14px 26px', borderRadius: 14, border: '1.5px solid #d6c8ad', cursor: 'pointer' }}>How it works</button>
        </div>
      </div>

      <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: NnooTheme.clay, color: '#faf5ec', padding: 36, borderRadius: 24 }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.85 }}>Aka nri · the right hand</div>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 36, letterSpacing: '-0.025em', marginTop: 10, lineHeight: 1.1 }}>
            Learn the tones. Learn the words.
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, marginTop: 14, opacity: 0.92, lineHeight: 1.6 }}>
            Daily 5-minute lessons that listen to you speak and tell you — gently — if your tones were right. No streaks badgering you. The words wait.
          </div>
        </div>
        <div style={{ background: NnooTheme.raised, padding: 36, borderRadius: 24, borderLeft: `4px solid ${NnooTheme.forest}`, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: NnooTheme.forest }}>Aka ekpe · the left hand</div>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 36, letterSpacing: '-0.025em', marginTop: 10, color: NnooTheme.ink900, lineHeight: 1.1 }}>
            Listen to the ones who came before.
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, marginTop: 14, color: NnooTheme.ink700, lineHeight: 1.6 }}>
            Ọbá is a community archive of elders telling stories, cooking, singing, explaining. Recorded with consent. Preserved with provenance. Yours to hear.
          </div>
        </div>
      </div>

      <div style={{ padding: '60px 40px 80px', textAlign: 'center', background: NnooTheme.raised }}>
        <Eyebrow>Ilu · a proverb</Eyebrow>
        <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontWeight: 500, fontSize: 56, color: NnooTheme.ink900, marginTop: 20, lineHeight: 1.15, letterSpacing: '-0.015em', maxWidth: 880, margin: '20px auto 0' }}>
          "Otu onye anaghị azụ nwata."
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, color: NnooTheme.ink500, marginTop: 20 }}>
          One person does not raise a child. · Nnewi dialect · Mama Ada Nwosu
        </div>
      </div>
    </div>
  );
}

// ——— Main app: tabbed chooser ———
function App() {
  const getInitial = () => {
    try { return localStorage.getItem('nnoo.view') || 'ios'; } catch(e) { return 'ios'; }
  };
  const [view, setView] = React.useState(getInitial);
  React.useEffect(() => { try { localStorage.setItem('nnoo.view', view); } catch(e){} }, [view]);

  const tabs = [
    { id: 'ios', label: 'iOS · learner' },
    { id: 'android', label: 'Android · learner' },
    { id: 'web', label: 'Web · learner' },
    { id: 'facilitator', label: 'Facilitator · tablet' },
    { id: 'marketing', label: 'Marketing · web' },
  ];

  return (
    <div style={{ minHeight: '100vh',
      background: 'radial-gradient(900px 500px at 20% 0%, #3d2e1f 0%, transparent 60%), radial-gradient(700px 400px at 100% 100%, #5f2811 0%, transparent 60%), #1a120b',
      padding: '28px 20px 60px',
    }}>
      {/* top bar */}
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="shared/assets/logo-horizontal-reversed.svg" height="36" alt="Nnọọ" />
          <span style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 15, color: 'rgba(250,245,236,0.65)', marginLeft: 8 }}>
            Two hands, one body.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(250,245,236,0.08)', padding: 4, borderRadius: 14 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              fontFamily: NnooTheme.fontBody, fontWeight: 600, fontSize: 13,
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: view === t.id ? NnooTheme.clay : 'transparent',
              color: view === t.id ? '#faf5ec' : 'rgba(250,245,236,0.7)',
              transition: 'background 220ms',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* view */}
      <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {view === 'ios' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <PhoneShell platform="ios" screenLabel="01 Learner iOS">
              <LearnerApp platform="ios" />
            </PhoneShell>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: 'rgba(250,245,236,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, textAlign: 'center', maxWidth: 360 }}>
              Try the full flow · hear Mama Ada, speak ụlọ, meet Ọbá, walk into Ọha
            </div>
          </div>
        )}
        {view === 'android' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <PhoneShell platform="android" screenLabel="02 Learner Android">
              <LearnerApp platform="android" />
            </PhoneShell>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: 'rgba(250,245,236,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              Same app, Android chrome · 360dp-safe
            </div>
          </div>
        )}
        {view === 'web' && (
          <FitScaler designWidth={1300} designHeight={920}>
            <NnooWeb />
          </FitScaler>
        )}
        {view === 'facilitator' && (
          <FitScaler designWidth={1240} designHeight={908}>
            <FacilitatorTablet />
          </FitScaler>
        )}
        {view === 'marketing' && (
          <FitScaler designWidth={1180} designHeight={1620}>
            <MarketingInline />
          </FitScaler>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
