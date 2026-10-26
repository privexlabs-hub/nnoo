# 01 · Product requirements & business rules

> **Merged rules (ADR-031, 2026-10-25):** Ikpe outcomes and states, quorum seed values, kin verification, minors' ages, consent permissions and pitch bands were merged safety-first with _Business Brief v2.1_ Part II. Where a row below differs, [ADR-031](adr/0031-brief-v2-safety-first-merge.md) wins until the custodian council ratifies a version; all numbers are `governance_config` values.

> This file is the source of truth for **what** the system does. Code that disagrees with it is a bug. A rule that is wrong gets changed here first (see 10 §4), then in code.

## 1. Purpose

Nnọọ preserves living Igbo culture by recording elders with consent, validating recordings through the community, and teaching diaspora learners, children especially, with tonal pronunciation feedback.

Two hands, one body:

- **Aka nri (learn):** lessons, tone feedback, proverbs, the calendar.
- **Aka ekpe (keep):** the facilitator recording flow, Ikpe validation, the Ọbá archive, Ọha community.

## 2. Principles that constrain every feature

1. **Igbo enwe eze.** No single actor publishes, passes a case, changes a vote or overrides consent. Collective decisions follow pre-declared rules.
2. **The voice belongs to the elder.** Consent comes first, is specific, can be revoked, and wins every conflict.
3. **Kin decide for their hometown.** Validation weight comes from verified members of the recording's hometown.
4. **Dialect is identity.** Every Igbo string carries a dialect. Diacritics and tone marks are preserved byte for byte (Unicode NFC).
5. **Warm, not gamified.** No streak penalties, no leaderboards, no engagement-ranked feeds.
6. **Offline is normal.** Recording in villages and learning on the move must work without a connection.
7. **Minimum data.** Learner voice stays on the device by default. Location is city-level at most.

## 3. Actors and roles

Roles are **scoped grants**, not global flags. One account can hold several.

| Role        | Scope             | Obtained by                                | Can never                                                             |
| ----------- | ----------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Visitor     | none              | —                                          | play Umunna audio, vote, post                                         |
| Learner     | global            | sign-up                                    | vote toward quorum (unless also kin)                                  |
| Kin         | hometown          | vouching (§7)                              | vote on a case they facilitated or where they are the elder's steward |
| Facilitator | hometown(s)       | training + 2 custodian sign-offs           | publish, vote on own case, edit consent after capture                 |
| Elder       | own recordings    | consent capture (often without an account) | — (holds consent rights)                                              |
| Steward     | one elder         | named in consent record                    | widen consent beyond what the elder granted                           |
| Guardian    | minor account     | linking at minor sign-up                   | —                                                                     |
| Custodian   | hometown / domain | council appointment (§10)                  | act alone; every custodian decision is a panel                        |
| Moderator   | global            | ops appointment                            | publish, vote, alter tallies; takedowns need 2 moderators             |
| Operator    | infra             | employment                                 | read media or votes outside an audited break-glass session            |

**Minors** (under 16 by default, or the local age of digital consent if higher) can learn, listen to Ọha-tier content and keep a profile. They cannot post in Ọha, appear on the kin map, vote in Ikpe or be contacted by adults outside guardian-approved circles.

## 4. Surfaces and capabilities

| Capability              | iOS / Android      | Web learner | Facilitator mode | Marketing   | Admin              |
| ----------------------- | ------------------ | ----------- | ---------------- | ----------- | ------------------ |
| Lessons + tone feedback | ✓ offline          | ✓ online    | —                | —           | —                  |
| Ọbá browse / play       | ✓ cache            | ✓           | ✓                | sample only | read-only, audited |
| Ikpe vote / comment     | ✓                  | ✓           | ✓ (not own)      | —           | —                  |
| Record elder + consent  | ✓ (phone fallback) | —           | ✓ offline        | —           | —                  |
| Ọha circles / posts     | ✓                  | ✓           | ✓                | —           | moderation         |
| Kin vouching            | ✓                  | ✓           | ✓ in person      | —           | —                  |
| Payout status           | —                  | —           | ✓ own sessions   | —           | ✓ reconciliation   |
| Takedown                | —                  | —           | —                | —           | ✓ two-person       |

Clients never decide whether something is allowed. Each resource response includes `capabilities: { canVote, canComment, canPlay, … }` computed by the server. Clients show or hide controls from that.

## 5. Content lifecycle

```
            capture (offline ok)
 Draft ───────────────────────────► Submitted ──► Ikpe case: open ◄──┐
   │                                                │   │   │        │ unpause
   │ facilitator discards                           │   │   └─► paused (flag)
   ▼                                                │   │
 Discarded                                          │   └──► returned ──► Draft (new revision)
                                                    ▼
                                                 Passed ──► Published (Ọbá and/or Ọha)
                                                                │
                         consent revoked / takedown ──────────► Unpublished
 Consent revoked at any earlier state ──► Withdrawn (terminal for that recording)
```

- A **recording** has many **revisions** (transcript, translation, tags). Audio is immutable per recording; new audio means a new recording.
- An **Ikpe case** reviews exactly one revision. A metadata amendment during review creates a new revision. Votes carry over, and voters are notified and may change their vote.
- **Published** is the only state that is playable in Ọbá.

## 6. Ikpe: the council rules

All numbers are _defaults_, configurable per hometown through governance (10 §4). The config is versioned, and every case stores the config version it opened under.

**Eligibility to vote**

- Verified identity level ≥ `basic` (phone verified), account age ≥ 7 days, not a minor.
- Not the case's facilitator, the elder, or the elder's steward.
- Anyone eligible may vote and comment. **Only kin of the recording's hometown count toward quorum and outcome.** Other votes are shown as "voices from elsewhere".

**Quorum** is fixed when the case opens and never moves:

```
quorum_required = clamp(ceil(0.05 × verified_active_kin(hometown)), 10, 60)
```

`verified_active_kin` = verified kin active in the last 90 days.

**Bootstrap mode.** If a hometown has fewer than 20 verified active kin, kin of the same LGA count toward quorum. The case shows a visible "bootstrap" label.

**Outcome**, evaluated after every vote, flag change and scheduled sweep:

| Condition (kin votes only)                                                                             | Result                               |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Open blocking flag                                                                                     | `paused` (the clock stops)           |
| quorum met AND `no / all_kin_votes > 1/3`                                                              | `returned` (rejected, with comments) |
| quorum met AND `now ≥ opened_at + 72h` AND `keep / (keep + no) ≥ 2/3` AND `wait / all_kin_votes < 1/3` | `passed`                             |
| `now ≥ opened_at + 30d` and not passed                                                                 | `returned` (timeout)                 |
| otherwise                                                                                              | `open`                               |

- One account, one vote per case. Votes can change until the case closes. Every change is kept in an append-only history.
- **Wait** means "needs more". It blocks passing without rejecting. The facilitator sees aggregated wait reasons.
- **Flags** (consent concern, should be Nsọ, misattribution, harm) can be raised by any eligible voter. A flag pauses the case and goes to a **panel of 3** drawn at random from custodians and long-standing kin of that hometown. The panel decides by majority within 7 days, or the case is returned. No single person resolves a flag.
- Comments are one level deep. Elders get an _Elder_ badge (verified by a facilitator in person). Comments are hidden only by moderator pairs, and hidden comments are kept for audit.

## 7. Kin verification

A candidate becomes kin of a hometown when **either**:

- (a) 2 verified kin of that hometown, each with account age ≥ 30 days, vouch for them, **or**
- (b) 1 facilitator of that hometown verifies them in person, plus 1 vouch.

**Accountability.** If an account is removed for fraud, everyone who vouched for it loses vouching rights for 180 days. Repeat offences remove vouching rights permanently.

**Founding circle (exception).** A new hometown starts with ≥ 5 people verified in person by two facilitators from different hometowns. This is logged as a governance event.

A person can be kin of up to **3** hometowns (mother's, father's, residence of origin).

## 8. Consent rules

- Captured **before** recording starts. Evidence is a spoken consent statement (audio) plus an optional photographed form. Oral consent is fully valid; literacy is not required.
- **Tiers:**
  - `oha`: public.
  - `umunna`: verified kin of the listed hometowns or lineages only.
  - `nso`: metadata only. **The platform never stores or serves Nsọ audio.** The upload API rejects media for `nso` recordings.
- Consent is versioned. **Narrowing** a tier, or revoking, takes effect immediately. **Widening** needs a new consent capture from the elder, or from the steward only within what the elder pre-authorised.
- Revocation SLA: unplayable everywhere (API, CDN, offline caches on next sync) within **15 minutes**.
- **Steward succession** is named at capture. If none is named, the elder's consent freezes at its current tier and can only be narrowed. Family requests go to a custodian panel.

## 9. Payments

- Each elder recording that **passes** Ikpe creates **one** payout obligation to the elder or their designated beneficiary. The amount follows the published schedule (default ₦15,000 per session).
- Never paid on submission. Never paid twice: there is a unique idempotency key per recording.
- No clawback if consent is later revoked.
- Facilitator stipends are a separate obligation type. They are paid on passed cases, never per upload.
- Payout failures retry with backoff. After 5 failures the obligation becomes `needs_attention` and is surfaced to the facilitator and ops.

## 10. Custodians and the council

- Custodians are appointed by a **2/3 vote of existing custodians plus kin ratification** (Ikpe-style case, type `governance`). There is no founder or admin appointment after bootstrap.
- Custodians act only in panels (≥ 3, random draw, odd number). The panel's identities and decisions are recorded, and panelists may write a short rationale.
- **Nsọ access** requests (a person asking to hear restricted knowledge offline) go to a panel of the relevant hometown's custodians. The platform records the decision only; the knowledge transfer happens off-platform.

## 11. Learning rules

- Lessons are built only from **published** recordings. If a recording is unpublished, its lesson items become `unavailable`. Lessons with fewer than 3 available items are hidden until rebuilt. Learner progress on those items is kept.
- **Tone feedback:** three outcomes, always gentle:

  | Score     | Igbo              | English                                   |
  | --------- | ----------------- | ----------------------------------------- |
  | ≥ 0.80    | "Ọ dị mma."       | Good.                                     |
  | 0.55–0.80 | "Fọdụrụ ntakịrị." | A little more. Names the syllable to fix. |
  | < 0.55    | —                 | Invitation to listen again.               |

  Minors never see numeric scores.

- Learner audio is processed **on the device** by default. Uploading samples to improve the models requires explicit opt-in (guardian opt-in for minors) and can be withdrawn.
- Progress has no punishing streaks. "The words wait."
- Default dialect = the learner's first kin hometown dialect, or chosen at onboarding. Lessons prefer elders of that dialect, then the nearest dialects.

## 12. Ọha community

- Circles are hometown-based or city-based. Posts are chronological; there is no engagement ranking.
- **Kin map:** opt-in, city-level only, minimum 5 members per displayed cell (otherwise shown as a count only).
- Recordings shared to Ọha follow the same tier rules as Ọbá.

## 13. Calendar

The four-day market cycle (Eke, Orie, Afọ, Nkwo) is computed from a governance-approved anchor date in `Africa/Lagos` time. See 03 §8 for the algorithm. Communities may record local variants of the anchor. Display defaults to the learner's first hometown's variant.

## 14. Invariants: must never happen

Each invariant has a DB constraint, a test and a production monitor (09 §6).

| ID     | Invariant                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------- |
| INV-1  | A recording is playable in Ọbá without a `passed` Ikpe case for its current published revision. |
| INV-2  | Nsọ audio exists in platform storage or is served.                                              |
| INV-3  | Umunna audio is served to a non-kin account.                                                    |
| INV-4  | A payout is made twice, or before the case passed.                                              |
| INV-5  | A single account's action alone causes publication, a pass, or a vote change by someone else.   |
| INV-6  | A facilitator, elder or steward votes on their own case.                                        |
| INV-7  | Revoked content stays playable 15 minutes after revocation.                                     |
| INV-8  | Learner voice is uploaded without a recorded opt-in.                                            |
| INV-9  | Igbo text is stored non-NFC or with tone marks stripped.                                        |
| INV-10 | A precise location (finer than city) is stored or exposed.                                      |
| INV-11 | Votes, tallies or audit rows are updated or deleted by any admin path.                          |
| INV-12 | A minor is contactable by an adult outside a guardian-approved circle.                          |

## 15. Exceptions and edge cases

| Situation                               | Rule                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Elder dies before the case closes       | Case continues. Consent passes to the steward. Payout goes to the beneficiary.                                                                                    |
| No connectivity at capture              | Everything is stored encrypted on the device and synced later. Consent evidence must sync before or with the audio.                                               |
| Dialect label disputed in Ikpe          | Raise a misattribution flag → panel. The panel may relabel, which creates a new revision.                                                                         |
| Hometown has < 20 kin                   | Bootstrap mode (§6).                                                                                                                                              |
| Legal or safety takedown                | Two moderators approve. Content is unpublished immediately. A public transparency log entry is made (reason category only). Kin can see that a takedown occurred. |
| Facilitator account compromised         | All of their open cases are paused. Consent records stay valid (they belong to the elders).                                                                       |
| Duplicate recording of the same telling | Allowed. They are linked as "variants", because variants are cultural data.                                                                                       |
| Learner travels and changes timezone    | The calendar stays on Lagos time. Lessons stay local-time.                                                                                                        |
| Mobile app too old for the API          | The server returns `426 Upgrade Required` with a store link. Offline content keeps working read-only.                                                             |

## 16. Non-functional requirements (summary)

- **Availability:** 99.5% monthly for the API. Offline paths have no dependency on the API.
- **Latency:** API p95 < 300 ms. Lesson start < 2 s on a 3G-class connection.
- **Data:** RPO ≤ 5 min, RTO ≤ 4 h.
- **Accessibility:** WCAG 2.2 AA on web; platform accessibility APIs on mobile.
- **Privacy:** Nigeria Data Protection Act 2023, UK/EU GDPR and US children's-privacy rules, given where learners live. Legal review is required before launch. This doc is not legal advice.
