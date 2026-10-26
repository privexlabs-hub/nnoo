# Nnọọ Design System

> **Nnọọ** (Igbo: *welcome*) is a voice-first mobile platform that preserves and transmits the full living culture of **Ndị Igbo** — language, proverbs, recipes, music, ceremonies, material culture, and place-histories — by recording it from elders, storing it with provenance, and teaching it to diaspora children with tonal pronunciation feedback.

*"Two hands, one body."* A preservation archive and a learning app that feed each other.

---

## Product surfaces

Nnọọ is not one app — it's a small constellation that shares one visual language:

| Surface | Who | What it does |
|---|---|---|
| **Nnọọ Learn** (iOS/Android) | Diaspora children & adults | Lessons, tonal pronunciation feedback, daily proverb, flashcards |
| **Ọbá Archive** (in-app) | Anyone | Browse/listen to elder recordings with full provenance (who, where, when, dialect) |
| **Facilitator Mode** (tablet) | Community volunteers | Field-recording UI: sit with an elder, capture audio + metadata cleanly |
| **Ọha Community** (in-app) | Diaspora Igbo | Find people by state, LGA, hometown, dialect; threads; local meetups |
| **Marketing site** | Public / donors | Explain the mission, invite contribution |

The name **Ọbá** means *storehouse/treasury*; **Ọha** means *the community/gathering*. The surfaces are named in Igbo because that is the point.

---

## Sources & provenance

This is a **greenfield** design system. No codebase, Figma, or prior brand assets were provided — the brief described the product concept only. Everything visual here was defined from scratch against the direction:

- **Aesthetic:** Warm & modern — rounded sans, sunset/ochre palette, approachable like a grown-up Duolingo.
- **Palette:** Sunset/ochre (terracotta, marigold, plum, warm cream) — chosen as default of the three warm options.
- **Type:** Geometric/rounded sans throughout, with serif reserved for archival/elder content to confer weight and ceremony.
- **Cultural motifs:** Used subtly — reserved for content contexts (archive, community) rather than slathered over chrome. See the [IP note](#a-note-on-cultural-ip) below.
- **Tone:** Reverent & warm, with encouraging moments — Igbo greetings foregrounded.

If you have real assets, community-led motifs, or an elder council's guidance on visual representation, **these should replace the placeholders here**. This system is a scaffold, not a final identity.

---

## Index

Root of this project:

- `README.md` — you are here
- `colors_and_type.css` — design tokens: color vars, type scale, spacing, radii, shadows, semantic styles
- `SKILL.md` — load this skill in Claude Code or another project to reuse these rules
- `assets/` — logos, marks, motifs, imagery placeholders
- `fonts/` — webfont links (Google Fonts CDN — see note in VISUAL FOUNDATIONS)
- `preview/` — individual design-system cards shown in the Design System tab
- `ui_kits/`
  - `learn_mobile/` — iOS learner app (Home, Lesson, Ọbá, Ọha — all screens in one kit)
  - `facilitator_tablet/` — field-recording facilitator mode
  - `marketing_site/` — public-facing web

---

## Content fundamentals

**Voice is reverent and warm, with moments of encouragement.** Nnọọ welcomes; it does not sell. When it teaches, it teaches like a patient relative, not a gamified coach.

### Casing
- **Sentence case** for headings, buttons, and nav. ("Start a lesson", not "Start A Lesson".)
- **Igbo proper nouns keep their diacritics always.** Never strip — `Nnọọ`, `Ọbá`, `Ọha`, `Ndị Igbo`. If the font drops them, fix the font.
- Avoid ALL CAPS except tiny eyebrows (`eyebrow` style, 12px, 0.12em tracking).

### Person & voice
- **Second person, gentle.** "Your elder said…", "When you're ready, press record."
- **"We" refers to the community**, not the company. "We keep each other's stories."
- Never "users." Say **learners**, **elders**, **facilitators**, **contributors**.

### Igbo ↔ English mixing
- **English is primary UX copy. Igbo anchors key moments.**
  - Greeting screen: `Nnọọ.` Below in smaller: `Welcome home.`
  - Daily streak: `Ọ dị mma.` / `Well done.`
  - Section headers use Igbo names that ship with translations on first use, then stand alone: **Ọbá — the archive**, then later just **Ọbá**.
- **Never italicize Igbo words.** They are not foreign here. Set them in the same roman weight as English.
- Include dialect attribution when quoting elders: *"Onye aghụghọ na-ebi n'ọhịa."* — Umudioka dialect, Anambra.

### Tone calibration
| Context | Do | Don't |
|---|---|---|
| Lesson success | "Ọ dị mma. Your tone was right." | "🎉 Level up! +20 XP!" |
| Elder recording intro | "Take your time. There is no hurry." | "Tap to record — ready, set, go!" |
| Error | "The recording didn't catch. Would you try once more?" | "Oops! Something went wrong." |
| Empty state | "No recordings yet from your hometown. Be the first." | "Nothing here 🙁" |
| Streak break | "Welcome back. The words waited for you." | "You lost your streak! Come back!" |

### Emoji
**No emoji in product chrome or marketing copy.** The brand carries warmth through language and color; emoji feels out of register. Exception: users may add emoji in Ọha community posts (their speech, not ours).

### Proverb use
Proverbs (*ilu*) are core cultural content but must be handled with care:
- Always show the Igbo original first, then translation, then a one-line gloss of meaning.
- Never decorate — a proverb is not chrome.
- Attribute to a dialect/region when known.

### Example micro-copy

```
Lesson complete:
  Ọ dị mma.
  That's three new words today — they are yours now.

Recording elder permission screen:
  Before we begin
  This recording belongs to [Elder's name] and their community.
  You choose who hears it, and when.

Empty archive state:
  Ọbá is empty for your hometown.
  The first recording from Nnewi is waiting to be made.
  [ Become a facilitator ]
```

---

## Visual foundations

### Color vibe
**Warm always.** Every neutral has a warm bias (bone, cream, sand, clay-dust) — no cool grays. The palette evokes late afternoon light, clay, and cooking fire, not screens. Primary brand is **clay** (#c85a26), a terracotta red-orange. Marigold is the accent. Plum is rare and used for community signals. Forest green is reserved for the archive / provenance layer.

Semantic color roles (`--brand`, `--accent`, `--archival`, `--community`) are meaningful — use them consistently, don't swap freely.

### Type
- **Outfit** — display, headings, buttons. Geometric and rounded but with personality. Weights 400/500/600/700/800.
- **DM Sans** — body and UI. Humanist, clean, excellent at small sizes. Opsz variable — benefit from it.
- **Fraunces** — **reserved for archival/elder content** (quoted proverbs, elder names, recording transcripts). Gives ceremony. Never use for UI chrome.
- Scale is 1.2-ratio from 12 → 88. Hero text uses `clamp()` so it responds.
- **Tracking is tight** on display (-0.02em) and **wide on eyebrows** (0.12em caps). Body is default.

### Spacing
4px base scale (`--s-1` through `--s-10`). Generous — interfaces breathe. Hit targets minimum 44×44. Mobile content inset is 20px standard.

### Backgrounds
- Default: solid `--bg` (bone).
- Full-bleed imagery on hero/detail screens only, never behind dense UI.
- Subtle dot texture (`texture-paper`) available for paper-feel surfaces. Use once per screen, if at all.
- Warm radial gradient (`texture-warm`) for occasional hero moments — clay + marigold in opposite corners. Max 1 per flow.
- **No bluish-purple gradients. No glassmorphism. No neon.**

### Animation
- Motion is present but unhurried. Default duration **220ms**, ease `cubic-bezier(0.2, 0.7, 0.2, 1)` (out).
- Entry: fade + 8px rise.
- Press: 120ms scale to 0.97, no color change.
- Celebration (lesson complete): 420ms overshoot bounce on the result card, once.
- **No skeleton shimmer.** Audio content loading shows a slow pulse on the waveform placeholder.

### Hover / press states
- **Hover**: background darkens by one scale step (`--clay-500` → `--clay-600`), **never** lightens. Text never underlines on hover; it's already expected to be tappable.
- **Press**: scale 0.97, 120ms. No color shift.
- **Focus**: `--ring` — 3px clay-at-28% halo.
- **Disabled**: 50% opacity, no other change.

### Borders & shadows
- Hairlines: `--ink-100` at 1px.
- Cards: `--border` at 1px + `--shadow-sm` on raised, `--shadow-md` when interactive.
- Shadow tint is always **warm brown** (`rgba(58,24,9, α)`), never black. Elevation tiers xs/sm/md/lg/xl.
- **No inner shadows on inputs.** Inputs are flat with a 1px border that thickens to 2px of `--border-accent` on focus.

### Corners
- Inputs, small buttons: `--r-md` (12px).
- Cards: `--r-lg` (18px).
- Sheets, modals, hero cards: `--r-xl` / `--r-2xl` (24–32px).
- Pill (capsule) reserved for tags, badges, avatars.

### Cards
Raised card = `--bg-card` (white) + 1px `--border` + `--shadow-sm` + `--r-lg`. Elder/archival cards use `--bg-raised` (cream) + `--forest-100` left rule (4px, full height) to signal provenance.

### Transparency & blur
- **Rare.** One case: the audio-playback sticky footer uses `backdrop-filter: blur(16px)` over `--paper/85%`.
- Avoid frosted-glass chrome elsewhere — it reads as generic iOS, not as Nnọọ.

### Imagery
Warm-bias photography: late-afternoon golden hour, skin tones rendered without shifting to cool, earthy props and textiles. Avoid stock "African" cliches (drums in silhouette, safari sunsets). Portraits should show specific people, named and credited. When real imagery isn't available, use the tonal color-field placeholders in `assets/photo-placeholder-*.svg`.

### Layout
- Mobile: single column, 20px inset, bottom tab bar (60px tall + safe area).
- Tablet (facilitator): split — 320px left rail + content.
- Web: centered column max 1200px, 32px gutter.
- Sticky elements: header only. Bottom-docked audio player slides up.

---

## Iconography

**System:** Lucide (`https://unpkg.com/lucide-static@latest/`) — linked from CDN. Lucide is chosen because its stroke weight (2px) and rounded caps match Outfit's rounded geometric feel, and it covers every UX primitive we need. This is a **substitution flagged for review**: a purpose-built Igbo-context icon set (uli-linework-inspired, commissioned) would be better and should replace this when resources allow.

**Usage:**
- Default icon size **20px**, stroke **2px**, color inherited.
- In tab bars: **24px**, `--fg-subtle` inactive, `--brand` active.
- **Never use emoji as icons** in product chrome.
- **No unicode geometric shapes** (▸ ● ■) as icons — always Lucide SVG.

**Custom SVG in this project:**
- Logo marks (`assets/logo-*.svg`) — abstract "two arcs meeting the dot-below diacritic."
- Waveform (`assets/waveform-example.svg`) — audio signature, brand-colored.
- Abstract rhythm pattern (`assets/pattern-rhythm.svg`) — dots + arcs. **Not a traditional motif.**

**Emoji:** Not used in product chrome or marketing. Allowed in user-generated Ọha posts.

**Unicode special characters in content:**
- The macron / acute / grave / dot-below combining marks on Igbo characters are **content**, not decoration. Font must render them correctly (Outfit, DM Sans, and Fraunces all do).

---

## A note on cultural IP

Igbo visual culture — *uli* body/wall art, *nsibidi* glyphs, *akwete* weaving patterns — belongs to specific communities and artists. A design system built without Igbo co-authorship should **not** appropriate these. In this system:

- Motifs used in chrome are **abstract geometric originals** evoking rhythm and symmetry without reproducing any specific traditional pattern.
- Any place that would use *nsibidi*, *uli*, or a specific weave must source it from an Igbo artist with attribution and compensation.
- Placeholder imagery is neutral color fields, not stylized "African" illustration.

This is flagged for the user to resolve before shipping.
