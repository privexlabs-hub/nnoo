# 07 · Testing & quality control

## 1. What we test for

Each feature must work **alone**, **together with every feature that touches the same state**, and **when things fail** (offline, retries, partial outages, concurrent users).

## 2. Test layers

| Layer                   | Tool                                | Scope                                                                    | Runs                       |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------ | -------------------------- |
| Domain unit             | Vitest                              | pure rules: `evaluate()`, eligibility, policies, state machines, scoring | every commit, < 30 s       |
| Property-based          | fast-check                          | Ikpe outcome, tally arithmetic, market day, NFC round-trips              | every commit               |
| Integration             | Vitest + Testcontainers Postgres    | use case + real DB + triggers + constraints                              | every PR                   |
| Contract                | OpenAPI diff + schema tests         | API compat with the previous release and generated clients               | every PR                   |
| Cross-feature scenarios | scenario runner (`tools/scenarios`) | multi-actor stories across modules                                       | every PR                   |
| Authz matrix            | generated                           | every route × every role/scope × resource state                          | every PR                   |
| E2E web                 | Playwright                          | critical journeys on the web learner app                                 | PR (smoke), nightly (full) |
| E2E mobile              | Maestro                             | learner + facilitator journeys, offline toggles                          | nightly + release          |
| Audio golden            | pytest + Vitest                     | WAV fixtures → contour/score within tolerance, Python vs TS parity       | every PR touching audio    |
| Migration               | apply on a prod-like snapshot       | expand/contract safety, duration, locks                                  | every PR with a migration  |
| Load                    | k6                                  | 08 budgets                                                               | weekly + before release    |
| Accessibility           | axe (web), platform a11y checks     | WCAG 2.2 AA                                                              | PR (web), release (mobile) |

## 3. Domain tests: examples that must exist

- `evaluate()` truth table covering every row in 01 §6, including boundary values (exactly 2/3, exactly quorum, exactly 72 h).
- Eligibility: the facilitator, elder and steward are rejected. A minor is rejected. An account aged 6d23h is rejected.
- State machines: every disallowed transition throws with a stable error code.
- `pronunciation-core`: an identical contour scores 1.0. A pitch-shifted identical contour (child vs elder) scores ≥ 0.95, which proves speaker normalisation works. An inverted L-H scores < 0.55.

## 4. Property tests (Ikpe)

For random sequences of votes, vote changes, flags, unpauses and clock advances:

- The tally always equals the recomputation from `ikpe_vote` rows.
- A case never passes before `min_close_at + paused_total`.
- A case never passes with kin `no` share > 1/3.
- The outcome is independent of vote **order** (only the final votes matter).
- Once closed, the status never changes.
- Non-kin votes never change the outcome.

## 5. Cross-feature scenario suite

Each scenario is an executable story with multiple actors against a real API and DB, plus a fake clock and fake providers. **A new feature that reads or writes another module's state must add or extend a scenario.**

| ID   | Scenario                                                                | Asserts                                                                                                                           |
| ---- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | Facilitator records offline → syncs → submits → kin reach quorum → pass | publication exists, payout obligation exactly once, lesson builder event                                                          |
| S-02 | Consent revoked **while the case is open** with 40 votes                | case withdrawn, no publication, no payout, voters notified, audio purged                                                          |
| S-03 | Consent revoked **after publish**, recording used in 2 lessons          | unpublished, CDN purged ≤ 15 min, lesson items unavailable, lesson hidden if < 3 items, learner progress kept, no payout clawback |
| S-04 | Consent narrowed Ọha → Umunna after publish                             | non-kin play → 403, kin play OK, cached offline copies purged for non-kin on sync                                                 |
| S-05 | Vote cast offline, case passes before the device reconnects             | replay rejected with `ikpe.case_closed`, friendly message, tally unchanged                                                        |
| S-06 | Same vote replayed 3× (flaky network)                                   | one vote event, idempotent response                                                                                               |
| S-07 | Flag raised at 71 h → panel dismisses at day 5                          | deadlines shifted by the paused duration, case can pass afterwards                                                                |
| S-08 | Facilitator tries to vote on own case via web after recording on tablet | 403 `ikpe.not_eligible` on every client                                                                                           |
| S-09 | A voucher is banned for fraud                                           | vouching rights suspended, kin they vouched for flagged for re-verification, open-case votes keep `counts_for_quorum` as frozen   |
| S-10 | Payout provider times out, then the webhook arrives twice               | one success, no double pay                                                                                                        |
| S-11 | Elder dies mid-case, steward named                                      | case continues, payout to beneficiary                                                                                             |
| S-12 | Metadata amended during review                                          | new revision, votes carried, voters notified, `If-Match` stale edit rejected                                                      |
| S-13 | Minor account browses Ọbá and opens Ọha                                 | Ọha-tier only, no post button (capabilities false), no map presence                                                               |
| S-14 | Hometown in bootstrap mode → crosses 20 kin mid-case                    | open case keeps frozen LGA scope, new cases use hometown scope                                                                    |
| S-15 | Upload attempted for an Nsọ recording via a crafted request             | rejected at policy, API and DB trigger. Alert fires.                                                                              |
| S-16 | Mobile client one major version behind                                  | `426` with upgrade info. Offline lessons still play.                                                                              |

## 6. Authz matrix (no insecure endpoints)

`tools/authz-matrix` reads the route registry and the policy table and generates a test per `(route, actor fixture, resource fixture)`. The expected result comes from the declared policy. Fixtures include: anonymous, learner, minor, kin (same/other hometown), facilitator (own/other case), steward, custodian, moderator, operator without break-glass.

The test fails if:

- a route exists that is not in the matrix,
- any cell returns 2xx where the policy says deny,
- a response contains fields not in its allow-listed schema.

## 7. Offline and resilience tests

- The mobile sync engine runs against a chaos proxy (drops, 30 s latency, duplicate deliveries, reordered responses).
- Resumable upload: kill the app at 10/50/99% → resume → identical SHA-256.
- Local DB migration from every shipped `schema_version` to the current one.

## 8. Text and language tests

- Every Igbo string fixture round-trips client → API → DB → API → client byte-identical (NFC). This covers combining marks (`ụ̀`, `ọ́`) and precomposed variants.
- Search: `ulo` finds `ụlọ`. Display shows `ụlọ`.
- Gloss fallback chain per locale pair (`fr` → `en`), and `gloss_locale` reported correctly.

## 9. CI gates (merge blocked unless green)

Typecheck · lint (incl. module boundaries, no hard-coded strings/colors) · unit + property · integration · contract diff (no breaking change in `/v1`) · scenarios · authz matrix · migration check · bundle size budgets (web ≤ 250 KB gz initial; mobile OTA update ≤ 5 MB) · CodeQL · secret scan.

## 10. Definition of done

- [ ] Rule documented (01 or an ADR) and linked in the PR.
- [ ] Domain tests + integration test + scenario (if cross-module).
- [ ] Works offline or degrades as specified.
- [ ] Copy reviewed for tone (no gamified or alarmist language) and diacritics.
- [ ] Capabilities exposed, and the client uses them (no client role checks).
- [ ] Observability: metrics/logs for new failure paths.
- [ ] Docs updated (module manifest, 03 if schema changed).
