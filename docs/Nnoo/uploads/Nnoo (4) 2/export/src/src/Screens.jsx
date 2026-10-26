// Nnọọ Learn — screen components for the hero flow.
// Depends on: NnooTheme, Icon, Eyebrow, NnooCard, NnooChip, NnooButton, Waveform, AppHeader, TabBar,
// ConsentBadge, ElderAttribution, ProvenanceChain, PitchContour, LiveWaveform, LivingCalendar, IgbolandMap

// ——— Sample data: grandmother Ada's recording, Nnewi dialect ———
const ELDER_ADA = {
  name: 'Mama Ada Nwosu',
  village: 'Nnewi',
  state: 'Anambra',
  age: 79,
  dialect: 'Nnewi central',
  initial: 'A',
  gradient: 'linear-gradient(135deg, #e17f47 0%, #c85a26 55%, #6d2c4f 100%)',
};

// Pitch contour for "ụlọ" — low then high. Smooth arc.
const TARGET_ULO = [0.18, 0.20, 0.22, 0.24, 0.26, 0.30, 0.38, 0.48, 0.58, 0.68, 0.76, 0.82, 0.86, 0.88, 0.86, 0.80];
// Learner's first attempt — a bit flat at the end ("close but not right")
const LEARNER_CLOSE = [0.22, 0.24, 0.26, 0.28, 0.32, 0.38, 0.46, 0.54, 0.62, 0.66, 0.68, 0.68, 0.66, 0.64, 0.62, 0.60];
// Second attempt — right on
const LEARNER_GOOD = [0.20, 0.22, 0.24, 0.26, 0.30, 0.36, 0.44, 0.52, 0.62, 0.72, 0.80, 0.84, 0.86, 0.86, 0.82, 0.78];

// ——— Home ———
function HomeScreen({ onStartLesson, onOpenArchive, onOpenOha, onOpenProverb, onOpenIkpe }) {
  return (
    <div>
      <AppHeader greeting="Nnọọ, Chinyere." name="Welcome home" streak={12} />

      <div style={{ padding: '0 20px' }}>
        {/* Today's lesson */}
        <div style={{
          background: 'radial-gradient(600px 300px at 0% 0%, #fbe4d4 0%, transparent 60%), radial-gradient(500px 260px at 100% 100%, #fae9b8 0%, transparent 60%), #f3ead8',
          borderRadius: 24, padding: 20, position: 'relative', overflow: 'hidden',
        }}>
          <Eyebrow>Today's lesson · 2 of 3</Eyebrow>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 30, color: NnooTheme.ink900, letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.05 }}>
            Words for home
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700, marginTop: 6 }}>
            ụlọ · ezi · ọnụ ụzọ
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <div style={{ height: 6, flex: 1, background: NnooTheme.clay, borderRadius: 999 }} />
            <div style={{ height: 6, flex: 1, background: NnooTheme.clay, borderRadius: 999 }} />
            <div style={{ height: 6, flex: 1, background: '#d6c8ad', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.5)', borderRadius: 999, padding: '5px 10px' }}>
              <Icon name="mic" size={12} color={NnooTheme.clay} />
              <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600, color: NnooTheme.ink700 }}>Mama Ada · Nnewi</span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <NnooButton onClick={onStartLesson} fullWidth size="lg">Gaa n'ihu · continue</NnooButton>
          </div>
        </div>
      </div>

      {/* Market day + proverb, side by side */}
      <div style={{ padding: '16px 20px 0 20px' }}>
        <Eyebrow>Ụbọchị ahịa · today's market day</Eyebrow>
        <div style={{ marginTop: 8, background: NnooTheme.paper, borderRadius: 18, border: '1px solid #e8dfc9', padding: 14 }}>
          <LivingCalendar active="orie" />
        </div>
      </div>

      {/* Proverb of the day */}
      <div style={{ padding: '16px 20px 0 20px' }}>
        <Eyebrow>Ilu ụbọchị · proverb today</Eyebrow>
        <button onClick={onOpenProverb} style={{
          width: '100%', textAlign: 'left', background: NnooTheme.raised, borderRadius: 18,
          padding: 18, border: 'none', borderLeft: `4px solid ${NnooTheme.forest}`,
          borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginTop: 8, cursor: 'pointer',
        }}>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontSize: 22, fontStyle: 'italic', color: NnooTheme.ink900, lineHeight: 1.3 }}>
            "Otu onye anaghị azụ nwata."
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <NnooChip tone="forest">Nnewi dialect</NnooChip>
              <ConsentBadge tier="oha" />
            </div>
            <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.clay, fontWeight: 600 }}>Tap to reveal →</span>
          </div>
        </button>
      </div>

      {/* Ikpe — the council */}
      <div style={{ padding: '16px 20px 0 20px' }}>
        <Eyebrow>Ikpe · 2 waiting for your voice</Eyebrow>
        <button onClick={onOpenIkpe} style={{
          width: '100%', textAlign: 'left', background: NnooTheme.plum, color: '#faf5ec',
          borderRadius: 18, padding: 16, border: 'none', marginTop: 8, cursor: 'pointer',
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(250,245,236,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="users" size={18} color="#faf5ec" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>New recordings from Nnewi need kin</div>
            <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              "Igbo enwe eze." The people decide.
            </div>
          </div>
          <Icon name="chevronR" size={18} color="#faf5ec" />
        </button>
      </div>

      {/* Recent from archive */}
      <div style={{ padding: '20px 20px 140px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Eyebrow>From Ọbá · recent from Nnewi</Eyebrow>
          <button onClick={onOpenArchive} style={{ background: 'transparent', border: 'none', color: NnooTheme.clay, fontFamily: NnooTheme.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>See all →</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ArchiveRow
            title="How we say the word for home"
            elder="Mama Ada Nwosu · age 79"
            place="Nnewi · Anambra"
            duration="0:48"
            gradient="linear-gradient(135deg, #e17f47, #c85a26 55%, #6d2c4f)"
            tier="oha"
            onClick={onStartLesson}
          />
          <ArchiveRow
            title="The story of ọjị — the kola nut"
            elder="Papa Emeka Okafor · age 83"
            place="Nnewi · Anambra"
            duration="11:20"
            gradient="linear-gradient(135deg, #d9a019, #c85a26)"
            tier="oha"
          />
          <ArchiveRow
            title="Ịgba nkwụ — the wine-carrying song"
            elder="Mama Nneka · age 71"
            place="Onitsha · Anambra"
            duration="3:12"
            gradient="linear-gradient(135deg, #2e5d3a, #1a120b)"
            tier="umunna"
          />
        </div>
      </div>
    </div>
  );
}

function ArchiveRow({ title, elder, place, duration, gradient, tier, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 18, padding: 12,
      cursor: onClick ? 'pointer' : 'default', display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="play" size={16} color="#faf5ec" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: NnooTheme.ink900, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink700, marginTop: 2 }}>{elder}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>{place} · {duration}</div>
          <ConsentBadge tier={tier} />
        </div>
      </div>
    </div>
  );
}

// ——— Proverb reveal bottom sheet ———
function ProverbSheet({ onClose }) {
  const [reveal, setReveal] = React.useState(0); // 0=igbo, 1=+translation, 2=+gloss
  return (
    <BottomSheet onClose={onClose}>
      <Eyebrow>Ilu · a proverb</Eyebrow>
      <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 28, color: NnooTheme.ink900, lineHeight: 1.25, marginTop: 10, letterSpacing: '-0.01em' }}>
        "Otu onye anaghị azụ nwata."
      </div>
      <button onClick={() => { const a = new Audio(); }} style={{
        marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 999, background: NnooTheme.clay100, color: NnooTheme.claySoftFg,
        border: 'none', fontFamily: NnooTheme.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>
        <Icon name="play" size={12} color={NnooTheme.claySoftFg} /> Mama Ada speaks · 0:06
      </button>

      {reveal >= 1 && (
        <div style={{ marginTop: 18, fontFamily: NnooTheme.fontBody, fontSize: 16, color: NnooTheme.ink700, lineHeight: 1.55 }}>
          One person does not raise a child.
        </div>
      )}
      {reveal >= 2 && (
        <div style={{ marginTop: 14, padding: 14, background: NnooTheme.raised, borderRadius: 14, borderLeft: `3px solid ${NnooTheme.forest}` }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600, color: NnooTheme.ink500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>What it means</div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink900, marginTop: 6, lineHeight: 1.55 }}>
            A child grows with the whole community — aunties, cousins, neighbors, elders. No parent carries that weight alone. Often said when someone offers help with a child without being asked.
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
        <NnooChip tone="forest">Nnewi dialect</NnooChip>
        <ConsentBadge tier="oha" />
      </div>

      <div style={{ marginTop: 10 }}>
        <ElderAttribution
          name={ELDER_ADA.name}
          village={`${ELDER_ADA.village} · Anambra`}
          age={ELDER_ADA.age}
          dialect={ELDER_ADA.dialect}
          initial={ELDER_ADA.initial}
          gradient={ELDER_ADA.gradient}
          compact
        />
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
        {reveal < 2 ? (
          <NnooButton fullWidth size="lg" onClick={() => setReveal(r => r + 1)}>
            {reveal === 0 ? 'Show translation' : 'What does it mean?'}
          </NnooButton>
        ) : (
          <NnooButton fullWidth size="lg" variant="outline" onClick={onClose}>Close</NnooButton>
        )}
      </div>
    </BottomSheet>
  );
}

// ——— Lesson flow: 4 steps — listen → shape → practice → feedback ———
function LessonScreen({ onComplete, onBack }) {
  // step: 0 intro, 1 listen to elder, 2 try yourself, 3 feedback (close), 4 feedback (good), 5 complete
  const [step, setStep] = React.useState(1);
  const [recording, setRecording] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);

  const goRecord = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setAttempts(a => a + 1);
      setStep(attempts === 0 ? 3 : 4);
    }, 1800);
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 40 }}>
      {/* progress header */}
      <div style={{ padding: '62px 20px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: NnooTheme.raised, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={18} color={NnooTheme.ink900} />
        </button>
        <div style={{ flex: 1, height: 6, background: NnooTheme.sand, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, step * 22)}%`, background: NnooTheme.clay, borderRadius: 999, transition: 'width 400ms' }} />
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, fontWeight: 600, color: NnooTheme.ink500 }}>Step {Math.min(4, step)} / 4</div>
      </div>

      <div style={{ padding: '28px 20px 16px 20px', flex: 1 }}>
        {/* The word — always visible */}
        <div style={{ textAlign: 'center' }}>
          <Eyebrow>Okwu · the word</Eyebrow>
          <div className="igbo" style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 92, color: NnooTheme.ink900, letterSpacing: '-0.035em', marginTop: 10, lineHeight: 1 }}>
            ụlọ
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 15, color: NnooTheme.ink500, marginTop: 6 }}>
            /ū.lɔ́/ · house, home
          </div>
        </div>

        {/* Step 1 — elder speaks */}
        {step === 1 && (
          <div style={{ marginTop: 22 }}>
            <NnooCard padding={16}>
              <Eyebrow>Your grandmother said it first</Eyebrow>
              <div style={{ marginTop: 12 }}>
                <ElderAttribution
                  name={ELDER_ADA.name} village={`${ELDER_ADA.village} · Anambra`} age={ELDER_ADA.age} dialect={ELDER_ADA.dialect}
                  initial={ELDER_ADA.initial} gradient={ELDER_ADA.gradient} compact
                />
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <button style={{
                  width: 44, height: 44, borderRadius: 999, background: NnooTheme.clay, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                }}>
                  <Icon name="play" size={14} color="#faf5ec" />
                </button>
                <div style={{ flex: 1 }}>
                  <Waveform progress={0.35} bars={32} />
                </div>
                <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, minWidth: 32, textAlign: 'right' }}>0:04</div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                <ConsentBadge tier="oha" />
                <NnooChip tone="neutral">Recorded 2026</NnooChip>
              </div>
            </NnooCard>

            <div style={{ marginTop: 18, textAlign: 'center', fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink500, lineHeight: 1.5 }}>
              Listen three times before you try. There is no hurry.
            </div>

            <div style={{ marginTop: 20 }}>
              <NnooButton fullWidth size="lg" onClick={() => setStep(2)}>Now you try</NnooButton>
            </div>
          </div>
        )}

        {/* Step 2 — try yourself, tone target visible but no learner line yet */}
        {step === 2 && (
          <div style={{ marginTop: 20 }}>
            <NnooCard padding={14}>
              <Eyebrow>Tone shape to match</Eyebrow>
              <PitchContour target={TARGET_ULO} learner={null} recording={false} />
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 4, lineHeight: 1.5 }}>
                Low tone on <b className="igbo" style={{ fontFamily: NnooTheme.fontDisplay }}>ụ</b>, rising to high on <b className="igbo" style={{ fontFamily: NnooTheme.fontDisplay }}>lọ́</b>.
              </div>
            </NnooCard>

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {recording && <div style={{ width: '70%' }}><LiveWaveform recording={true} bars={28} /></div>}
              <button onClick={goRecord} style={{
                width: 96, height: 96, borderRadius: 999,
                background: recording ? NnooTheme.danger : NnooTheme.clay,
                border: '4px solid ' + NnooTheme.paper,
                boxShadow: '0 14px 40px rgba(58,24,9,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Icon name="mic" size={34} color="#faf5ec" />
              </button>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink500 }}>
                {recording ? 'Listening…' : 'Hold to say it'}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — first attempt: close, gentle re-invitation */}
        {step === 3 && (
          <div style={{ marginTop: 20 }}>
            <NnooCard padding={14}>
              <Eyebrow>Your tone vs hers</Eyebrow>
              <PitchContour target={TARGET_ULO} learner={LEARNER_CLOSE} recording={false} />
            </NnooCard>

            <div style={{ marginTop: 14, padding: 16, background: NnooTheme.marigold100, borderRadius: 14, borderLeft: `3px solid ${NnooTheme.marigold}` }}>
              <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 18, color: NnooTheme.ink900 }}>
                Fọdụrụ ntakịrị.
              </div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700, marginTop: 4, lineHeight: 1.55 }}>
                A little more. Your pitch stayed flat where hers rose at the end. Try lifting the second syllable.
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <NnooButton variant="outline" size="lg" onClick={() => { setStep(1); setAttempts(0); }}>
                Hear again
              </NnooButton>
              <NnooButton size="lg" fullWidth onClick={() => setStep(2)}>Try once more</NnooButton>
            </div>
          </div>
        )}

        {/* Step 4 — second attempt: good */}
        {step === 4 && (
          <div style={{ marginTop: 20 }}>
            <NnooCard padding={14}>
              <Eyebrow>Your tone vs hers</Eyebrow>
              <PitchContour target={TARGET_ULO} learner={LEARNER_GOOD} recording={false} />
            </NnooCard>

            <div style={{ marginTop: 14, padding: 16, background: NnooTheme.forest100, borderRadius: 14, borderLeft: `3px solid ${NnooTheme.forest}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="check" size={20} color={NnooTheme.forest} />
              <div>
                <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 20, color: '#153a1f' }}>Ọ dị mma.</div>
                <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: '#153a1f', marginTop: 4, lineHeight: 1.5 }}>
                  You said it. Your tone rose where hers rose — that's the word for home.
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 16, background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 14 }}>
              <Eyebrow>A short word, from Mama Ada</Eyebrow>
              <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 17, color: NnooTheme.ink900, marginTop: 8, lineHeight: 1.45 }}>
                "Ụlọ ka ọma. Ebe onye bi, ebe ahụ bụ ụlọ ya."
              </div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 6, lineHeight: 1.5 }}>
                Home is good. Where a person lives, that place is their home.
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <NnooButton fullWidth size="lg" onClick={onComplete}>Gaa n'ihu · next word</NnooButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ——— Archive ———
function ArchiveScreen({ onBack, onOpenRecording, onOpenNso }) {
  const [tab, setTab] = React.useState('all');
  const recordings = [
    { id: 'ulo', title: 'How we say the word for home', elder: 'Mama Ada Nwosu · age 79', place: 'Nnewi · Anambra', dur: '0:48', gradient: 'linear-gradient(135deg, #e17f47, #c85a26 55%, #6d2c4f)', tier: 'oha', kind: 'proverb' },
    { id: 'oji', title: 'The story of ọjị — the kola nut', elder: 'Papa Emeka Okafor · age 83', place: 'Nnewi · Anambra', dur: '11:20', gradient: 'linear-gradient(135deg, #d9a019, #c85a26)', tier: 'oha', kind: 'story' },
    { id: 'igbankwu', title: 'Ịgba nkwụ — the wine-carrying song', elder: 'Mama Nneka · age 71', place: 'Onitsha · Anambra', dur: '3:12', gradient: 'linear-gradient(135deg, #2e5d3a, #1a120b)', tier: 'umunna', kind: 'song' },
    { id: 'tortoise', title: 'Why the tortoise has a cracked shell', elder: 'Papa Okoro · age 88', place: 'Abakaliki · Ebonyi', dur: '6:40', gradient: 'linear-gradient(135deg, #6d2c4f, #2e5d3a)', tier: 'oha', kind: 'story' },
    { id: 'mmanwu', title: 'The internal words of Mmanwụ', elder: 'Restricted — metadata only', place: 'Umudioka · Anambra', dur: '—', gradient: 'linear-gradient(135deg, #1a120b, #421630)', tier: 'nso', kind: 'restricted' },
    { id: 'ofenkwu', title: 'Ofe nsala — a wedding soup', elder: 'Auntie Chinwe · age 62', place: 'Owerri · Imo', dur: '8:24', gradient: 'linear-gradient(135deg, #d9a019, #6d2c4f)', tier: 'oha', kind: 'recipe' },
  ];
  const filtered = tab === 'all' ? recordings : recordings.filter(r => r.kind === tab);

  return (
    <div>
      <div style={{ padding: '62px 20px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: NnooTheme.raised, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={18} color={NnooTheme.ink900} />
        </button>
        <div style={{ flex: 1 }}>
          <Eyebrow>The archive</Eyebrow>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 28, color: NnooTheme.ink900, letterSpacing: '-0.02em' }}>Ọbá</div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 999, background: NnooTheme.raised, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="search" size={18} color={NnooTheme.ink900} />
        </button>
      </div>

      <div style={{ padding: '12px 20px 0 20px' }}>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink500, marginBottom: 10 }}>
          <b style={{ color: NnooTheme.ink900 }}>2,317 recordings</b> · 184 elders · 47 hometowns
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all','All'],['proverb','Proverbs'],['story','Stories'],['recipe','Recipes'],['song','Songs'],['restricted','Nsọ']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              fontFamily: NnooTheme.fontBody, fontWeight: 600, fontSize: 12,
              padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap',
              background: tab === id ? NnooTheme.clay100 : NnooTheme.paper,
              color: tab === id ? NnooTheme.claySoftFg : NnooTheme.ink700,
              border: `1px solid ${tab === id ? 'transparent' : '#e8dfc9'}`, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 20px 140px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => (
          <div key={r.id} onClick={() => r.tier === 'nso' ? onOpenNso() : onOpenRecording(r)} style={{
            background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 18, padding: 14,
            cursor: 'pointer', display: 'flex', gap: 12,
            opacity: r.tier === 'nso' ? 0.78 : 1,
          }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: r.gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {r.tier === 'nso' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#faf5ec" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              ) : (
                <Icon name="play" size={16} color="#faf5ec" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 15, color: NnooTheme.ink900, lineHeight: 1.3 }}>{r.title}</div>
              <div style={{ fontFamily: NnooTheme.fontArchive, fontSize: 13, color: NnooTheme.ink700, marginTop: 3 }}>{r.elder}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>{r.place} · {r.dur}</span>
                <ConsentBadge tier={r.tier} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ——— Recording detail view ———
function RecordingDetail({ rec, onBack }) {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0.22);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress(p => p >= 1 ? 0 : p + 0.01), 200);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div>
      {/* hero */}
      <div style={{ background: rec.gradient, padding: '62px 20px 28px 20px', position: 'relative' }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(250,245,236,0.25)', backdropFilter: 'blur(12px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={18} color="#faf5ec" />
        </button>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: 'rgba(250,245,236,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>From Nnewi · Anambra</div>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 30, color: '#faf5ec', marginTop: 8, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {rec.title}
          </div>
          <div style={{ marginTop: 10 }}><ConsentBadge tier={rec.tier} size="md" /></div>
        </div>
      </div>

      {/* player */}
      <div style={{ padding: '18px 20px 0' }}>
        <NnooCard padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setPlaying(p => !p)} style={{
              width: 56, height: 56, borderRadius: 999, background: NnooTheme.clay, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}>
              <Icon name={playing ? 'pause' : 'play'} size={18} color="#faf5ec" />
            </button>
            <div style={{ flex: 1 }}>
              <Waveform progress={progress} bars={44} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>
                <span>{Math.floor(progress * (rec.durS || 48) / 60).toString().padStart(1,'0')}:{Math.floor(progress * (rec.durS || 48) % 60).toString().padStart(2,'0')}</span>
                <span>{rec.dur}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button style={iconBtn}><Icon name="heart" size={16} color={NnooTheme.ink700} /></button>
            <button style={iconBtn}><Icon name="share" size={16} color={NnooTheme.ink700} /></button>
            <button style={iconBtn}><Icon name="book" size={16} color={NnooTheme.ink700} /></button>
            <div style={{ marginLeft: 'auto', fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, alignSelf: 'center' }}>Cached offline</div>
          </div>
        </NnooCard>
      </div>

      {/* transcript excerpt */}
      <div style={{ padding: '16px 20px 0' }}>
        <Eyebrow>Transcript · Nnewi dialect</Eyebrow>
        <div style={{ marginTop: 8, padding: 16, background: NnooTheme.raised, borderRadius: 14 }}>
          <div className="igbo" style={{ fontFamily: NnooTheme.fontArchive, fontSize: 17, color: NnooTheme.ink900, lineHeight: 1.55 }}>
            "Ụlọ. Ụ-lọ́. Lee, anya gị gbadata, ekwu ya nwayọọ. Ụlọ bụ ebe ị na-alaghachi. Ọ bụghị nanị ime ụlọ — ọ bụ ndị nọ n'ime."
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 10, lineHeight: 1.55 }}>
            Ụlọ. Ụ-lọ́. See, let your eye come down, say it softly. Home is the place you return to. Not only the inside of a house — but the people who are in it.
          </div>
        </div>
      </div>

      {/* provenance */}
      <div style={{ padding: '16px 20px 140px' }}>
        <Eyebrow>Provenance</Eyebrow>
        <div style={{ marginTop: 8, padding: 16, background: NnooTheme.paper, borderRadius: 14, border: '1px solid #e8dfc9' }}>
          <ElderAttribution
            name={ELDER_ADA.name} village={`${ELDER_ADA.village} · Anambra`} age={ELDER_ADA.age} dialect={ELDER_ADA.dialect}
            initial={ELDER_ADA.initial} gradient={ELDER_ADA.gradient} compact
          />
          <div style={{ height: 1, background: NnooTheme.ink100, margin: '14px 0' }} />
          <ProvenanceChain items={[
            { label: 'Contributor', value: 'Mama Ada Nwosu', detail: 'Nnewi, Anambra · age 79' },
            { label: 'Umunna', value: 'Umu-Dioka lineage', detail: 'Central Nnewi' },
            { label: 'Facilitator', value: 'Chinyere Okeke', detail: 'Recorded on an iPad, in her compound' },
            { label: 'Cultural custodian', value: 'Prof. Chidi Onyeama', detail: 'Validated Oct 12, 2026' },
            { label: 'Contributor payment', value: '₦15,000 · acknowledged', detail: 'Every elder recording is compensated' },
            { label: 'Consent', value: 'Ọha — public', detail: 'Mama Ada chose: anyone may listen' },
          ]} />
        </div>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 36, height: 36, borderRadius: 999, background: NnooTheme.raised, border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

// ——— Nsọ gate ———
function NsoGate({ onBack }) {
  return (
    <div style={{ minHeight: '100%', background: NnooTheme.ink900, color: '#faf5ec', paddingBottom: 140 }}>
      <div style={{ padding: '62px 20px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(250,245,236,0.12)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={18} color="#faf5ec" />
        </button>
      </div>

      <div style={{ padding: '28px 24px 0 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: NnooTheme.plum, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#faf5ec" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: 'rgba(250,245,236,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginTop: 20 }}>Nsọ · sacred</div>
        <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 36, marginTop: 8, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          This one is not for listening.
        </div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 16, color: 'rgba(250,245,236,0.82)', marginTop: 16, lineHeight: 1.6 }}>
          The internal words of Mmanwụ are restricted — they belong to those who have walked that initiation. We keep the record here, named and dated, but we do not host the sound. This is how the tradition has always held the line between public and interior knowledge.
        </div>

        <div style={{ marginTop: 24, padding: 16, background: 'rgba(250,245,236,0.06)', borderRadius: 14 }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600, color: 'rgba(250,245,236,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>What we do keep</div>
          <div style={{ marginTop: 10, fontFamily: NnooTheme.fontBody, fontSize: 14, color: '#faf5ec', lineHeight: 1.7 }}>
            <div>· Title · <span style={{ opacity: 0.8 }}>"The internal words of Mmanwụ"</span></div>
            <div>· Location · <span style={{ opacity: 0.8 }}>Umudioka, Anambra</span></div>
            <div>· Contributor · <span style={{ opacity: 0.8 }}>Named, held with custodians</span></div>
            <div>· Length · <span style={{ opacity: 0.8 }}>14 min 22 sec</span></div>
            <div>· Custodian · <span style={{ opacity: 0.8 }}>Chief Nwachukwu of Umudioka</span></div>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: 16, border: '1px solid rgba(250,245,236,0.2)', borderRadius: 14 }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: 'rgba(250,245,236,0.82)', lineHeight: 1.55 }}>
            If you are from Umudioka and have walked this road, a custodian can verify you and open the hearing.
          </div>
          <button style={{
            marginTop: 12, background: 'transparent', border: '1.5px solid rgba(250,245,236,0.3)',
            color: '#faf5ec', fontFamily: NnooTheme.fontDisplay, fontSize: 14, fontWeight: 600,
            padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
          }}>
            Request path to custodian
          </button>
        </div>

        <div style={{ marginTop: 18, fontFamily: NnooTheme.fontBody, fontSize: 11, color: 'rgba(250,245,236,0.5)', lineHeight: 1.6 }}>
          Modeled on Mukurtu CMS and Local Contexts TK Labels. This is not a paywall — it is a threshold.
        </div>
      </div>
    </div>
  );
}

// ——— Ọha community + kin map ———
function OhaScreen({ onBack }) {
  const [tab, setTab] = React.useState('home');
  const nnewiPeople = [
    { x: 100, y: 110, home: true, label: 'Nnewi' },
    { x: 118, y: 100 }, { x: 112, y: 118 }, { x: 128, y: 112 }, { x: 106, y: 96 },
    { x: 122, y: 130 }, { x: 140, y: 118 }, { x: 132, y: 92 },
    { x: 180, y: 60 }, { x: 210, y: 90 }, { x: 196, y: 130 }, { x: 220, y: 150 },
    { x: 82, y: 150 }, { x: 70, y: 90 }, { x: 90, y: 72 },
  ];

  return (
    <div>
      <div style={{ padding: '62px 20px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: NnooTheme.raised, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={18} color={NnooTheme.ink900} />
        </button>
        <div style={{ flex: 1 }}>
          <Eyebrow>Community</Eyebrow>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 28, color: NnooTheme.ink900, letterSpacing: '-0.02em' }}>Ọha</div>
        </div>
      </div>

      {/* segmented */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', gap: 6, background: NnooTheme.raised, borderRadius: 12, padding: 4 }}>
          {[['home','From Nnewi'], ['map','Map']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === id ? NnooTheme.paper : 'transparent',
              fontFamily: NnooTheme.fontBody, fontWeight: 600, fontSize: 13,
              color: tab === id ? NnooTheme.ink900 : NnooTheme.ink500,
              boxShadow: tab === id ? '0 2px 6px rgba(58,24,9,0.06)' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {tab === 'home' && (
        <>
          <div style={{ padding: '16px 20px 0' }}>
            <NnooCard tone="cream" padding={18}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon name="mapPin" size={18} color={NnooTheme.plum} />
                <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 15, color: NnooTheme.ink900 }}>Nnewi · your hometown</div>
              </div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700, marginTop: 8, lineHeight: 1.55 }}>
                <b style={{ color: NnooTheme.ink900 }}>127 people</b> from Nnewi are in Ọha. 34 in London, 28 in Atlanta, 19 in Lagos, 14 in Houston.
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <NnooChip tone="plum">12 elders</NnooChip>
                <NnooChip tone="neutral">Central dialect</NnooChip>
              </div>
            </NnooCard>
          </div>

          <div style={{ padding: '16px 20px 140px' }}>
            <Eyebrow>From your hometown · today</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {[
                { who: 'Adaeze O.', when: '2h', place: 'London', body: 'Does anyone remember the song grandmothers sang at ịgba nkwụ? My mother only remembers the first line.', reply: 4 },
                { who: 'Ikem N.',   when: '6h', place: 'Atlanta', body: 'Recorded my father this weekend — an hour of stories about growing up in Nnewi before the war. Adding to Ọbá with his permission.', reply: 11 },
                { who: 'Uzoma E.',  when: '1d', place: 'Lagos',   body: 'Sponsoring a recording session with Chief Nwachukwu next month. Four seats. Who wants to contribute ₦5k?', reply: 23, badge: true },
              ].map((p, i) => (
                <NnooCard key={i} padding={14}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 999, background: NnooTheme.plum100, color: NnooTheme.plum, fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.who[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: NnooTheme.ink900 }}>{p.who}</div>
                        {p.badge && <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 10, fontWeight: 700, color: '#153a1f', background: NnooTheme.forest100, padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ndụmọdụ</span>}
                      </div>
                      <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>{p.place} · {p.when} ago</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700, marginTop: 10, lineHeight: 1.55 }}>{p.body}</div>
                  <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.clay, fontWeight: 600, marginTop: 10 }}>{p.reply} replies →</div>
                </NnooCard>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'map' && (
        <div style={{ padding: '16px 20px 140px' }}>
          <NnooCard padding={14}>
            <Eyebrow>Kin map · Igboland</Eyebrow>
            <div style={{ marginTop: 10, background: NnooTheme.bg, borderRadius: 14, padding: 10 }}>
              <IgbolandMap hometown="Nnewi" people={nnewiPeople} />
            </div>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 10, lineHeight: 1.55 }}>
              Each dot is an Ọha member. Larger dot is your hometown. Members choose whether to appear on the map — many stay anonymous.
            </div>
          </NnooCard>

          <div style={{ marginTop: 14 }}>
            <NnooCard padding={14} tone="cream">
              <Eyebrow>Diaspora where you are</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {[['London, UK', 34], ['Atlanta, GA', 28], ['Lagos', 19], ['Houston, TX', 14], ['Toronto', 9]].map(([city, n]) => (
                  <div key={city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${NnooTheme.ink100}` }}>
                    <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink900 }}>{city}</div>
                    <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: NnooTheme.clay }}>{n}</div>
                  </div>
                ))}
              </div>
            </NnooCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ——— Bottom sheet ———
function BottomSheet({ children, onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26, 18, 11, 0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: NnooTheme.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '12px 20px 32px', maxHeight: '88%', overflow: 'auto',
        animation: 'sheetIn 420ms cubic-bezier(0.2, 0.7, 0.2, 1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: NnooTheme.ink100, margin: '0 auto 18px' }} />
        {children}
      </div>
      <style>{`@keyframes sheetIn { from { transform: translateY(30%); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ——— "You" / profile tab (minimal) ———
function YouScreen({ onBack }) {
  return (
    <div>
      <div style={{ padding: '62px 20px 0 20px' }}>
        <Eyebrow>Your path</Eyebrow>
        <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 28, color: NnooTheme.ink900, letterSpacing: '-0.02em' }}>Chinyere Okeke</div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 14, color: NnooTheme.ink700, marginTop: 4 }}>From Nnewi · living in London</div>
      </div>

      <div style={{ padding: '20px 20px 140px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[['12','day streak'],['47','words learned'],['9','elders heard']].map(([n, l], i) => (
            <div key={i} style={{ background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 16, padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 28, color: NnooTheme.clay, letterSpacing: '-0.02em' }}>{n}</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        <NnooCard padding={16} tone="cream">
          <Eyebrow>Your dialect</Eyebrow>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 18, color: NnooTheme.ink900, marginTop: 6 }}>Nnewi central</div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 4, lineHeight: 1.55 }}>
            Lessons prefer elders from Nnewi and neighboring towns. Your lessons show the tone shapes that match how your grandmother speaks.
          </div>
        </NnooCard>

        <NnooCard padding={16}>
          <Eyebrow>A word from today</Eyebrow>
          <div className="igbo" style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 40, color: NnooTheme.ink900, marginTop: 10, letterSpacing: '-0.02em' }}>ụlọ</div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink500, marginTop: 2 }}>house, home · heard from Mama Ada, Nnewi</div>
        </NnooCard>

        <NnooCard padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: NnooTheme.marigold100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="mic" size={18} color="#684809" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 15, color: NnooTheme.ink900 }}>Become a facilitator</div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500 }}>Record elders in your hometown</div>
            </div>
            <Icon name="chevronR" size={18} color={NnooTheme.ink500} />
          </div>
        </NnooCard>
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, LessonScreen, ArchiveScreen, RecordingDetail, NsoGate, OhaScreen, YouScreen,
  ProverbSheet, BottomSheet, ELDER_ADA,
});
