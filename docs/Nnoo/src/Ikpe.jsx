// Ikpe — the validation council. Community votes & comments on recordings
// submitted by facilitators. Passes only go live to Ọbá/Ọha.
// "Igbo enwe eze" — the people decide.

// Sample pending queue
const IKPE_PENDING = [
  {
    id: 'q1',
    title: 'The story of ọjị — the kola nut',
    elder: 'Papa Emeka Okafor · age 83',
    place: 'Nnewi · Anambra',
    dialect: 'Nnewi central',
    dur: '11:20',
    tier: 'oha',
    gradient: 'linear-gradient(135deg, #d9a019, #c85a26)',
    facilitator: 'Chinyere Okeke',
    submitted: '2 days ago',
    votes: { keep: 47, wait: 3, no: 1 },
    quorum: { got: 51, need: 60, nnewi: 34, kinNeeded: 40 },
    comments: [
      { who: 'Uzoma E.', where: 'Nnewi · Lagos', elder: false, age: '1d', body: 'I grew up hearing exactly this telling. The order of the four segments is how my grandfather said it.' },
      { who: 'Mama Ngozi', where: 'Nnewi · Nnewi', elder: true, age: '6h', body: 'Papa Emeka speaks well. But at 4:12 he says "ome-n\'ala" — in Nnewi central we usually say "ọmenala". Both are correct. Consider a note in the transcript.', hearts: 18 },
      { who: 'Ikem N.', where: 'Nnewi · Atlanta', elder: false, age: '3h', body: 'Ọ dị mma. This should go live.' },
    ],
  },
  {
    id: 'q2',
    title: 'Ofe nsala — a wedding soup',
    elder: 'Auntie Chinwe · age 62',
    place: 'Owerri · Imo',
    dialect: 'Owerri',
    dur: '8:24',
    tier: 'oha',
    gradient: 'linear-gradient(135deg, #d9a019, #6d2c4f)',
    facilitator: 'Ebere Nwoke',
    submitted: '5 hours ago',
    votes: { keep: 12, wait: 0, no: 0 },
    quorum: { got: 12, need: 40, owerri: 9, kinNeeded: 25 },
    comments: [
      { who: 'Chioma A.', where: 'Owerri · Houston', elder: false, age: '3h', body: 'Finally — the way my mother makes it. Thank you, Auntie Chinwe.' },
    ],
  },
  {
    id: 'q3',
    title: 'Ilu about patience — "Nwayọọ bụ ije"',
    elder: 'Mama Adaeze · age 74',
    place: 'Enugu · Enugu',
    dialect: 'Enugu',
    dur: '1:08',
    tier: 'oha',
    gradient: 'linear-gradient(135deg, #2e5d3a, #1a120b)',
    facilitator: 'Kelechi Eze',
    submitted: '4 days ago',
    votes: { keep: 63, wait: 2, no: 0 },
    quorum: { got: 65, need: 40, enugu: 42, kinNeeded: 25 },
    passed: true,
    comments: [],
  },
];

function IkpeScreen({ onBack, onOpenCase }) {
  const [filter, setFilter] = React.useState('pending');

  const pending = IKPE_PENDING.filter(q => !q.passed);
  const passed = IKPE_PENDING.filter(q => q.passed);
  const list = filter === 'pending' ? pending : passed;

  return (
    <div>
      <div style={{ padding: '62px 20px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: NnooTheme.raised, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={18} color={NnooTheme.ink900} />
        </button>
        <div style={{ flex: 1 }}>
          <Eyebrow>The council</Eyebrow>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 28, color: NnooTheme.ink900, letterSpacing: '-0.02em' }}>Ikpe</div>
        </div>
      </div>

      {/* Banner */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ padding: 16, background: NnooTheme.raised, borderRadius: 16, borderLeft: `4px solid ${NnooTheme.plum}` }}>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontStyle: 'italic', fontSize: 17, color: NnooTheme.ink900, lineHeight: 1.35 }}>
            "Igbo enwe eze."
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 6, lineHeight: 1.55 }}>
            The Igbo have no king. Every recording waits here until the people — especially kin from the same hometown — decide it is ready.
          </div>
        </div>
      </div>

      {/* Segmented */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', gap: 6, background: NnooTheme.raised, borderRadius: 12, padding: 4 }}>
          {[['pending', `Pending · ${pending.length}`], ['passed', `Passed · ${passed.length}`]].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: filter === id ? NnooTheme.paper : 'transparent',
              fontFamily: NnooTheme.fontBody, fontWeight: 600, fontSize: 13,
              color: filter === id ? NnooTheme.ink900 : NnooTheme.ink500,
              boxShadow: filter === id ? '0 2px 6px rgba(58,24,9,0.06)' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 20px 140px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map(q => (
          <IkpeCaseCard key={q.id} q={q} onClick={() => onOpenCase(q)} />
        ))}
      </div>
    </div>
  );
}

function IkpeCaseCard({ q, onClick }) {
  const total = q.votes.keep + q.votes.wait + q.votes.no;
  const keepPct = total ? (q.votes.keep / total) * 100 : 0;
  const kinPct = Math.min(100, (q.quorum.got / q.quorum.need) * 100);

  return (
    <div onClick={onClick} style={{
      background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 18, padding: 14,
      cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: q.gradient, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="mic" size={18} color="#faf5ec" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 15, color: NnooTheme.ink900, lineHeight: 1.3 }}>{q.title}</div>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontSize: 13, color: NnooTheme.ink700, marginTop: 3 }}>{q.elder}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>{q.place} · {q.dur}</span>
            <ConsentBadge tier={q.tier} />
          </div>
        </div>
      </div>

      {/* Vote tally */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600, color: NnooTheme.ink500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kin quorum</div>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontSize: 13, fontWeight: 600, color: NnooTheme.ink900 }}>
            {q.quorum.got} / {q.quorum.need}
          </div>
        </div>
        <div style={{ height: 8, background: NnooTheme.raised, borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${kinPct}%`, background: kinPct >= 100 ? NnooTheme.forest : NnooTheme.clay, transition: 'width 300ms' }} />
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink700 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: NnooTheme.forest }} /> {q.votes.keep} keep
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: NnooTheme.marigold }} /> {q.votes.wait} wait
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: NnooTheme.danger }} /> {q.votes.no} no
          </span>
          <span style={{ marginLeft: 'auto', color: NnooTheme.ink500 }}>{q.submitted}</span>
        </div>
      </div>

      {q.passed && (
        <div style={{ padding: 10, background: NnooTheme.forest100, borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="check" size={14} color={NnooTheme.forest} />
          <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: '#153a1f', fontWeight: 600 }}>Passed — live in Ọbá</span>
        </div>
      )}
    </div>
  );
}

function IkpeCaseDetail({ q, onBack }) {
  const [voted, setVoted] = React.useState(null);
  const total = q.votes.keep + q.votes.wait + q.votes.no + (voted ? 1 : 0);
  const liveVotes = {
    keep: q.votes.keep + (voted === 'keep' ? 1 : 0),
    wait: q.votes.wait + (voted === 'wait' ? 1 : 0),
    no: q.votes.no + (voted === 'no' ? 1 : 0),
  };
  const kinGot = q.quorum.got + (voted ? 1 : 0);
  const kinPct = Math.min(100, (kinGot / q.quorum.need) * 100);

  return (
    <div>
      {/* hero */}
      <div style={{ background: q.gradient, padding: '62px 20px 24px 20px' }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(250,245,236,0.25)', backdropFilter: 'blur(12px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={18} color="#faf5ec" />
        </button>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: 'rgba(250,245,236,0.85)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Ikpe · under review</div>
          <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 26, color: '#faf5ec', marginTop: 8, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {q.title}
          </div>
          <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: 'rgba(250,245,236,0.85)', marginTop: 8 }}>
            {q.elder} · {q.place}
          </div>
        </div>
      </div>

      {/* Player */}
      <div style={{ padding: '16px 20px 0' }}>
        <NnooCard padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ width: 48, height: 48, borderRadius: 999, background: NnooTheme.clay, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Icon name="play" size={16} color="#faf5ec" />
            </button>
            <div style={{ flex: 1 }}>
              <Waveform progress={0.22} bars={40} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>
                <span>0:00</span><span>{q.dur}</span>
              </div>
            </div>
          </div>
        </NnooCard>
      </div>

      {/* The question */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ padding: 16, background: NnooTheme.raised, borderRadius: 14, borderLeft: `3px solid ${NnooTheme.plum}` }}>
          <Eyebrow>Before you vote · what Ikpe asks</Eyebrow>
          <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, lineHeight: 1.7 }}>
            <li>· Is the telling true to how you heard it at home?</li>
            <li>· Is the elder's consent honored — including who can listen?</li>
            <li>· Are names, places, and dialect labeled correctly?</li>
            <li>· Would this make your grandmother proud to sit beside?</li>
          </ul>
        </div>
      </div>

      {/* Vote */}
      <div style={{ padding: '16px 20px 0' }}>
        <Eyebrow>Your voice</Eyebrow>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <VoteButton label="Keep it" sub="It is ready" tone="forest" active={voted === 'keep'} onClick={() => setVoted('keep')} />
          <VoteButton label="Wait" sub="Needs more" tone="marigold" active={voted === 'wait'} onClick={() => setVoted('wait')} />
          <VoteButton label="No" sub="Don't publish" tone="danger" active={voted === 'no'} onClick={() => setVoted('no')} />
        </div>
        {voted && (
          <div style={{ marginTop: 10, fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, lineHeight: 1.55 }}>
            Your voice counts once. You are from Nnewi — it counts toward kin quorum. You can change it until the case closes.
          </div>
        )}
      </div>

      {/* Tally */}
      <div style={{ padding: '16px 20px 0' }}>
        <NnooCard padding={14}>
          <Eyebrow>The council so far</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700 }}>Kin from {q.place.split(' · ')[0]}</span>
              <span style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: NnooTheme.ink900 }}>{kinGot} / {q.quorum.need}</span>
            </div>
            <div style={{ height: 10, background: NnooTheme.raised, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${kinPct}%`, height: '100%', background: kinPct >= 100 ? NnooTheme.forest : NnooTheme.clay, transition: 'width 400ms' }} />
            </div>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500, marginTop: 6, lineHeight: 1.5 }}>
              Ikpe opens to everyone, but a recording only passes when enough kin from the hometown say keep. The people decide — not one custodian.
            </div>
          </div>

          <div style={{ height: 1, background: NnooTheme.ink100, margin: '14px 0' }} />

          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: NnooTheme.raised }}>
            <div style={{ flex: liveVotes.keep, background: NnooTheme.forest }} />
            <div style={{ flex: liveVotes.wait, background: NnooTheme.marigold }} />
            <div style={{ flex: liveVotes.no, background: NnooTheme.danger }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink700 }}>
            <span>{liveVotes.keep} keep</span>
            <span>{liveVotes.wait} wait</span>
            <span>{liveVotes.no} no</span>
          </div>
        </NnooCard>
      </div>

      {/* Comments */}
      <div style={{ padding: '16px 20px 140px' }}>
        <Eyebrow>What people are saying</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {q.comments.map((c, i) => (
            <div key={i} style={{ background: NnooTheme.paper, border: '1px solid #e8dfc9', borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 999, background: c.elder ? NnooTheme.marigold100 : NnooTheme.plum100, color: c.elder ? '#684809' : NnooTheme.plum, fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.who[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 13, color: NnooTheme.ink900 }}>{c.who}</div>
                    {c.elder && <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 9, fontWeight: 700, color: '#684809', background: NnooTheme.marigold100, padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Elder</span>}
                  </div>
                  <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.ink500 }}>{c.where} · {c.age}</div>
                </div>
              </div>
              <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink700, marginTop: 8, lineHeight: 1.55 }}>{c.body}</div>
              {c.hearts ? (
                <div style={{ marginTop: 8, fontFamily: NnooTheme.fontBody, fontSize: 11, color: NnooTheme.clay, fontWeight: 600 }}>
                  ♥ {c.hearts} agreed
                </div>
              ) : null}
            </div>
          ))}
          {q.comments.length === 0 && (
            <div style={{ padding: 14, fontFamily: NnooTheme.fontBody, fontSize: 13, color: NnooTheme.ink500, textAlign: 'center' }}>
              No comments yet. Be first to speak.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VoteButton({ label, sub, tone, active, onClick }) {
  const tones = {
    forest:   { bg: NnooTheme.forest,   fg: '#faf5ec', ring: NnooTheme.forest,   soft: NnooTheme.forest100 },
    marigold: { bg: NnooTheme.marigold, fg: '#1a120b', ring: NnooTheme.marigold, soft: NnooTheme.marigold100 },
    danger:   { bg: NnooTheme.danger,   fg: '#faf5ec', ring: NnooTheme.danger,   soft: '#f5d9d4' },
  }[tone];
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '14px 10px', borderRadius: 14, cursor: 'pointer',
      background: active ? tones.bg : tones.soft,
      border: `2px solid ${active ? tones.ring : 'transparent'}`,
      color: active ? tones.fg : NnooTheme.ink900,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      transition: 'all 180ms',
    }}>
      <span style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 15 }}>{label}</span>
      <span style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, opacity: active ? 0.9 : 0.7 }}>{sub}</span>
    </button>
  );
}

Object.assign(window, { IkpeScreen, IkpeCaseDetail, IKPE_PENDING });
