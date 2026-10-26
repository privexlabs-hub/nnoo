# 11 · Roadmap: building Nnọọ from scratch

> Sequenced so each phase ships something real, proves a risky assumption, and leaves the system in a releasable state. Durations assume a core team of ~6 (2 backend, 2 mobile/web, 1 design, 1 product/community) plus a part-time audio/ML engineer. Timeboxes are estimates, not commitments. Each phase ends when its **exit criteria** are met, not when its weeks run out.

## Guiding order

1. **Consent and capture before learning.** You can't teach from recordings you don't have, and you can't keep recordings without trustworthy consent.
2. **Ikpe before Ọbá goes public.** Nothing is published without the people deciding (INV-1).
3. **Offline before scale.** Field recording happens where connectivity is poor.
4. **Community governance runs alongside engineering, from week 1.** Rules owned by the council (10 §3) must exist before the code that enforces them.

```
Phase 0  Foundations ............ wk 0–6
Phase 1  Capture & consent ...... wk 6–14    → closed field alpha (facilitators only)
Phase 2  Ikpe & Ọbá ............. wk 14–22   → private beta (founding hometowns)
Phase 3  Learning & tone ........ wk 22–32   → learner beta (mobile)
Phase 4  Web learner & Ọha ...... wk 32–40   → public beta
Phase 5  Payments & launch ...... wk 40–48   → v1.0 public launch
Phase 6  Scale & deepen ......... wk 48+     → ongoing
```

---

## Phase 0: Foundations (weeks 0–6)

**Goal:** a skeleton where adding a feature is safe from the first PR.

Engineering
- Monorepo, CI gates, module boundary lint, default-deny router, authz matrix harness (04, 07 §6, 07 §9).
- `packages/contracts` → OpenAPI → generated client. `design-tokens` from the existing design system.
- Postgres + migrations + outbox + pg-boss. Audit log. UUIDv7.
- Identity module: phone OTP, sessions, role grants (no roles granted by admin).
- `igbo-text` package: NFC enforcement and the DB `CHECK` helpers, with round-trip tests.
- IaC for staging; observability baseline (logs, traces, error tracking).
- Accept ADRs 001–006, 008, 014.

Community & governance
- Recruit the **interim custodian council** (≥ 5, at least 3 hometowns). Ratify charter v0: consent tiers, Nsọ policy, the initial Ikpe thresholds.
- Choose **3 founding hometowns**, run founding-circle verification design (01 §7).
- Legal: data-protection review (NDPA, UK/EU GDPR, children's rules), consent form and spoken-statement script, translated and tested with elders.

**Exit criteria:** a deployed staging API with one authenticated, policy-checked endpoint; CI blocks a route without a policy; the council has ratified charter v0.

---

## Phase 1: Capture & consent (weeks 6–14)

**Goal:** facilitators can record elders offline, with consent, and the audio arrives safely.

- Modules: community (geography, hometowns, dialects), consent, media, archive (elders, recordings, revisions).
- Facilitator mode in the Expo app, tablet-first: session setup → consent capture (spoken statement first) → record → review → sync.
- Offline store (encrypted SQLite), resumable multipart upload, idempotent replay.
- Audio worker: FLAC master, Opus/AAC derivatives, loudness, waveform peaks.
- The Nsọ path: metadata only, enforced in policy, API and DB trigger (INV-2).
- Consent revoke/narrow flow and the 15-minute propagation SLA monitor (INV-7).
- Facilitator onboarding + training module; facilitator role granted via 2 custodian sign-offs.
- Scenarios S-01 (capture part), S-15. ADRs 005, 007, 011, 013.

**Release:** closed field alpha, about 10 facilitators across the founding hometowns.

**Exit criteria:** ≥ 100 sessions captured in the field; 0 lost uploads; a revocation test reaches the SLA; elders and facilitators report the consent flow is understood (qualitative review with custodians).

---

## Phase 2: Ikpe & Ọbá (weeks 14–22)

**Goal:** the people decide what is published.

- Kin verification: vouching, in-person verification, founding circles, accountability rules.
- Ikpe module: cases, frozen quorum, votes + vote events, incremental tallies, `evaluate()`, sweeps, flags, random panels.
- Governance module: versioned config, governance cases.
- Ọbá: publications, signed playback URLs with tier checks, Umunna gating (INV-3), provenance view.
- Learner and kin surfaces on mobile: Ikpe list/case/vote, Ọbá browse/play.
- Property tests on Ikpe; scenarios S-02, S-05–S-09, S-12, S-14. Production invariant monitors for INV-1, 3, 5, 6, 11.
- ADR 010.

**Release:** private beta in the founding hometowns.

**Exit criteria:** ≥ 50 cases closed through Ikpe with no admin intervention; tally reconciliation drift = 0; a mock Sybil exercise is detected; the council reviews the outcomes and adjusts thresholds via a governance case (which proves the process itself works).

---

## Phase 3: Learning & tone feedback (weeks 22–32)

**Goal:** a diaspora child hears their grandmother's dialect and gets gentle, accurate tone feedback.

- Elder pitch-target extraction (pYIN) in the audio worker; segment and word tagging tools for facilitators/linguists.
- `pronunciation-core`: YIN, speaker normalisation, banded DTW, syllable scoring. Golden fixtures shared with Python (05 §4). ADR 012.
- Learning module: words, lessons built only from published recordings, lesson packs for offline, progress merge.
- Unavailable-item handling when content is unpublished (S-03, S-04).
- Learner mode on mobile: Today, lessons (listen → speak → compare), proverb sheet, market-day calendar.
- Minor accounts + guardian model, capability restrictions (S-13). ADR 015.
- Validation study: scores compared with judgments from fluent speakers on a labelled set; tune thresholds before wider release.

**Release:** learner beta on iOS and Android (invite-only diaspora families).

**Exit criteria:** tone-score agreement with fluent-speaker judgments at an agreed target (set in the validation plan); scoring < 150 ms on a mid-range Android; children and guardians complete lessons unaided in usability tests.

---

## Phase 4: Web learner & Ọha (weeks 32–40)

**Goal:** the same product on the web, and the community around it.

- Web learner app (three-column layout from the prototype) using the same generated client and `pronunciation-core` in the browser.
- Ọha: circles, chronological posts, comments, moderation pairs, kin map (city-level, k-anonymity ≥ 5).
- Notifications (push, email) with preferences.
- Search (folded Igbo keys, FTS + trigram).
- Admin console: moderation pairs, reconciliation views, break-glass with auditing.
- Accessibility pass (WCAG 2.2 AA on web). Localisation of the UI and glosses for a second locale (e.g. `fr`), plus the pair coverage report.

**Release:** public beta (open sign-up, Ikpe still limited to verified kin).

**Exit criteria:** web and mobile behave identically on the shared scenario suite; authz matrix covers 100% of routes; moderation response within agreed times.

---

## Phase 5: Payments & launch (weeks 40–48)

**Goal:** elders are paid fairly and reliably; the system is ready for the public.

- Payments module: obligations on pass only, idempotent provider calls, webhooks, retries, `needs_attention` handling (INV-4, S-10). ADR 009.
- Beneficiary tokenisation; steward succession and deceased-elder flow (S-11).
- Load tests to the year-1 budgets (08); DR game day; restore drill; external penetration test.
- All runbooks written (09 §8); on-call rota; status page.
- Marketing site (static) and app store listings. Transparency page (takedown log, council charter, how Ikpe works).
- Mobile force-upgrade path and API compatibility window verified (S-16).

**Release:** v1.0 public launch.

**Exit criteria:** penetration test findings at high/critical = 0 open; restore drill within RTO; first real payouts reconciled end to end; council sign-off on launch.

---

## Phase 6: Scale & deepen (week 48 onward)

Prioritised by evidence, not by this list:
- More hometowns via founding circles; more dialects; bootstrap mode graduations.
- More gloss locales (pt, de, es…) driven by the pair coverage report.
- Live vote tallies (SSE) if polling becomes a problem.
- Sharded tally counters, search engine or media-service extraction **only** when 08 §6 metrics justify it (with an ADR).
- Facilitator tooling: transcription assistance, variant linking, batch tagging.
- The seven content pillars (proverbs, recipes, music, ceremonies, material culture, place histories) as dedicated archive views.
- A custodial vault for Nsọ material is a **separate** future decision, requiring council approval and its own ADR. It is not assumed by this roadmap.

---

## Cross-cutting tracks (every phase)

| Track | Ongoing work |
|---|---|
| Governance | council meetings, governance cases for config, charter revisions, transparency reports |
| Security | threat-model reviews on sensitive PRs, dependency patching SLAs, access reviews |
| Quality | scenario suite grows with every cross-module feature; invariant monitors per new rule |
| Research | elder and learner interviews each phase; tone-feedback validation refreshed when `algo_version` changes |
| Docs | ADRs recorded as decisions are made; module READMEs kept current; quarterly docs review |

## Top risks and mitigations

| Risk | Mitigation | Phase checked |
|---|---|---|
| Elders or families distrust the consent process | co-design with custodians, spoken consent, easy revocation without the original facilitator | 0–1 |
| Too few kin per hometown for quorum | bootstrap mode (LGA scope), founding circles, facilitator outreach | 2 |
| Tone scoring is inaccurate for some dialects | per-dialect validation sets, gentle wording, never numeric scores for minors, `algo_version` tracking | 3 |
| Sybil or brigading attacks on Ikpe | vouch accountability, account-age gates, anomaly detection, non-kin votes don't count | 2+ |
| Offline sync bugs lose recordings | client IDs, idempotency, checksum verification, chaos-proxy tests | 1 |
| Payout failures erode trust | obligations on pass, retries, visible status for facilitators, reconciliation | 5 |
| Scope creep delays launch | phase exit criteria; Phase 6 items require evidence | all |
