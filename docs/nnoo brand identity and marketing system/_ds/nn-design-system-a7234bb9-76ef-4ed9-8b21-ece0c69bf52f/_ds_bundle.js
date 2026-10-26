/* @ds-bundle: {"format":3,"namespace":"NnDesignSystem_a7234b","components":[],"sourceHashes":{"ui_kits/facilitator_tablet/FacilitatorApp.jsx":"901f4ce9670f","ui_kits/learn_mobile/Primitives.jsx":"e9acd78535fb","ui_kits/learn_mobile/Screens.jsx":"0b8fa3f20094","ui_kits/learn_mobile/ios-frame.jsx":"d67eb3ffe562"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.NnDesignSystem_a7234b = window.NnDesignSystem_a7234b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/facilitator_tablet/FacilitatorApp.jsx
try { (() => {
// Facilitator tablet — field recording UI for community volunteers
// Landscape 10.9" iPad (1024x768 simplified). Split: 320px rail + content.

function FacilitatorApp() {
  const [phase, setPhase] = React.useState('setup'); // setup | recording | review

  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1180,
      height: 820,
      background: NnooTheme.bg,
      borderRadius: 28,
      overflow: 'hidden',
      display: 'flex',
      boxShadow: '0 40px 80px rgba(0,0,0,0.2)',
      fontFamily: NnooTheme.fontBody
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      background: NnooTheme.raised,
      padding: 24,
      borderRight: '1px solid #e8dfc9',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    width: "36",
    height: "36"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 18,
      color: NnooTheme.ink900,
      letterSpacing: '-0.01em'
    }
  }, "Nn\u1ECD\u1ECD"), /*#__PURE__*/React.createElement(Eyebrow, null, "Facilitator"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Session"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      background: NnooTheme.paper,
      borderRadius: 14,
      padding: 14,
      border: '1px solid #e8dfc9'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 16,
      color: NnooTheme.ink900
    }
  }, "Elder Obi"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      color: NnooTheme.ink700,
      marginTop: 3
    }
  }, "Nnewi \xB7 Age 82"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 12,
      color: NnooTheme.ink500,
      marginTop: 8
    }
  }, "Consent captured \xB7 2026-04-17"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Checklist"), [['Quiet room', true], ['Mic level good', true], ['Consent recorded', true], ['Topic chosen', phase !== 'setup'], ['Recording saved', phase === 'review']].map(([l, done], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 4px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 999,
      border: `2px solid ${done ? NnooTheme.forest : NnooTheme.ink100}`,
      background: done ? NnooTheme.forest : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, done && /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 14,
      color: done ? NnooTheme.ink700 : NnooTheme.ink500
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      fontFamily: NnooTheme.fontBody,
      fontSize: 12,
      color: NnooTheme.ink500,
      lineHeight: 1.5
    }
  }, "Every recording belongs to the elder and their community. You can always stop. There is no hurry.")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 48,
      display: 'flex',
      flexDirection: 'column'
    }
  }, phase === 'setup' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Eyebrow, null, "Step 2 of 4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 42,
      color: NnooTheme.ink900,
      letterSpacing: '-0.025em',
      marginTop: 6,
      lineHeight: 1.05
    }
  }, "What will Elder Obi share today?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 16,
      color: NnooTheme.ink700,
      marginTop: 10,
      maxWidth: 540,
      lineHeight: 1.55
    }
  }, "Pick a topic so the recording finds the right learners later. You can add more after."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 14,
      marginTop: 28,
      maxWidth: 720
    }
  }, [{
    t: 'A story',
    d: 'Folktales, family histories, how it was'
  }, {
    t: 'A proverb',
    d: 'Ilu — and what it teaches'
  }, {
    t: 'A song',
    d: 'Lullabies, work songs, ceremony'
  }, {
    t: 'A recipe',
    d: 'Ofe, jollof, traditional dishes'
  }, {
    t: 'A craft',
    d: 'How to make, grow, build, tap'
  }, {
    t: 'Place-lore',
    d: 'About a shrine, river, market'
  }].map((x, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setPhase('recording'),
    style: {
      background: i === 0 ? NnooTheme.clay100 : NnooTheme.paper,
      border: `1.5px solid ${i === 0 ? NnooTheme.clay : '#e8dfc9'}`,
      borderRadius: 16,
      padding: 18,
      textAlign: 'left',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 18,
      color: NnooTheme.ink900
    }
  }, x.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      color: NnooTheme.ink700,
      marginTop: 4,
      lineHeight: 1.4
    }
  }, x.d)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(NnooButton, {
    variant: "outline"
  }, "Back"), /*#__PURE__*/React.createElement(NnooButton, {
    onClick: () => setPhase('recording')
  }, "Continue to recording"))), phase === 'recording' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Now recording \xB7 A story"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 38,
      color: NnooTheme.ink900,
      letterSpacing: '-0.02em',
      marginTop: 6
    }
  }, "Take your time. There is no hurry."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      padding: 28,
      borderRadius: 20,
      background: 'radial-gradient(600px 300px at 20% 0%, #fbe4d4 0%, transparent 60%), #f3ead8',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 14,
      height: 14,
      borderRadius: 999,
      background: NnooTheme.danger,
      animation: 'pulse 1.8s ease-in-out infinite'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 20,
      color: NnooTheme.ink900
    }
  }, "04:12"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 14,
      color: NnooTheme.ink500
    }
  }, "\xB7 levels good"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Waveform, {
    recording: true,
    bars: 80
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(NnooButton, {
    variant: "outline",
    size: "lg"
  }, "Pause"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPhase('review'),
    style: {
      width: 96,
      height: 96,
      borderRadius: 999,
      background: NnooTheme.danger,
      border: '5px solid ' + NnooTheme.paper,
      boxShadow: '0 14px 40px rgba(58,24,9,0.22)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 24,
      height: 24,
      background: '#faf5ec',
      borderRadius: 4
    }
  })), /*#__PURE__*/React.createElement(NnooButton, {
    variant: "outline",
    size: "lg"
  }, "Add note"))), /*#__PURE__*/React.createElement("style", null, `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`)), phase === 'review' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Eyebrow, null, "Review \xB7 before saving"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 38,
      color: NnooTheme.ink900,
      letterSpacing: '-0.02em',
      marginTop: 6
    }
  }, "4 minutes, 12 seconds of Elder Obi"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      background: NnooTheme.paper,
      border: '1px solid #e8dfc9',
      borderRadius: 20,
      padding: 22
    }
  }, /*#__PURE__*/React.createElement(Waveform, {
    progress: 0.4,
    bars: 100
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(NnooChip, {
    tone: "forest"
  }, "Story"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "Nnewi"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "Central dialect"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "2026"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      background: NnooTheme.raised,
      borderRadius: 18,
      padding: 22,
      borderLeft: `4px solid ${NnooTheme.forest}`
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Provenance"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 15,
      color: NnooTheme.ink700,
      marginTop: 8,
      lineHeight: 1.55
    }
  }, "Recorded by ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: NnooTheme.ink900
    }
  }, "Chinyere O."), " with ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: NnooTheme.ink900
    }
  }, "Elder Obi"), " in Nnewi, Anambra on April 17, 2026. Elder chose to share with: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: NnooTheme.ink900
    }
  }, "anyone from Anambra state"), ".")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(NnooButton, {
    variant: "outline",
    onClick: () => setPhase('recording')
  }, "Record more"), /*#__PURE__*/React.createElement(NnooButton, {
    size: "lg"
  }, "Save to \u1ECCb\xE1")))));
}
Object.assign(window, {
  FacilitatorApp
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/facilitator_tablet/FacilitatorApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learn_mobile/Primitives.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Nnọọ Learn — mobile UI kit components
// Reusable pieces used across screens. Uses design tokens from ../../colors_and_type.css

const NnooTheme = {
  bg: '#faf5ec',
  raised: '#f3ead8',
  paper: '#fff',
  sand: '#e8dfc9',
  ink900: '#1a120b',
  ink700: '#3d2e1f',
  ink500: '#6b5945',
  ink100: '#d9cfbd',
  clay: '#c85a26',
  clay600: '#a7471c',
  clay100: '#fbe4d4',
  claySoftFg: '#873818',
  marigold: '#d9a019',
  marigold100: '#fae9b8',
  forest: '#2e5d3a',
  forest100: '#d0e0d4',
  plum: '#6d2c4f',
  plum100: '#ebd9e3',
  danger: '#b33a2a',
  fontDisplay: "Outfit, -apple-system, system-ui, sans-serif",
  fontBody: "'DM Sans', -apple-system, system-ui, sans-serif",
  fontArchive: "Fraunces, Georgia, serif"
};

// ———————————————————————————————————————————————————————————
// Primitives
// ———————————————————————————————————————————————————————————

function NnooButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  icon,
  fullWidth
}) {
  const variants = {
    primary: {
      bg: NnooTheme.clay,
      fg: '#faf5ec',
      bd: 'transparent'
    },
    secondary: {
      bg: NnooTheme.clay100,
      fg: NnooTheme.claySoftFg,
      bd: 'transparent'
    },
    outline: {
      bg: 'transparent',
      fg: NnooTheme.ink900,
      bd: '#d6c8ad'
    },
    ghost: {
      bg: 'transparent',
      fg: NnooTheme.ink900,
      bd: 'transparent'
    },
    dark: {
      bg: NnooTheme.ink900,
      fg: '#faf5ec',
      bd: 'transparent'
    }
  };
  const sizes = {
    sm: [13, '8px 14px', 10],
    md: [15, '12px 20px', 12],
    lg: [17, '16px 28px', 14]
  };
  const v = variants[variant];
  const [fs, pad, r] = sizes[size];
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: fs,
      padding: pad,
      borderRadius: r,
      background: v.bg,
      color: v.fg,
      border: `1.5px solid ${v.bd}`,
      letterSpacing: '-0.005em',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
      width: fullWidth ? '100%' : undefined,
      transition: 'transform 120ms cubic-bezier(0.2,0.7,0.2,1), background 220ms'
    },
    onMouseDown: e => e.currentTarget.style.transform = 'scale(0.97)',
    onMouseUp: e => e.currentTarget.style.transform = 'scale(1)',
    onMouseLeave: e => e.currentTarget.style.transform = 'scale(1)'
  }, icon, children);
}
function NnooChip({
  children,
  tone = 'clay',
  icon
}) {
  const tones = {
    clay: {
      bg: NnooTheme.clay100,
      fg: NnooTheme.claySoftFg
    },
    marigold: {
      bg: NnooTheme.marigold100,
      fg: '#684809'
    },
    forest: {
      bg: NnooTheme.forest100,
      fg: '#153a1f'
    },
    plum: {
      bg: NnooTheme.plum100,
      fg: '#421630'
    },
    neutral: {
      bg: NnooTheme.raised,
      fg: NnooTheme.ink700
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontWeight: 600,
      fontSize: 12,
      padding: '5px 10px',
      borderRadius: 999,
      background: t.bg,
      color: t.fg,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      whiteSpace: 'nowrap'
    }
  }, icon, children);
}
function NnooCard({
  children,
  padding = 16,
  tone = 'paper',
  style = {}
}) {
  const tones = {
    paper: {
      bg: NnooTheme.paper,
      bd: '#e8dfc9'
    },
    cream: {
      bg: NnooTheme.raised,
      bd: 'transparent'
    },
    archive: {
      bg: NnooTheme.raised,
      bd: 'transparent',
      leftRule: NnooTheme.forest
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: t.bg,
      border: `1px solid ${t.bd}`,
      borderRadius: 18,
      boxShadow: '0 2px 6px rgba(58,24,9,0.06)',
      padding,
      borderLeft: t.leftRule ? `4px solid ${t.leftRule}` : undefined,
      borderTopLeftRadius: t.leftRule ? 0 : 18,
      borderBottomLeftRadius: t.leftRule ? 0 : 18,
      ...style
    }
  }, children);
}
function Eyebrow({
  children,
  color = NnooTheme.ink500
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontWeight: 600,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color
    }
  }, children);
}

// Lucide-style inline icons (stroke 2, round caps)
function Icon({
  name,
  size = 20,
  color = 'currentColor'
}) {
  const s = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none'
  };
  const paths = {
    home: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"
    })),
    book: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
    })),
    archive: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "4",
      width: "18",
      height: "4",
      rx: "1"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 12h4"
    })),
    users: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "7",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M22 21v-2a4 4 0 0 0-3-3.87"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16 3.13a4 4 0 0 1 0 7.75"
    })),
    mic: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M19 10v2a7 7 0 0 1-14 0v-2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 19v4"
    })),
    play: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polygon", {
      points: "5 3 19 12 5 21 5 3",
      fill: color,
      stroke: "none"
    })),
    pause: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "6",
      y: "4",
      width: "4",
      height: "16",
      fill: color,
      stroke: "none"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "4",
      width: "4",
      height: "16",
      fill: color,
      stroke: "none"
    })),
    flame: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
    })),
    check: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
      points: "20 6 9 17 4 12"
    })),
    chevronR: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
      points: "9 18 15 12 9 6"
    })),
    chevronL: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
      points: "15 18 9 12 15 6"
    })),
    close: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
      x1: "18",
      y1: "6",
      x2: "6",
      y2: "18"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "6",
      y1: "6",
      x2: "18",
      y2: "18"
    })),
    search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "11",
      cy: "11",
      r: "8"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "21",
      y1: "21",
      x2: "16.65",
      y2: "16.65"
    })),
    sparkle: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"
    })),
    mapPin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "10",
      r: "3"
    })),
    heart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
    })),
    share: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "18",
      cy: "5",
      r: "3"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "6",
      cy: "12",
      r: "3"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "18",
      cy: "19",
      r: "3"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "8.6",
      y1: "13.5",
      x2: "15.4",
      y2: "17.5"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "15.4",
      y1: "6.5",
      x2: "8.6",
      y2: "10.5"
    })),
    waveform: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M2 12h2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M6 8v8"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 4v16"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M14 7v10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M18 10v4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M22 12h0"
    }))
  };
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, s), paths[name] || null);
}

// ———————————————————————————————————————————————————————————
// App chrome
// ———————————————————————————————————————————————————————————

function AppHeader({
  greeting,
  name,
  streak
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '72px 20px 16px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, greeting), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 24,
      color: NnooTheme.ink900,
      letterSpacing: '-0.02em',
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: NnooTheme.marigold,
      borderRadius: 999,
      padding: '6px 12px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flame",
    size: 16,
    color: NnooTheme.ink900
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 14,
      color: NnooTheme.ink900
    }
  }, streak))));
}
function TabBar({
  active,
  onChange
}) {
  const tabs = [{
    id: 'home',
    label: 'Learn',
    icon: 'home'
  }, {
    id: 'oba',
    label: 'Ọbá',
    icon: 'archive'
  }, {
    id: 'oha',
    label: 'Ọha',
    icon: 'users'
  }, {
    id: 'me',
    label: 'You',
    icon: 'book'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 40,
      background: 'rgba(250, 245, 236, 0.85)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderTop: '1px solid rgba(26, 18, 11, 0.08)',
      padding: '10px 8px 28px 8px',
      display: 'flex',
      justifyContent: 'space-around'
    }
  }, tabs.map(t => {
    const isActive = active === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange(t.id),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 14px',
        borderRadius: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 24,
      color: isActive ? NnooTheme.clay : NnooTheme.ink500
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: NnooTheme.fontBody,
        fontSize: 11,
        fontWeight: 600,
        color: isActive ? NnooTheme.clay : NnooTheme.ink500,
        letterSpacing: '-0.005em'
      }
    }, t.label));
  }));
}

// ———————————————————————————————————————————————————————————
// Audio waveform (animated when recording)
// ———————————————————————————————————————————————————————————

function Waveform({
  progress = 0.3,
  playing = false,
  recording = false,
  bars = 48
}) {
  const barData = React.useMemo(() => Array.from({
    length: bars
  }, (_, i) => {
    const seed = Math.sin(i * 1.3) * Math.cos(i * 0.7);
    return 0.25 + Math.abs(seed) * 0.75;
  }), [bars]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      height: 48,
      width: '100%'
    }
  }, barData.map((h, i) => {
    const played = i / bars <= progress;
    const color = recording ? NnooTheme.clay : played ? NnooTheme.clay : '#d6c8ad';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        height: `${h * 100}%`,
        background: color,
        borderRadius: 2,
        minHeight: 4,
        opacity: recording ? 0.5 + Math.abs(Math.sin(Date.now() / 200 + i)) * 0.5 : 1,
        transition: 'background 200ms'
      }
    });
  }));
}
Object.assign(window, {
  NnooTheme,
  NnooButton,
  NnooChip,
  NnooCard,
  Eyebrow,
  Icon,
  AppHeader,
  TabBar,
  Waveform
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learn_mobile/Primitives.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learn_mobile/Screens.jsx
try { (() => {
// Core screens for Nnọọ Learn mobile

function HomeScreen({
  onStartLesson,
  onOpenArchive
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(AppHeader, {
    greeting: "Nn\u1ECD\u1ECD, Chinyere.",
    name: "Welcome back",
    streak: 7
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 20px 0 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'radial-gradient(600px 300px at 0% 0%, #fbe4d4 0%, transparent 60%), radial-gradient(500px 260px at 100% 100%, #fae9b8 0%, transparent 60%), #f3ead8',
      borderRadius: 24,
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Today's lesson \xB7 1 of 3"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 32,
      color: NnooTheme.ink900,
      letterSpacing: '-0.025em',
      marginTop: 6,
      lineHeight: 1.05
    }
  }, "Words for home"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 15,
      color: NnooTheme.ink700,
      marginTop: 6,
      lineHeight: 1.5
    }
  }, "\u1EE5l\u1ECD \xB7 ezi \xB7 \u1ECDn\u1EE5 \u1EE5z\u1ECD"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      flex: 1,
      background: NnooTheme.clay,
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      flex: 1,
      background: NnooTheme.clay,
      borderRadius: 999
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      flex: 1,
      background: '#d6c8ad',
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(NnooButton, {
    onClick: onStartLesson,
    fullWidth: true,
    size: "lg"
  }, "Continue lesson")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px 0 20px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Ilu \u1EE5b\u1ECDch\u1ECB \xB7 proverb today"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(NnooCard, {
    tone: "archive",
    padding: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontArchive,
      fontSize: 22,
      fontStyle: 'italic',
      color: NnooTheme.ink900,
      lineHeight: 1.3
    }
  }, "\"Onye agh\u1EE5gh\u1ECD na-ebi n'\u1ECDh\u1ECBa.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 14,
      color: NnooTheme.ink700,
      marginTop: 8,
      lineHeight: 1.5
    }
  }, "The cunning one lives in the forest."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(NnooChip, {
    tone: "forest"
  }, "Umudioka dialect"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "Anambra"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 120px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "From \u1ECCb\xE1 \xB7 recent"), /*#__PURE__*/React.createElement("button", {
    onClick: onOpenArchive,
    style: {
      background: 'transparent',
      border: 'none',
      color: NnooTheme.clay,
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "See all \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(NnooCard, {
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: 'linear-gradient(135deg, #e17f47, #6d2c4f)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 15,
      color: NnooTheme.ink900
    }
  }, "Grandmother Ada on market days"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 12,
      color: NnooTheme.ink500,
      marginTop: 2
    }
  }, "Onitsha \xB7 4 min \xB7 recorded 2026")), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: NnooTheme.clay100,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 14,
    color: NnooTheme.claySoftFg
  })))), /*#__PURE__*/React.createElement(NnooCard, {
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: 'linear-gradient(135deg, #2e5d3a, #1a120b)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 15,
      color: NnooTheme.ink900
    }
  }, "How palm wine is tapped"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 12,
      color: NnooTheme.ink500,
      marginTop: 2
    }
  }, "Nnewi \xB7 7 min \xB7 Elder Obi")), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: NnooTheme.clay100,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 14,
    color: NnooTheme.claySoftFg
  })))))));
}
function LessonScreen({
  onComplete,
  onBack
}) {
  const [recording, setRecording] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '62px 20px 0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: NnooTheme.raised,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronL",
    size: 18,
    color: NnooTheme.ink900
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 6,
      background: NnooTheme.sand,
      borderRadius: 999,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: '60%',
      background: NnooTheme.clay,
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      fontWeight: 600,
      color: NnooTheme.ink500
    }
  }, "2 / 3")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '32px 20px 20px 20px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Say the word"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 72,
      color: NnooTheme.ink900,
      letterSpacing: '-0.03em',
      marginTop: 16,
      lineHeight: 1
    }
  }, "\u1EE5l\u1ECD"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 18,
      color: NnooTheme.ink700,
      marginTop: 8
    }
  }, "/\u016B.l\u0254\u0301/ \xB7 house"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      background: NnooTheme.paper,
      border: '1px solid #e8dfc9',
      borderRadius: 18,
      padding: 18
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Tone target"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'flex-end',
      height: 48,
      marginTop: 10,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 22,
      background: NnooTheme.ink100,
      borderRadius: 4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 40,
      background: NnooTheme.clay,
      borderRadius: 4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginTop: 6,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      textAlign: 'center',
      fontFamily: NnooTheme.fontBody,
      fontSize: 11,
      color: NnooTheme.ink500
    }
  }, "\u1EE5"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      textAlign: 'center',
      fontFamily: NnooTheme.fontBody,
      fontSize: 11,
      color: NnooTheme.clay,
      fontWeight: 600
    }
  }, "l\u1ECD\u0301")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      color: NnooTheme.ink500,
      marginTop: 10
    }
  }, "Low tone, then high tone.")), attempted && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      background: NnooTheme.forest100,
      borderRadius: 14,
      padding: 14,
      textAlign: 'left',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 18,
    color: NnooTheme.forest
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 15,
      color: '#153a1f'
    }
  }, "\u1ECC d\u1ECB mma."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      color: '#153a1f',
      marginTop: 2
    }
  }, "Your tone was right.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12
    }
  }, recording && /*#__PURE__*/React.createElement("div", {
    style: {
      width: '80%'
    }
  }, /*#__PURE__*/React.createElement(Waveform, {
    recording: true,
    bars: 32
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (recording) {
        setRecording(false);
        setAttempted(true);
        setTimeout(onComplete, 1200);
      } else setRecording(true);
    },
    style: {
      width: 88,
      height: 88,
      borderRadius: 999,
      background: recording ? NnooTheme.danger : NnooTheme.clay,
      border: '4px solid ' + (recording ? '#fbe4d4' : NnooTheme.paper),
      boxShadow: '0 14px 40px rgba(58,24,9,0.22)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mic",
    size: 32,
    color: "#faf5ec"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      color: NnooTheme.ink500
    }
  }, recording ? 'Listening…' : 'Hold to record')));
}
function ArchiveScreen({
  onBack
}) {
  const recordings = [{
    title: 'Market days in Onitsha',
    elder: 'Grandmother Ada',
    place: 'Onitsha · Anambra',
    dur: '4:12',
    color: 'linear-gradient(135deg, #e17f47, #6d2c4f)'
  }, {
    title: 'Tapping palm wine',
    elder: 'Elder Obi',
    place: 'Nnewi · Anambra',
    dur: '7:04',
    color: 'linear-gradient(135deg, #2e5d3a, #1a120b)'
  }, {
    title: 'The naming ceremony',
    elder: 'Mama Nneka',
    place: 'Owerri · Imo',
    dur: '11:28',
    color: 'linear-gradient(135deg, #d9a019, #c85a26)'
  }, {
    title: 'Why the tortoise has a cracked shell',
    elder: 'Papa Emeka',
    place: 'Abakaliki · Ebonyi',
    dur: '6:40',
    color: 'linear-gradient(135deg, #6d2c4f, #2e5d3a)'
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '62px 20px 0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: NnooTheme.raised,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronL",
    size: 18,
    color: NnooTheme.ink900
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "The archive"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 28,
      color: NnooTheme.ink900,
      letterSpacing: '-0.02em'
    }
  }, "\u1ECCb\xE1"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px 0 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4
    }
  }, /*#__PURE__*/React.createElement(NnooChip, {
    tone: "clay"
  }, "All \xB7 2,317"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "Proverbs"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "Stories"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "Recipes"), /*#__PURE__*/React.createElement(NnooChip, {
    tone: "neutral"
  }, "Songs"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px 120px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, recordings.map((r, i) => /*#__PURE__*/React.createElement(NnooCard, {
    key: i,
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 60,
      borderRadius: 14,
      background: r.color,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 18,
    color: "#faf5ec"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 15,
      color: NnooTheme.ink900,
      lineHeight: 1.3
    }
  }, r.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 13,
      color: NnooTheme.ink700,
      marginTop: 3
    }
  }, r.elder), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 12,
      color: NnooTheme.ink500,
      marginTop: 2
    }
  }, r.place, " \xB7 ", r.dur)))))));
}
function OhaScreen({
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '62px 20px 0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: NnooTheme.raised,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronL",
    size: 18,
    color: NnooTheme.ink900
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Community"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 28,
      color: NnooTheme.ink900,
      letterSpacing: '-0.02em'
    }
  }, "\u1ECCha"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 20px 0 20px'
    }
  }, /*#__PURE__*/React.createElement(NnooCard, {
    tone: "cream",
    padding: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mapPin",
    size: 18,
    color: NnooTheme.plum
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 15,
      color: NnooTheme.ink900,
      lineHeight: 1.25
    }
  }, "Nnewi \xB7 your hometown")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 14,
      color: NnooTheme.ink700,
      marginTop: 8,
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: NnooTheme.ink900
    }
  }, "127 people"), " from Nnewi are in \u1ECCha. 34 in London, 28 in Atlanta, 19 in Lagos."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(NnooButton, {
    variant: "secondary",
    size: "sm"
  }, "See who's near you")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px 120px 20px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "From your hometown"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 10
    }
  }, [{
    who: 'Adaeze O.',
    when: '2h',
    place: 'London',
    body: 'Does anyone remember the song grandmothers sang at ịgba nkwụ? My mother only remembers the first line.'
  }, {
    who: 'Ikem N.',
    when: '6h',
    place: 'Atlanta',
    body: 'Recorded my father this weekend — an hour of stories about growing up in Nnewi before the war. Adding to Ọbá.'
  }].map((p, i) => /*#__PURE__*/React.createElement(NnooCard, {
    key: i,
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: NnooTheme.plum100,
      color: NnooTheme.plum,
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 700,
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, p.who[0]), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontDisplay,
      fontWeight: 600,
      fontSize: 14,
      color: NnooTheme.ink900
    }
  }, p.who, " \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: NnooTheme.ink500,
      fontWeight: 500
    }
  }, p.place)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 11,
      color: NnooTheme.ink500
    }
  }, p.when, " ago"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: NnooTheme.fontBody,
      fontSize: 14,
      color: NnooTheme.ink700,
      marginTop: 10,
      lineHeight: 1.55
    }
  }, p.body))))));
}
Object.assign(window, {
  HomeScreen,
  LessonScreen,
  ArchiveScreen,
  OhaScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learn_mobile/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learn_mobile/ios-frame.jsx
try { (() => {
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports: IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learn_mobile/ios-frame.jsx", error: String((e && e.message) || e) }); }

})();
