// Nnọọ Learn — web version. Desktop layout: persistent left nav,
// main content stage, contextual right rail. Same primitives & tone as mobile.

const WEB_TODAY_PROVERB = {
  ig: 'Otu onye anaghị azụ nwata.',
  en: 'One person does not raise a child.',
  elder: 'Mama Ada Nwosu', place: 'Nnewi · Anambra', dialect: 'Nnewi central',
};

const WEB_LESSONS = [
  { id: 'l1', title: 'How to say where you live', words: 6, mins: 5, prog: 0.4, hi: true, tone: 'clay' },
  { id: 'l2', title: 'Greeting an elder', words: 4, mins: 4, prog: 0, tone: 'forest' },
  { id: 'l3', title: 'The four market days', words: 8, mins: 6, prog: 0, tone: 'marigold' },
  { id: 'l4', title: 'Asking for kola', words: 5, mins: 4, prog: 0, tone: 'plum' },
];

function NnooWeb() {
  const [route, setRoute] = React.useState('home');
  const [lessonStep, setLessonStep] = React.useState('listen'); // listen → speak → compare → done
  const [ikpeCase, setIkpeCase] = React.useState(null);
  const [recording, setRecording] = React.useState(null);

  return (
    <div data-screen-label="03 Learner web" style={{
      width: '100%', minHeight: 920, background: NnooTheme.bg,
      fontFamily: NnooTheme.fontBody, color: NnooTheme.ink900,
      borderRadius: 18, overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.28)',
      display: 'grid', gridTemplateColumns: '260px 1fr 340px',
    }}>
      <WebSidebar route={route} setRoute={(r) => { setRoute(r); setLessonStep('listen'); }} />

      <main style={{ padding: '32px 40px 60px', overflow: 'hidden' }}>
        {route === 'home' && <WebHome onStartLesson={() => setRoute('lesson')} onOpenIkpe={() => setRoute('ikpe')} onOpenArchive={(r) => { setRecording(r); setRoute('recording'); }} />}
        {route === 'lesson' && <WebLesson step={lessonStep} setStep={setLessonStep} onDone={() => setRoute('home')} />}
        {route === 'archive' && <WebArchive onOpen={(r) => { setRecording(r); setRoute('recording'); }} />}
        {route === 'recording' && <WebRecording rec={recording} onBack={() => setRoute('archive')} />}
        {route === 'ikpe' && !ikpeCase && <WebIkpe onOpenCase={setIkpeCase} />}
        {route === 'ikpe' && ikpeCase && <WebIkpeCase q={ikpeCase} onBack={() => setIkpeCase(null)} />}
        {route === 'oha' && <WebOha />}
        {route === 'you' && <WebYou />}
      </main>

      <WebRightRail route={route} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function WebSidebar({ route, setRoute }) {
  const nav = [
    { id: 'home', label: 'Today', icon: 'home' },
    { id: 'lesson', label: 'Lessons', icon: 'book' },
    { id: 'archive', label: 'Ọbá', icon: 'archive', sub: 'Living archive' },
    { id: 'ikpe', label: 'Ikpe', icon: 'users', sub: 'The council', badge: 2 },
    { id: 'oha', label: 'Ọha', icon: 'users', sub: 'Community' },
    { id: 'you', label: 'You', icon: 'book' },
  ];
  return (
    <aside style={{
      background: NnooTheme.raised, padding: '28px 18px', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #e8dfc9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 24px' }}>
        <img src="shared/assets/logo-mark.svg" width="36" height="36" alt="" />
        <div>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 18, color: NnooTheme.ink900, letterSpacing: '-0.01em' }}>Nnọọ</div>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 12, color: NnooTheme.ink500 }}>welcome home</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(n => {
          const active = route === n.id || (n.id === 'ikpe' && route === 'ikpe');
          return (
            <button key={n.id} onClick={() => setRoute(n.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: active ? NnooTheme.paper : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(58,24,9,0.06)' : 'none',
              textAlign: 'left',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: active ? NnooTheme.clay100 : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={n.icon} size={16} color={active ? NnooTheme.clay : NnooTheme.ink500} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: active ? NnooTheme.ink900 : NnooTheme.ink700 }}>{n.label}</div>
                {n.sub && <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, marginTop: 1 }}>{n.sub}</div>}
              </div>
              {n.badge ? (
                <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: NnooTheme.danger, color: '#faf5ec', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', padding: 14, background: NnooTheme.paper, borderRadius: 14, border: '1px solid #e8dfc9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: 'linear-gradient(135deg, #c85a26, #6d2c4f)', color: '#faf5ec', fontFamily: NnooTheme.fontDisplay, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>UE</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 13, color: NnooTheme.ink900 }}>Uzoma Eze</div>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>Nnewi · Atlanta</div>
          </div>
        </div>
        <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: NnooTheme.raised, overflow: 'hidden' }}>
          <div style={{ width: '34%', height: '100%', background: NnooTheme.clay }} />
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, marginTop: 6 }}>34% of words from Nnewi · keep going</div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────
function WebHome({ onStartLesson, onOpenIkpe, onOpenArchive }) {
  return (
    <div>
      <Eyebrow>Tuesday · 6 May</Eyebrow>
      <h1 style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 44, color: NnooTheme.ink900, letterSpacing: '-0.025em', margin: '6px 0 0', lineHeight: 1.05 }}>
        Nnọọ, Uzoma. <span style={{ color: NnooTheme.clay }}>Today's tongue.</span>
      </h1>
      <p style={{ fontFamily: NnooTheme.fontBody, fontSize: 16, color: NnooTheme.ink700, marginTop: 12, maxWidth: 620, lineHeight: 1.55 }}>
        Five minutes with Mama Ada. She is teaching you how to say where you live, in the way Nnewi says it.
      </p>

      {/* Today's lesson */}
      <button onClick={onStartLesson} style={{
        display: 'flex', alignItems: 'stretch', gap: 0, marginTop: 28, width: '100%',
        background: 'linear-gradient(135deg, #d97a3f 0%, #c85a26 50%, #873818 100%)',
        borderRadius: 22, padding: 0, border: 'none', cursor: 'pointer', overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(135, 56, 24, 0.22)',
        textAlign: 'left',
      }}>
        <div style={{ flex: 1, padding: '26px 30px', color: '#faf5ec' }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.85 }}>Today's lesson · 5 min</div>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 30, marginTop: 6, lineHeight: 1.1, letterSpacing: '-0.02em' }}>How to say where you live</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, fontFamily: NnooTheme.fontArchive, fontSize: 14, fontStyle: 'italic', opacity: 0.95 }}>
            <span style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(250,245,236,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={12} color="#faf5ec" />
            </span>
            Mama Ada is teaching today · Nnewi central
          </div>
        </div>
        <div style={{ width: 220, background: 'radial-gradient(circle at 50% 50%, rgba(250,245,236,0.18), transparent 65%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 140, height: 140, borderRadius: 999, border: '2px dashed rgba(250,245,236,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NnooTheme.fontArchive, fontSize: 48, fontStyle: 'italic', color: '#faf5ec' }}>ụ̀lọ́</div>
        </div>
      </button>

      {/* Two columns: Continue + Ikpe */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <NnooCard padding={20}>
          <Eyebrow>Continue</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {WEB_LESSONS.slice(0, 3).map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: NnooTheme.raised, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="book" size={14} color={NnooTheme.ink700} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: NnooTheme.ink900 }}>{l.title}</div>
                  <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, marginTop: 1 }}>{l.words} words · {l.mins} min</div>
                </div>
                <div style={{ width: 56, height: 4, borderRadius: 999, background: NnooTheme.raised, overflow: 'hidden' }}>
                  <div style={{ width: `${l.prog * 100}%`, height: '100%', background: NnooTheme.clay }} />
                </div>
              </div>
            ))}
          </div>
        </NnooCard>

        <button onClick={onOpenIkpe} style={{
          textAlign: 'left', cursor: 'pointer', border: 'none', padding: 20,
          background: NnooTheme.plum, color: '#faf5ec', borderRadius: 18,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(250,245,236,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="users" size={14} color="#faf5ec" />
            </div>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.85 }}>Ikpe · 2 cases waiting</div>
          </div>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.015em' }}>
            Two recordings from Nnewi need your voice.
          </div>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 14, opacity: 0.92, marginTop: 'auto' }}>
            "Igbo enwe eze." The people decide.
          </div>
        </button>
      </div>

      {/* Recent from Ọbá */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <Eyebrow>From Ọbá · recent from Nnewi</Eyebrow>
          <button style={{ background: 'transparent', border: 'none', color: NnooTheme.clay, fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>See all the archive →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { t: 'How we say the word for home', e: 'Mama Ada Nwosu', d: '0:48', g: 'linear-gradient(135deg, #e17f47, #c85a26 55%, #6d2c4f)' },
            { t: 'The first market my mother knew', e: 'Papa Emeka Okafor', d: '4:12', g: 'linear-gradient(135deg, #d9a019, #c85a26)' },
            { t: 'A song for naming a child', e: 'Mama Adaeze Eze', d: '2:36', g: 'linear-gradient(135deg, #2e5d3a, #1a120b)', restricted: true },
          ].map((r, i) => (
            <button key={i} onClick={() => onOpenArchive(r)} style={{
              padding: 0, background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 16,
              cursor: 'pointer', textAlign: 'left', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ height: 120, background: r.g, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 12 }}>
                <span style={{ background: 'rgba(26,18,11,0.55)', color: '#faf5ec', fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 999, backdropFilter: 'blur(6px)' }}>{r.d}</span>
                {r.restricted && (
                  <span style={{ marginLeft: 'auto', background: NnooTheme.plum, color: '#faf5ec', fontFamily: NnooTheme.fontBody, fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nsọ</span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 16, color: NnooTheme.ink900, lineHeight: 1.25 }}>{r.t}</div>
                <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 6 }}>{r.e} · Nnewi</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lesson — full tonal feedback flow
// ─────────────────────────────────────────────────────────────
function WebLesson({ step, setStep, onDone }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Eyebrow>Lesson · word 3 of 6</Eyebrow>
        <div style={{ flex: 1, height: 4, borderRadius: 999, background: NnooTheme.raised, overflow: 'hidden' }}>
          <div style={{ width: '50%', height: '100%', background: NnooTheme.clay }} />
        </div>
        <button onClick={onDone} style={{ background: 'transparent', border: 'none', color: NnooTheme.ink500, fontFamily: NnooTheme.fontBody, fontSize: 13, cursor: 'pointer' }}>Save & exit</button>
      </div>

      <h1 style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 36, color: NnooTheme.ink900, letterSpacing: '-0.025em', margin: '20px 0 4px', lineHeight: 1.1 }}>
        How to say where you live
      </h1>
      <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700 }}>
        Mama Ada is teaching you the word <i>ụlọ</i> — house, home.
      </div>

      {/* Word stage */}
      <div style={{
        marginTop: 22, padding: '36px 40px', borderRadius: 24,
        background: 'radial-gradient(700px 320px at 30% 0%, #fbe4d4 0%, transparent 70%), #faf5ec',
        border: '1px solid #e8dfc9',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
          {/* Left: word + tone hint */}
          <div style={{ flex: 1 }}>
            <Eyebrow>Word</Eyebrow>
            <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 96, fontWeight: 500, color: NnooTheme.ink900, letterSpacing: '-0.025em', lineHeight: 1, marginTop: 10 }}>ụ̀lọ́</div>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 18, color: NnooTheme.ink700, marginTop: 14, lineHeight: 1.5 }}>
              <b style={{ color: NnooTheme.ink900 }}>House. Home.</b> Two syllables. The first is <b>low</b>, the second <b>rises</b>.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <NnooChip tone="forest">Nnewi central</NnooChip>
              <NnooChip tone="neutral">Noun</NnooChip>
              <NnooChip tone="neutral">2 syllables</NnooChip>
            </div>
          </div>

          {/* Right: pitch contour */}
          <div style={{ width: 360 }}>
            <Eyebrow>Tone shape to match</Eyebrow>
            <div style={{ marginTop: 10, padding: 16, background: NnooTheme.paper, borderRadius: 14, border: '1px solid #e8dfc9' }}>
              <PitchContour
                target={[0.18, 0.20, 0.22, 0.24, 0.26, 0.30, 0.38, 0.48, 0.58, 0.68, 0.76, 0.82, 0.86, 0.88, 0.86, 0.80]}
                learner={step === 'compare' || step === 'done' ? [0.20, 0.22, 0.24, 0.27, 0.32, 0.40, 0.50, 0.60, 0.68, 0.74, 0.80, 0.84, 0.86, 0.86, 0.84, 0.78] : null}
                recording={step === 'speak'}
              />
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 2, background: NnooTheme.marigold }} /> Mama Ada
                </span>
                {(step === 'compare' || step === 'done') && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 2, background: NnooTheme.clay }} /> You
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mama Ada bar */}
        <div style={{ marginTop: 28, padding: 16, background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ width: 44, height: 44, borderRadius: 999, background: NnooTheme.marigold, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="play" size={14} color={NnooTheme.ink900} />
          </button>
          <div style={{ flex: 1 }}>
            <Waveform progress={0.5} bars={48} />
          </div>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 14, color: NnooTheme.ink700 }}>
            Mama Ada · Nnewi · 79
          </div>
        </div>

        {/* Action row */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {step === 'listen' && (
            <NnooButton size="lg" onClick={() => setStep('speak')} icon={<Icon name="mic" size={14} color="#faf5ec" />}>Now you say it</NnooButton>
          )}
          {step === 'speak' && (
            <button onClick={() => setStep('compare')} style={{
              width: 92, height: 92, borderRadius: 999, background: NnooTheme.danger,
              border: '4px solid ' + NnooTheme.bg, boxShadow: '0 14px 40px rgba(58,24,9,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              animation: 'webPulse 1.6s ease-in-out infinite',
            }}>
              <div style={{ width: 22, height: 22, background: '#faf5ec', borderRadius: 4 }} />
            </button>
          )}
          {step === 'compare' && (
            <>
              <NnooButton variant="outline" size="lg" onClick={() => setStep('speak')}>Try again</NnooButton>
              <NnooButton size="lg" onClick={() => setStep('done')}>Continue</NnooButton>
            </>
          )}
          {step === 'done' && (
            <>
              <NnooButton variant="outline" size="lg" onClick={() => setStep('listen')}>Previous word</NnooButton>
              <NnooButton size="lg" onClick={() => setStep('listen')}>Next word →</NnooButton>
            </>
          )}
        </div>

        <style>{`@keyframes webPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>
      </div>

      {/* Feedback band — appears at compare/done */}
      {(step === 'compare' || step === 'done') && (
        <div style={{ marginTop: 22, padding: 22, borderRadius: 20, background: NnooTheme.forest100, borderLeft: `4px solid ${NnooTheme.forest}`, display: 'flex', gap: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: NnooTheme.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="check" size={20} color="#faf5ec" />
          </div>
          <div>
            <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 22, color: '#153a1f', letterSpacing: '-0.015em' }}>Ọ dị mma · that was good.</div>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: '#264c2f', marginTop: 6, lineHeight: 1.55, maxWidth: 640 }}>
              Your pitch rose where Mama Ada's rose. The second syllable came out clean. Three more like this and you'll have <i>ụlọ</i> for life.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <NnooChip tone="forest">Tone match · 92%</NnooChip>
              <NnooChip tone="neutral">Vowel · clear</NnooChip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ọbá archive (web)
// ─────────────────────────────────────────────────────────────
const WEB_ARCHIVE = [
  { id: 'a1', title: 'How we say the word for home', elder: 'Mama Ada Nwosu', age: 79, place: 'Nnewi · Anambra', dialect: 'Nnewi central', dur: '0:48', tier: 'oha', g: 'linear-gradient(135deg, #e17f47, #c85a26 55%, #6d2c4f)' },
  { id: 'a2', title: 'The first market my mother knew', elder: 'Papa Emeka Okafor', age: 83, place: 'Nnewi · Anambra', dialect: 'Nnewi central', dur: '4:12', tier: 'oha', g: 'linear-gradient(135deg, #d9a019, #c85a26)' },
  { id: 'a3', title: 'Ofe nsala — a wedding soup', elder: 'Auntie Chinwe', age: 62, place: 'Owerri · Imo', dialect: 'Owerri', dur: '8:24', tier: 'oha', g: 'linear-gradient(135deg, #d9a019, #6d2c4f)' },
  { id: 'a4', title: 'A song for naming a child', elder: 'Mama Adaeze Eze', age: 74, place: 'Enugu · Enugu', dialect: 'Enugu', dur: '2:36', tier: 'nso', g: 'linear-gradient(135deg, #2e5d3a, #1a120b)' },
  { id: 'a5', title: 'Ilu about patience', elder: 'Papa Chijioke', age: 81, place: 'Nsukka · Enugu', dialect: 'Nsukka', dur: '1:08', tier: 'oha', g: 'linear-gradient(135deg, #6d2c4f, #1a120b)' },
  { id: 'a6', title: 'How a kola is broken', elder: 'Igwe Obinna', age: 88, place: 'Onitsha · Anambra', dialect: 'Onitsha', dur: '3:50', tier: 'umunna', g: 'linear-gradient(135deg, #c85a26, #2e5d3a)' },
];

function WebArchive({ onOpen }) {
  const [tier, setTier] = React.useState('all');
  const filtered = tier === 'all' ? WEB_ARCHIVE : WEB_ARCHIVE.filter(a => a.tier === tier);
  return (
    <div>
      <Eyebrow>Ọbá · the living archive</Eyebrow>
      <h1 style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 38, color: NnooTheme.ink900, letterSpacing: '-0.025em', margin: '6px 0 14px', lineHeight: 1.1 }}>
        The voices that remember.
      </h1>
      <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, color: NnooTheme.ink700, maxWidth: 620, lineHeight: 1.6 }}>
        Every recording is consented, dialect-tagged, and validated by Ikpe before it appears here. You hear the people who actually speak the language — not approximations.
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
        {[['all', 'Everything'], ['oha', 'Ọha · open'], ['umunna', 'Umunna · kin only'], ['nso', 'Nsọ · sacred']].map(([id, l]) => (
          <button key={id} onClick={() => setTier(id)} style={{
            padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: tier === id ? NnooTheme.ink900 : NnooTheme.raised,
            color: tier === id ? '#faf5ec' : NnooTheme.ink700,
            fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 13,
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 18 }}>
        {filtered.map(a => (
          <button key={a.id} onClick={() => onOpen(a)} style={{
            display: 'flex', gap: 14, padding: 14,
            background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 16,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 80, height: 80, borderRadius: 12, background: a.g, flexShrink: 0, display: 'flex', alignItems: 'flex-end', padding: 8 }}>
              <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 700, color: '#faf5ec', background: 'rgba(0,0,0,0.3)', padding: '2px 7px', borderRadius: 999 }}>{a.dur}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 16, color: NnooTheme.ink900, lineHeight: 1.25 }}>{a.title}</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 4 }}>{a.elder} · age {a.age} · {a.place}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <ConsentBadge tier={a.tier} />
                <NnooChip tone="neutral">{a.dialect}</NnooChip>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function WebRecording({ rec, onBack }) {
  if (!rec) return null;
  return (
    <div>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: NnooTheme.ink500, fontFamily: NnooTheme.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <Icon name="chevronL" size={14} color={NnooTheme.ink500} /> All of Ọbá
      </button>

      <div style={{
        marginTop: 16, borderRadius: 22, padding: '40px 36px', color: '#faf5ec',
        background: rec.g || 'linear-gradient(135deg, #e17f47, #c85a26 55%, #6d2c4f)',
      }}>
        <Eyebrow style={{ color: 'rgba(250,245,236,0.85)' }}>From Ọbá · Nnewi central</Eyebrow>
        <h1 style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 44, letterSpacing: '-0.02em', margin: '12px 0 0', lineHeight: 1.1 }}>
          {rec.title}
        </h1>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, marginTop: 10, opacity: 0.92 }}>
          {rec.elder} · age {rec.age || 79} · {rec.place || 'Nnewi'}
        </div>

        <div style={{ marginTop: 26, padding: 18, background: 'rgba(250,245,236,0.14)', borderRadius: 16, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ width: 56, height: 56, borderRadius: 999, background: '#faf5ec', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="play" size={16} color={NnooTheme.ink900} />
          </button>
          <div style={{ flex: 1 }}>
            <Waveform progress={0.32} bars={64} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: NnooTheme.fontBody, fontSize: 11, opacity: 0.85 }}>
              <span>0:00</span><span>{rec.dur || '0:48'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provenance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
        <NnooCard padding={20}>
          <Eyebrow>Provenance</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <ProvenanceChain
              steps={[
                { who: rec.elder, role: 'spoke', where: rec.place, when: 'Apr 17, 2026' },
                { who: 'Chinyere Okeke', role: 'recorded with consent', where: 'Nnewi', when: 'Apr 17, 2026' },
                { who: 'Ikpe', role: 'passed by 51 kin', where: 'Nnewi council', when: 'Apr 21, 2026' },
                { who: 'Ọbá', role: 'archived', where: '—', when: 'Apr 21, 2026' },
              ]}
            />
          </div>
        </NnooCard>
        <NnooCard padding={20}>
          <Eyebrow>What Mama Ada said</Eyebrow>
          <p style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 16, color: NnooTheme.ink900, marginTop: 12, lineHeight: 1.5 }}>
            "Ụlọ bụ ebe obi gị nọ. House is the place your heart sits. Even far from here — that is still home."
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <NnooChip tone="forest">Story</NnooChip>
            <NnooChip tone="neutral">Nnewi central</NnooChip>
            <ConsentBadge tier={rec.tier || 'oha'} />
          </div>
        </NnooCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ikpe (web)
// ─────────────────────────────────────────────────────────────
function WebIkpe({ onOpenCase }) {
  const [filter, setFilter] = React.useState('pending');
  const queue = window.IKPE_PENDING || [];
  const list = queue.filter(q => filter === 'pending' ? !q.passed : q.passed);
  return (
    <div>
      <Eyebrow>Ikpe · the council</Eyebrow>
      <h1 style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 38, color: NnooTheme.ink900, letterSpacing: '-0.025em', margin: '6px 0 0', lineHeight: 1.1 }}>
        Igbo enwe eze.
      </h1>
      <p style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, color: NnooTheme.ink700, marginTop: 10, maxWidth: 620, lineHeight: 1.6 }}>
        The Igbo have no king. Every recording waits here until kin from the hometown say it is ready. No single custodian publishes — the people do.
      </p>

      <div style={{ display: 'flex', gap: 6, background: NnooTheme.raised, borderRadius: 12, padding: 4, marginTop: 22, width: 'fit-content' }}>
        {[['pending', `Pending · ${queue.filter(q => !q.passed).length}`], ['passed', `Passed · ${queue.filter(q => q.passed).length}`]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: filter === id ? NnooTheme.paper : 'transparent',
            fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 13,
            color: filter === id ? NnooTheme.ink900 : NnooTheme.ink500,
            boxShadow: filter === id ? '0 1px 3px rgba(58,24,9,0.06)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {list.map(q => {
          const total = q.votes.keep + q.votes.wait + q.votes.no;
          const kinPct = Math.min(100, (q.quorum.got / q.quorum.need) * 100);
          return (
            <button key={q.id} onClick={() => onOpenCase(q)} style={{
              display: 'flex', gap: 16, padding: 16,
              background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 18,
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: q.gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mic" size={20} color="#faf5ec" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 16, color: NnooTheme.ink900 }}>{q.title}</div>
                <div style={{ fontFamily: NnooTheme.fontArchive, fontSize: 13, color: NnooTheme.ink700, marginTop: 3 }}>{q.elder} · {q.place} · {q.dur}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                  <div style={{ flex: 1, height: 6, background: NnooTheme.raised, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${kinPct}%`, height: '100%', background: kinPct >= 100 ? NnooTheme.forest : NnooTheme.clay }} />
                  </div>
                  <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 12, color: NnooTheme.ink900 }}>{q.quorum.got}/{q.quorum.need} kin</div>
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink700 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: NnooTheme.forest }} /> {q.votes.keep} keep</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: NnooTheme.marigold }} /> {q.votes.wait} wait</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: NnooTheme.danger }} /> {q.votes.no} no</span>
                  <span style={{ marginLeft: 'auto', color: NnooTheme.ink500 }}>{q.submitted}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WebIkpeCase({ q, onBack }) {
  const [voted, setVoted] = React.useState(null);
  const liveKin = q.quorum.got + (voted ? 1 : 0);
  const kinPct = Math.min(100, (liveKin / q.quorum.need) * 100);
  return (
    <div>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: NnooTheme.ink500, fontFamily: NnooTheme.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <Icon name="chevronL" size={14} color={NnooTheme.ink500} /> All cases
      </button>

      <div style={{ marginTop: 16, borderRadius: 22, padding: '36px 32px', color: '#faf5ec', background: q.gradient }}>
        <Eyebrow style={{ color: 'rgba(250,245,236,0.85)' }}>Ikpe · under review</Eyebrow>
        <h1 style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 36, letterSpacing: '-0.015em', margin: '10px 0 0', lineHeight: 1.15 }}>{q.title}</h1>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, marginTop: 8, opacity: 0.9 }}>{q.elder} · {q.place}</div>

        <div style={{ marginTop: 22, padding: 14, background: 'rgba(250,245,236,0.14)', borderRadius: 14, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ width: 44, height: 44, borderRadius: 999, background: '#faf5ec', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="play" size={14} color={NnooTheme.ink900} />
          </button>
          <Waveform progress={0.18} bars={56} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginTop: 18 }}>
        {/* Left: rubric + vote */}
        <div>
          <NnooCard padding={20}>
            <Eyebrow>Before you vote · what Ikpe asks</Eyebrow>
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700, lineHeight: 1.7 }}>
              <li>· Is the telling true to how you heard it at home?</li>
              <li>· Is the elder's consent honored — including who can listen?</li>
              <li>· Are names, places, and dialect labeled correctly?</li>
              <li>· Would this make your grandmother proud to sit beside?</li>
            </ul>
          </NnooCard>

          <div style={{ marginTop: 14 }}>
            <Eyebrow>Your voice</Eyebrow>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <VoteButton label="Keep it" sub="It is ready" tone="forest" active={voted === 'keep'} onClick={() => setVoted('keep')} />
              <VoteButton label="Wait" sub="Needs more" tone="marigold" active={voted === 'wait'} onClick={() => setVoted('wait')} />
              <VoteButton label="No" sub="Don't publish" tone="danger" active={voted === 'no'} onClick={() => setVoted('no')} />
            </div>
            {voted && (
              <div style={{ marginTop: 10, fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, lineHeight: 1.55 }}>
                You are from Nnewi — your voice counts toward kin quorum. You can change it until the case closes.
              </div>
            )}
          </div>
        </div>

        {/* Right: tally + comments */}
        <div>
          <NnooCard padding={20}>
            <Eyebrow>The council so far</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700 }}>Kin from {q.place.split(' · ')[0]}</span>
              <span style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: NnooTheme.ink900 }}>{liveKin} / {q.quorum.need}</span>
            </div>
            <div style={{ height: 10, background: NnooTheme.raised, borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ width: `${kinPct}%`, height: '100%', background: kinPct >= 100 ? NnooTheme.forest : NnooTheme.clay, transition: 'width 400ms' }} />
            </div>
            <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: NnooTheme.raised, marginTop: 18 }}>
              <div style={{ flex: q.votes.keep + (voted === 'keep' ? 1 : 0), background: NnooTheme.forest }} />
              <div style={{ flex: q.votes.wait + (voted === 'wait' ? 1 : 0), background: NnooTheme.marigold }} />
              <div style={{ flex: q.votes.no + (voted === 'no' ? 1 : 0), background: NnooTheme.danger }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink700 }}>
              <span>{q.votes.keep + (voted === 'keep' ? 1 : 0)} keep</span>
              <span>{q.votes.wait + (voted === 'wait' ? 1 : 0)} wait</span>
              <span>{q.votes.no + (voted === 'no' ? 1 : 0)} no</span>
            </div>
          </NnooCard>

          <div style={{ marginTop: 14 }}>
            <Eyebrow>What people are saying</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {q.comments.slice(0, 2).map((c, i) => (
                <div key={i} style={{ background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 14, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 999, background: c.elder ? NnooTheme.marigold100 : NnooTheme.plum100, color: c.elder ? '#684809' : NnooTheme.plum, fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.who[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 13, color: NnooTheme.ink900 }}>{c.who}</div>
                        {c.elder && <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 9, fontWeight: 700, color: '#684809', background: NnooTheme.marigold100, padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Elder</span>}
                      </div>
                      <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>{c.where} · {c.age}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 8, lineHeight: 1.55 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ọha (community)
// ─────────────────────────────────────────────────────────────
function WebOha() {
  return (
    <div>
      <Eyebrow>Ọha · the gathering</Eyebrow>
      <h1 style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 38, color: NnooTheme.ink900, letterSpacing: '-0.025em', margin: '6px 0 14px', lineHeight: 1.1 }}>
        People who share your hometown.
      </h1>
      <p style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, color: NnooTheme.ink700, maxWidth: 620, lineHeight: 1.6 }}>
        Find learners from the same place — Nnewi, Owerri, Nsukka, the cities they live in now. Listen together. Speak together.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 22 }}>
        {[
          { name: 'Nsukka Our Pride', members: '2,142 from Nsukka', cities: 'Lagos · Houston · London', g: NnooTheme.forest },
          { name: 'Igboezue Japan', members: '184 across Japan', cities: 'Tokyo · Osaka · Nagoya', g: NnooTheme.plum },
          { name: 'Umunna Manitoba', members: '67 in Winnipeg', cities: 'Winnipeg · Brandon', g: NnooTheme.clay },
          { name: 'Nnewi Atlanta', members: '348 in metro Atlanta', cities: 'Atlanta · Marietta', g: NnooTheme.marigold },
        ].map((c, i) => (
          <div key={i} style={{
            background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 18,
            padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ height: 8, background: c.g }} />
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 17, color: NnooTheme.ink900, letterSpacing: '-0.01em' }}>{c.name}</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 4 }}>{c.members}</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 2 }}>{c.cities}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <NnooButton size="sm">Join the circle</NnooButton>
                <NnooButton size="sm" variant="outline">Listen first</NnooButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// You (profile)
// ─────────────────────────────────────────────────────────────
function WebYou() {
  return (
    <div>
      <Eyebrow>Your tongue, in progress</Eyebrow>
      <h1 style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 38, color: NnooTheme.ink900, letterSpacing: '-0.025em', margin: '6px 0 14px', lineHeight: 1.1 }}>
        Uzoma Eze · Nnewi · Atlanta.
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 18 }}>
        {[
          { n: '128', l: 'Words held', sub: 'in Nnewi central' },
          { n: '34%', l: 'Of words from your hometown' },
          { n: '7', l: 'Elders you have heard' },
        ].map((s, i) => (
          <div key={i} style={{ padding: 22, background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 18 }}>
            <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 44, color: NnooTheme.ink900, letterSpacing: '-0.025em', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 6 }}>{s.l}</div>
            {s.sub && <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <Eyebrow>Ones you've kept close</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {[
            ['ụlọ', 'house · home', 'Mama Ada'],
            ['ọjị', 'kola nut', 'Papa Emeka'],
            ['nnọọ', 'welcome', 'Mama Ada'],
            ['nwayọọ', 'gentleness · slowly', 'Mama Adaeze'],
          ].map(([w, m, e], i) => (
            <div key={i} style={{ padding: 14, background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: NnooTheme.ink900, minWidth: 100 }}>{w}</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, flex: 1 }}>{m}</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500 }}>from {e}</div>
              <button style={{ width: 36, height: 36, borderRadius: 999, background: NnooTheme.raised, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="play" size={12} color={NnooTheme.ink700} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Right rail — context-aware
// ─────────────────────────────────────────────────────────────
function WebRightRail({ route }) {
  return (
    <aside style={{
      background: NnooTheme.bg, padding: '28px 22px', borderLeft: '1px solid #e8dfc9',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* Today's proverb — always present */}
      <div style={{ padding: 18, background: NnooTheme.ink900, borderRadius: 16, color: '#faf5ec' }}>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.65 }}>Ilu of the day</div>
        <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontWeight: 500, fontSize: 18, marginTop: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          "{WEB_TODAY_PROVERB.ig}"
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, opacity: 0.8, marginTop: 8, lineHeight: 1.5 }}>
          {WEB_TODAY_PROVERB.en}
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, opacity: 0.55, marginTop: 12 }}>
          {WEB_TODAY_PROVERB.elder} · {WEB_TODAY_PROVERB.place}
        </div>
      </div>

      {/* Context-specific */}
      {route === 'home' && (
        <NnooCard padding={18}>
          <Eyebrow>This week</Eyebrow>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600, color: NnooTheme.ink500 }}>{d}</div>
                <div style={{ flex: 1, height: 6, background: NnooTheme.raised, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${[0.6, 0.8, 0.4, 0, 0, 0, 0][i] * 100}%`, height: '100%', background: i === 1 ? NnooTheme.clay : NnooTheme.ink100 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 12, lineHeight: 1.5 }}>
            Two days this week. The words wait — no streaks here.
          </div>
        </NnooCard>
      )}

      {(route === 'lesson') && (
        <NnooCard padding={18}>
          <Eyebrow>Words in this lesson</Eyebrow>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['nnọọ', 'welcome', 'done'],
              ['ezigbo', 'good', 'done'],
              ['ụlọ', 'house', 'now'],
              ['obi', 'heart', ''],
              ['ụzọ', 'way', ''],
              ['ezí', 'outside', ''],
            ].map(([w, m, st], i) => {
              const c = st === 'done' ? NnooTheme.forest : st === 'now' ? NnooTheme.clay : NnooTheme.ink100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 999, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {st === 'done' && <Icon name="check" size={10} color="#fff" />}
                  </span>
                  <span style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 16, color: NnooTheme.ink900, fontWeight: 500, minWidth: 64 }}>{w}</span>
                  <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500 }}>{m}</span>
                </div>
              );
            })}
          </div>
        </NnooCard>
      )}

      {route === 'archive' && (
        <NnooCard padding={18}>
          <Eyebrow>Filter by hometown</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
            {[
              ['Nnewi', 142, true],
              ['Owerri', 89],
              ['Nsukka', 76],
              ['Onitsha', 64],
              ['Enugu', 48],
              ['Aba', 31],
            ].map(([name, n, mine], i) => (
              <button key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 13, color: NnooTheme.ink900, flex: 1 }}>
                  {name} {mine && <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 10, fontWeight: 700, color: NnooTheme.clay, marginLeft: 4 }}>· yours</span>}
                </span>
                <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>{n}</span>
              </button>
            ))}
          </div>
        </NnooCard>
      )}

      {route === 'ikpe' && (
        <NnooCard padding={18}>
          <Eyebrow>How Ikpe works</Eyebrow>
          <ol style={{ margin: '12px 0 0', padding: '0 0 0 16px', fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink700, lineHeight: 1.7 }}>
            <li>A facilitator records an elder, with consent.</li>
            <li>The recording lands here — not in Ọbá.</li>
            <li>Kin from the hometown vote: keep, wait, no.</li>
            <li>Quorum + majority sends it live to Ọbá.</li>
            <li>Only then does the contributor get paid.</li>
          </ol>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 13, color: NnooTheme.ink500, marginTop: 14, lineHeight: 1.4 }}>
            "Igbo enwe eze." No one person publishes.
          </div>
        </NnooCard>
      )}

      {(route === 'oha' || route === 'you' || route === 'recording') && (
        <NnooCard padding={18}>
          <Eyebrow>Two hands, one body</Eyebrow>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 10, lineHeight: 1.6 }}>
            <b style={{ color: NnooTheme.clay }}>Aka nri</b> teaches you to speak. <b style={{ color: NnooTheme.forest }}>Aka ekpe</b> lets you listen to the people who came before. Both, every day.
          </div>
        </NnooCard>
      )}
    </aside>
  );
}

Object.assign(window, { NnooWeb });
