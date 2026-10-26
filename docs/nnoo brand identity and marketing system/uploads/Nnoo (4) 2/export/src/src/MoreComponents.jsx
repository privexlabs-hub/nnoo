// Extra Nnọọ primitives used by the hero flow.
// Depends on Primitives.jsx being loaded first (NnooTheme, Icon, Eyebrow, NnooCard, NnooChip, NnooButton, Waveform).

// ——— Consent tier badge ———
function ConsentBadge({ tier = 'oha', size = 'sm' }) {
  const t = {
    oha:    { label: 'Ọha',    tone: NnooTheme.forest,  bg: NnooTheme.forest100,  fg: '#153a1f', desc: 'Public · anyone can listen' },
    umunna: { label: 'Umunna', tone: NnooTheme.marigold, bg: NnooTheme.marigold100, fg: '#684809', desc: 'Kin-only · from the same hometown' },
    nso:    { label: 'Nsọ',    tone: NnooTheme.plum,     bg: NnooTheme.plum100,    fg: '#421630', desc: 'Sacred · metadata only' },
  }[tier];
  const fs = size === 'md' ? 13 : 11;
  const pad = size === 'md' ? '6px 12px' : '4px 10px';
  return (
    <span title={t.desc} style={{
      fontFamily: NnooTheme.fontBody, fontWeight: 600, fontSize: fs,
      padding: pad, borderRadius: 999, background: t.bg, color: t.fg,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.tone }} />
      {t.label}
    </span>
  );
}

// ——— Elder attribution card ———
function ElderAttribution({ name, village, age, dialect, initial, gradient, compact = false }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center',
      padding: compact ? 0 : 14, background: compact ? 'transparent' : NnooTheme.raised,
      borderRadius: 16, borderLeft: compact ? 'none' : `4px solid ${NnooTheme.forest}`,
    }}>
      <div style={{
        width: compact ? 44 : 52, height: compact ? 44 : 52, borderRadius: 14,
        background: gradient || 'linear-gradient(135deg, #e17f47, #6d2c4f)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 20, color: '#faf5ec',
      }}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 17, color: NnooTheme.ink900, lineHeight: 1.2 }}>{name}</div>
        <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 3, lineHeight: 1.4 }}>
          {village}{age ? ` · age ${age}` : ''}{dialect ? ` · ${dialect}` : ''}
        </div>
      </div>
    </div>
  );
}

// ——— Provenance chain ———
function ProvenanceChain({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: NnooTheme.forest }} />
            {i < items.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 22, background: NnooTheme.forest100, marginTop: 2 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: i < items.length - 1 ? 10 : 0 }}>
            <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600, color: NnooTheme.ink500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{it.label}</div>
            <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: 14, color: NnooTheme.ink900, marginTop: 2 }}>{it.value}</div>
            {it.detail && <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink700, marginTop: 2 }}>{it.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ——— Pitch contour — elder (ghost) vs learner (clay), animated when recording ———
function PitchContour({ target, learner, recording, bars }) {
  bars = bars || (target ? target.length : 40);
  // target = array of 0..1 heights (normalized). learner = same length, null if not yet recorded.
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(id);
  }, [recording]);

  return (
    <div style={{ position: 'relative', height: 120, padding: '8px 4px' }}>
      {/* Pitch target — elder's curve as a soft marigold path */}
      <svg viewBox={`0 0 ${bars * 10} 100`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 8, width: 'calc(100% - 8px)', height: 'calc(100% - 16px)' }}>
        <defs>
          <linearGradient id="tgtfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={NnooTheme.marigold} stopOpacity="0.28" />
            <stop offset="100%" stopColor={NnooTheme.marigold} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* baseline */}
        <line x1="0" y1="50" x2={bars * 10} y2="50" stroke={NnooTheme.ink100} strokeDasharray="3 4" strokeWidth="1" />
        {/* target filled area */}
        <path d={`M0,${100 - target[0] * 90} ${target.map((h, i) => `L${i * 10},${100 - h * 90}`).join(' ')} L${(target.length - 1) * 10},100 L0,100 Z`} fill="url(#tgtfill)" />
        {/* target stroke */}
        <path d={`M0,${100 - target[0] * 90} ${target.map((h, i) => `L${i * 10},${100 - h * 90}`).join(' ')}`} fill="none" stroke={NnooTheme.marigold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* learner line */}
        {learner && (
          <path
            d={`M0,${100 - learner[0] * 90} ${learner.map((h, i) => `L${i * 10},${100 - h * 90}`).join(' ')}`}
            fill="none" stroke={NnooTheme.clay} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={recording ? `${(tick * 3) % 400} 400` : undefined}
          />
        )}
        {/* recording cursor */}
        {recording && (
          <circle
            cx={((tick * 6) % (bars * 10))}
            cy={learner ? 100 - learner[Math.min(learner.length - 1, Math.floor((tick * 6) % (bars * 10) / 10))] * 90 : 50}
            r="5" fill={NnooTheme.clay}
          />
        )}
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', right: 8, top: 6, display: 'flex', gap: 10, fontFamily: NnooTheme.fontBody, fontSize: 10, fontWeight: 600, color: NnooTheme.ink500 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 2, background: NnooTheme.marigold, borderRadius: 2 }} /> Elder
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 2, background: NnooTheme.clay, borderRadius: 2 }} /> You
        </span>
      </div>
    </div>
  );
}

// ——— Live waveform with pulsing bars while recording ———
function LiveWaveform({ recording, progress = 0, bars = 48 }) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setT(x => x + 1), 90);
    return () => clearInterval(id);
  }, [recording]);
  const heights = React.useMemo(() =>
    Array.from({ length: bars }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.3) * Math.cos(i * 0.7)) * 0.75),
  [bars]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 56, width: '100%' }}>
      {heights.map((h, i) => {
        const played = (i / bars) <= progress;
        let scaleY = 1;
        if (recording) scaleY = 0.4 + Math.abs(Math.sin((t * 0.25) + i * 0.4)) * 0.8;
        const color = recording ? NnooTheme.clay : (played ? NnooTheme.clay : '#d6c8ad');
        return (
          <div key={i} style={{
            flex: 1, height: `${h * scaleY * 100}%`,
            background: color, borderRadius: 2, minHeight: 3,
            transition: recording ? 'height 80ms linear' : 'background 200ms',
          }} />
        );
      })}
    </div>
  );
}

// ——— Igbo market-day living calendar (Eke, Orie, Afọ, Nkwo) ———
function LivingCalendar({ active = 'orie' }) {
  const days = [
    { id: 'eke',  label: 'Eke',  color: NnooTheme.clay,     desc: 'Market of beginnings' },
    { id: 'orie', label: 'Orie', color: NnooTheme.marigold, desc: 'Market of plenty' },
    { id: 'afo',  label: 'Afọ',  color: NnooTheme.forest,   desc: 'Market of harvest' },
    { id: 'nkwo', label: 'Nkwo', color: NnooTheme.plum,     desc: 'Market of gathering' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        {days.map(d => {
          const on = d.id === active;
          return (
            <div key={d.id} style={{
              flex: 1, padding: '14px 8px 12px', textAlign: 'center',
              background: on ? d.color : NnooTheme.paper,
              color: on ? '#faf5ec' : NnooTheme.ink700,
              border: `1px solid ${on ? 'transparent' : '#e8dfc9'}`,
              borderRadius: 14, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ fontFamily: NnooTheme.fontArchive, fontWeight: 500, fontSize: 22, lineHeight: 1 }}>{d.label}</div>
              {on && <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 10, marginTop: 6, opacity: 0.9, letterSpacing: '0.02em' }}>today</div>}
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: NnooTheme.fontBody, fontSize: 12, color: NnooTheme.ink500, marginTop: 10, textAlign: 'center' }}>
        Today is <b style={{ color: NnooTheme.ink900 }}>{days.find(d => d.id === active).label}</b> — {days.find(d => d.id === active).desc.toLowerCase()}.
      </div>
    </div>
  );
}

// ——— Tiny map-of-Igboland SVG with dots for hometowns ———
function IgbolandMap({ hometown = 'Nnewi', people = [] }) {
  // Rough abstract shape of Igboland (Anambra/Imo/Enugu/Ebonyi/Abia). Not a real geo — deliberately stylized.
  return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <radialGradient id="landg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#f3ead8" />
          <stop offset="100%" stopColor="#e8dfc9" />
        </radialGradient>
      </defs>
      {/* land shape */}
      <path d="M60 40 Q100 18 150 24 Q215 22 245 56 Q270 92 248 140 Q222 188 168 196 Q112 206 78 180 Q40 150 38 100 Q40 58 60 40 Z"
            fill="url(#landg)" stroke={NnooTheme.clayDust || '#d6c8ad'} strokeWidth="1.5" />
      {/* rivers — Niger + Cross */}
      <path d="M70 40 Q80 90 70 150 Q68 180 62 196" fill="none" stroke="#9bb3c4" strokeWidth="2" opacity="0.6" />
      <path d="M240 60 Q232 120 248 180" fill="none" stroke="#9bb3c4" strokeWidth="2" opacity="0.6" />

      {/* towns */}
      {people.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.home ? 9 : 5} fill={p.home ? NnooTheme.clay : NnooTheme.plum} opacity={p.home ? 1 : 0.7} />
          {p.home && <circle cx={p.x} cy={p.y} r={14} fill="none" stroke={NnooTheme.clay} strokeWidth="1.5" opacity="0.5">
            <animate attributeName="r" from="10" to="22" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2.4s" repeatCount="indefinite" />
          </circle>}
          {p.home && (
            <text x={p.x + 14} y={p.y + 4} fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="600" fill={NnooTheme.ink900}>{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

Object.assign(window, {
  ConsentBadge, ElderAttribution, ProvenanceChain,
  PitchContour, LiveWaveform, LivingCalendar, IgbolandMap,
});
