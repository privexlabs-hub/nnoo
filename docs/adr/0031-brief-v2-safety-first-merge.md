# ADR-0031: Business Brief v2 rules merged safety-first

Status: Accepted by the product owner (2026-10-25). **Pending ratification by the custodian council**
(10 §3–4): cultural rules belong to the council. Until ratified, every number below is a seeded
`governance_config` v1 value, changeable through a governance case without code changes.
Date: 2026-10-25

## Context

Two sources specify the same rules differently:

- `docs/01-product-requirements.md` (from the engineering docs, "the law"), and
- _Nnọọ Business Brief v2.1_ Part II (September 2026, `docs/nnoo brand identity and marketing
system/`), whose rules are marked "Proposed default — confirm with the elder council".

The product owner chose a **safety-first merge**: keep every invariant that stops a single actor
from deciding alone (INV-5, "Igbo enwe eze") and every protection for elders, children and
restricted knowledge; adopt the Brief's newer product concepts where they do not weaken those.

## Decision

### Kept from the engineering docs (safety)

| Topic           | Rule kept                                                                | Brief proposal not adopted, and why                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single actors   | No single account publishes, passes, holds, appoints or resolves (INV-5) | "Staff can pause a case", "confirmed by staff", "approved by staff" → single-person powers. Replaced by: safety hold = 2 moderators + 1 custodian, temporary, restriction-only (10 §4); facilitator approval = training + 2 custodian sign-offs; custodian appointment = custodian 2/3 + kin ratification |
| Small hometowns | Bootstrap mode: LGA-scope kin count; or a custodian **panel**            | "5 kin + the custodian's approval" (one custodian decides)                                                                                                                                                                                                                                                |
| Revocation      | Unplayable everywhere within **15 minutes** (INV-7)                      | "Tier change within 24 h, withdrawal within 48 h": too slow. The Brief's times become the outer bound for non-playback surfaces (search index rebuilds, social posts)                                                                                                                                     |
| Custodians      | Always act as panels (≥ 3, random, odd)                                  | Single custodian validating or opening Nsọ access                                                                                                                                                                                                                                                         |
| Nsọ             | Audio never stored or served (INV-2); access decisions recorded only     | (same in both)                                                                                                                                                                                                                                                                                            |
| Moderation      | Hiding needs a moderator pair                                            | adopted below with an addition: auto-hide is a _restriction_ pending review                                                                                                                                                                                                                               |

### Adopted from the Brief (new concepts)

| Topic                 | Rule adopted                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Case states           | `open`, `paused` (flag), `on_hold` (safety hold), `passed`, `returned` (Wait > 1/3), **`declined`** (No > 1/3: not published, the audio stays with the family, told privately and kindly), **`expired`** (quorum not reached in 28 days; can be resubmitted), `withdrawn` |
| Outcome thresholds    | Pass: kin quorum reached and ≥ 2/3 of kin votes are Keep, after the minimum open time (72 h). Return if Wait > 1/3. Decline if No > 1/3                                                                                                                                   |
| Quorum (seed)         | 10% of the hometown's verified active kin, clamped to 10–40                                                                                                                                                                                                               |
| Time limits (seed)    | Day 14: facilitator and organiser prompted to invite kin; day 28: expire                                                                                                                                                                                                  |
| Resubmission          | A returned or expired case resubmits as a new revision; votes reset (a metadata amendment _during_ review still carries votes, 01 §5)                                                                                                                                     |
| Listening             | Listening to ≥ 80% of the recording is required before voting (playback progress recorded server-side)                                                                                                                                                                    |
| Who votes             | Verified kin of the hometown, aged **18+**; facilitator, elder, steward **and the elder's immediate family** comment but do not count                                                                                                                                     |
| Who sees a case       | Ọha-tier: signed-in members 18+; Umunna-tier: verified kin of that hometown only; Nsọ never enters open Ikpe (custodian panel + 3 initiated elders)                                                                                                                       |
| Hometowns             | One hometown for Ikpe purposes; a second for listening only (01 §7 allowed 3)                                                                                                                                                                                             |
| Kin verification      | Two attestations, from: verified kin (account ≥ 30 days), an organiser with the Ndụmọdụ badge, a facilitator in person. Never a single attestation                                                                                                                        |
| Minors                | Under 13: a child profile inside a guardian's account. 13–17: learn and read Ọha, no posting, no voting, no map. 18+ to vote                                                                                                                                              |
| Consent               | Spoken statement + tap/signature; witness for those who cannot read or sign; **separate yes/no permissions**: archive (Ọbá), lessons, social media, photo; a named family representative (the steward)                                                                    |
| Withdrawal            | Lesson clips are replaced by another elder's voice where possible (otherwise the item is unavailable, 01 §11)                                                                                                                                                             |
| Progress              | "Days practised this week" everywhere, never a streak that breaks (resolves Brief §18 "Streaks")                                                                                                                                                                          |
| Pitch feedback (seed) | ≥ 0.85 "Ọ dị mma"; 0.60–0.85 "Fọdụrụ ntakịrị" with the syllable; < 0.60 replay the elder. Minors never see numbers                                                                                                                                                        |
| Community safety      | Three member reports hide a post pending moderator-pair review                                                                                                                                                                                                            |
| Notifications         | At most one practice reminder a day; none 21:00–08:00 local time; every type can be switched off                                                                                                                                                                          |
| Roles                 | `organiser` (community organiser, Ndụmọdụ badge) added to `role_kind`                                                                                                                                                                                                     |

### Scheduling (product owner)

Subscriptions (free core; paid/family plan; store + card billing) and sponsored sessions (funds held
by Nnọọ, refunded after 60 days if the session does not happen) are added to **Phase 5** behind
`PaymentsPort`. Never behind a paywall: the archive (Ọha tier), Ikpe, Ọha and consent controls.

## Consequences

- `docs/01-product-requirements.md` §6–§12 carry a "Merged rules (ADR-031)" note; the old values
  remain visible there for the council's review.
- Ikpe, consent and payments are AGENTS.md "stop and ask" areas: each gets a written plan before
  code, as the modules are built (Phases 1, 2, 5).

## Revisit when

The council ratifies or changes any value: through a governance case (config) or an ADR (rule).
