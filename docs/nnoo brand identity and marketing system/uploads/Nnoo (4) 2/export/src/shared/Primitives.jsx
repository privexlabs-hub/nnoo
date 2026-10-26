// Nnọọ Learn — mobile UI kit components
// Reusable pieces used across screens. Uses design tokens from ../../colors_and_type.css

const NnooTheme = {
  bg: '#faf5ec', raised: '#f3ead8', paper: '#fff', sand: '#e8dfc9',
  ink900: '#1a120b', ink700: '#3d2e1f', ink500: '#6b5945', ink100: '#d9cfbd',
  clay: '#c85a26', clay600: '#a7471c', clay100: '#fbe4d4', claySoftFg: '#873818',
  marigold: '#d9a019', marigold100: '#fae9b8',
  forest: '#2e5d3a', forest100: '#d0e0d4',
  plum: '#6d2c4f', plum100: '#ebd9e3',
  danger: '#b33a2a',
  fontDisplay: "Outfit, -apple-system, system-ui, sans-serif",
  fontBody:    "'DM Sans', -apple-system, system-ui, sans-serif",
  fontArchive: "Fraunces, Georgia, serif",
};

// ———————————————————————————————————————————————————————————
// Primitives
// ———————————————————————————————————————————————————————————

function NnooButton({ children, variant = 'primary', size = 'md', onClick, icon, fullWidth }) {
  const variants = {
    primary:   { bg: NnooTheme.clay,    fg: '#faf5ec', bd: 'transparent' },
    secondary: { bg: NnooTheme.clay100, fg: NnooTheme.claySoftFg, bd: 'transparent' },
    outline:   { bg: 'transparent',     fg: NnooTheme.ink900, bd: '#d6c8ad' },
    ghost:     { bg: 'transparent',     fg: NnooTheme.ink900, bd: 'transparent' },
    dark:      { bg: NnooTheme.ink900,  fg: '#faf5ec', bd: 'transparent' },
  };
  const sizes = { sm: [13, '8px 14px', 10], md: [15, '12px 20px', 12], lg: [17, '16px 28px', 14] };
  const v = variants[variant]; const [fs, pad, r] = sizes[size];
  return (
    <button onClick={onClick} style={{
      fontFamily: NnooTheme.fontDisplay, fontWeight: 600, fontSize: fs, padding: pad,
      borderRadius: r, background: v.bg, color: v.fg, border: `1.5px solid ${v.bd}`,
      letterSpacing: '-0.005em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
      gap: 8, justifyContent: 'center', width: fullWidth ? '100%' : undefined,
      transition: 'transform 120ms cubic-bezier(0.2,0.7,0.2,1), background 220ms',
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >{icon}{children}</button>
  );
}

function NnooChip({ children, tone = 'clay', icon }) {
  const tones = {
    clay:    { bg: NnooTheme.clay100,    fg: NnooTheme.claySoftFg },
    marigold:{ bg: NnooTheme.marigold100,fg: '#684809' },
    forest:  { bg: NnooTheme.forest100,  fg: '#153a1f' },
    plum:    { bg: NnooTheme.plum100,    fg: '#421630' },
    neutral: { bg: NnooTheme.raised,     fg: NnooTheme.ink700 },
  };
  const t = tones[tone];
  return (
    <span style={{
      fontFamily: NnooTheme.fontBody, fontWeight: 600, fontSize: 12,
      padding: '5px 10px', borderRadius: 999, background: t.bg, color: t.fg,
      display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
    }}>{icon}{children}</span>
  );
}

function NnooCard({ children, padding = 16, tone = 'paper', style = {} }) {
  const tones = {
    paper: { bg: NnooTheme.paper, bd: '#e8dfc9' },
    cream: { bg: NnooTheme.raised, bd: 'transparent' },
    archive: { bg: NnooTheme.raised, bd: 'transparent', leftRule: NnooTheme.forest },
  };
  const t = tones[tone];
  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.bd}`, borderRadius: 18,
      boxShadow: '0 2px 6px rgba(58,24,9,0.06)', padding,
      borderLeft: t.leftRule ? `4px solid ${t.leftRule}` : undefined,
      borderTopLeftRadius: t.leftRule ? 0 : 18, borderBottomLeftRadius: t.leftRule ? 0 : 18,
      ...style,
    }}>{children}</div>
  );
}

function Eyebrow({ children, color = NnooTheme.ink500 }) {
  return <div style={{
    fontFamily: NnooTheme.fontBody, fontWeight: 600, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.12em', color,
  }}>{children}</div>;
}

// Lucide-style inline icons (stroke 2, round caps)
function Icon({ name, size = 20, color = 'currentColor' }) {
  const s = { stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const paths = {
    home:     <><path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" /></>,
    book:     <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    archive:  <><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></>,
    users:    <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    mic:      <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></>,
    play:     <><polygon points="5 3 19 12 5 21 5 3" fill={color} stroke="none"/></>,
    pause:    <><rect x="6" y="4" width="4" height="16" fill={color} stroke="none"/><rect x="14" y="4" width="4" height="16" fill={color} stroke="none"/></>,
    flame:    <><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
    chevronR: <><polyline points="9 18 15 12 9 6"/></>,
    chevronL: <><polyline points="15 18 9 12 15 6"/></>,
    close:    <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    search:   <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    sparkle:  <><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></>,
    mapPin:   <><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>,
    heart:    <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    share:    <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></>,
    waveform: <><path d="M2 12h2"/><path d="M6 8v8"/><path d="M10 4v16"/><path d="M14 7v10"/><path d="M18 10v4"/><path d="M22 12h0"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s}>
      {paths[name] || null}
    </svg>
  );
}

// ———————————————————————————————————————————————————————————
// App chrome
// ———————————————————————————————————————————————————————————

function AppHeader({ greeting, name, streak }) {
  return (
    <div style={{ padding: '72px 20px 16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Eyebrow>{greeting}</Eyebrow>
          <div style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 24, color: NnooTheme.ink900, letterSpacing: '-0.02em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: NnooTheme.marigold, borderRadius: 999, padding: '6px 12px', flexShrink: 0 }}>
          <Icon name="flame" size={16} color={NnooTheme.ink900} />
          <span style={{ fontFamily: NnooTheme.fontDisplay, fontWeight: 700, fontSize: 14, color: NnooTheme.ink900 }}>{streak}</span>
        </div>
      </div>
    </div>
  );
}

function TabBar({ active, onChange, ikpePending = 0 }) {
  const tabs = [
    { id: 'home',   label: 'Learn',   icon: 'home' },
    { id: 'oba',    label: 'Ọbá',     icon: 'archive' },
    { id: 'ikpe',   label: 'Ikpe',    icon: 'users', badge: ikpePending },
    { id: 'oha',    label: 'Ọha',     icon: 'users' },
    { id: 'me',     label: 'You',     icon: 'book' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      background: 'rgba(250, 245, 236, 0.85)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderTop: '1px solid rgba(26, 18, 11, 0.08)',
      padding: '10px 8px 28px 8px',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '6px 10px', borderRadius: 12, position: 'relative',
          }}>
            <div style={{ position: 'relative' }}>
              <Icon name={t.icon} size={24} color={isActive ? NnooTheme.clay : NnooTheme.ink500} />
              {t.badge ? (
                <span style={{
                  position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 999, background: NnooTheme.danger, color: '#faf5ec',
                  fontFamily: NnooTheme.fontBody, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{t.badge}</span>
              ) : null}
            </div>
            <span style={{
              fontFamily: NnooTheme.fontBody, fontSize: 11, fontWeight: 600,
              color: isActive ? NnooTheme.clay : NnooTheme.ink500, letterSpacing: '-0.005em',
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ———————————————————————————————————————————————————————————
// Audio waveform (animated when recording)
// ———————————————————————————————————————————————————————————

function Waveform({ progress = 0.3, playing = false, recording = false, bars = 48 }) {
  const barData = React.useMemo(() =>
    Array.from({ length: bars }, (_, i) => {
      const seed = Math.sin(i * 1.3) * Math.cos(i * 0.7);
      return 0.25 + Math.abs(seed) * 0.75;
    }), [bars]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 48, width: '100%' }}>
      {barData.map((h, i) => {
        const played = (i / bars) <= progress;
        const color = recording ? NnooTheme.clay : (played ? NnooTheme.clay : '#d6c8ad');
        return (
          <div key={i} style={{
            flex: 1, height: `${h * 100}%`,
            background: color, borderRadius: 2, minHeight: 4,
            opacity: recording ? (0.5 + Math.abs(Math.sin(Date.now()/200 + i)) * 0.5) : 1,
            transition: 'background 200ms',
          }} />
        );
      })}
    </div>
  );
}

Object.assign(window, {
  NnooTheme, NnooButton, NnooChip, NnooCard, Eyebrow, Icon,
  AppHeader, TabBar, Waveform,
});
