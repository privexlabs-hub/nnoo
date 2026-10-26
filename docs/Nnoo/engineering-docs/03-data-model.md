# 03 · Data model & database design

## 1. Conventions

| Concern | Rule |
|---|---|
| IDs | UUIDv7 (time-ordered, client-generatable for offline). Never expose sequential IDs. |
| Time | `timestamptz`, UTC. Columns named `*_at`. Calendar dates as `date` with an explicit tz note. |
| Text | Igbo stored **NFC**, validated by a `CHECK (text = normalize(text, NFC))` constraint. Never stripped. A separate generated `*_search` column holds the folded form for search only. |
| Money | `amount_minor bigint` + `currency char(3)`. No floats. |
| Enums | Postgres enums for closed sets (status, tier). Lookup tables for open sets (dialects, topics). |
| Ownership | Every table is owned by exactly one module, recorded in a `COMMENT ON TABLE` ("owner: ikpe"). Lint checks that queries touch only their module's tables. |
| History | State changes that matter are append-only (`*_events`, `*_revisions`). Current state tables are projections. |
| Deletion | Hard delete for revoked media and personal data on erasure. Soft delete (`*_at` tombstone) for content that must leave a trace (comments, posts). Audit is never deleted inside the retention period. |
| Localisation | Igbo source in a dedicated column. Glosses in `jsonb` keyed by BCP 47 locale (`{"en": "...", "fr": "..."}`), with a `CHECK` that it is an object and a domain validator for keys. |

## 2. Entity overview

```
account ─┬─< role_grant (scope: hometown | elder | global)
         ├─< kin_membership >── hometown >── lga >── state
         ├─< vouch (as voucher / candidate)
         ├─< guardianship (guardian ↔ minor)
         └─< device / session

hometown ─< hometown_dialect >─ dialect (tree: parent_id)

elder_profile ── hometown, dialect, steward(account?)
   └─< recording ── facilitator(account), hometown, dialect
          ├─< consent_record (versioned; tier)
          ├─< recording_revision (transcript, glosses, tags)
          ├─< media_asset (raw, derivatives, consent evidence)
          ├─< ikpe_case (one per reviewed revision)
          │     ├─< ikpe_vote  (PK case+voter)  ─< ikpe_vote_event (append-only)
          │     ├── ikpe_tally (1:1 projection)
          │     ├─< ikpe_comment
          │     └─< ikpe_flag ─< panel_member
          ├─< publication (surface: oba | oha)
          └── payout_obligation (unique per recording+type)

word ─< lesson_item >─ lesson ;  lesson_item ── recording, tone_target
account ─< learner_progress, learner_attempt (scores only)
circle ─< circle_member, post ─< post_comment ; map_presence (city-level)
governance_config (versioned) ; calendar_anchor ; audit_log ; outbox_event
```

## 3. Core DDL (abridged, canonical shapes)

The canonical source is the migrations in `apps/api/migrations`. This shows the shapes and the constraints that enforce business rules.

```sql
-- identity ---------------------------------------------------------------
CREATE TYPE account_status AS ENUM ('active','suspended','erased');
CREATE TABLE account (
  id uuid PRIMARY KEY,
  phone_e164 text UNIQUE,            -- OTP identity; nullable for minors
  email citext UNIQUE,
  display_name text NOT NULL CHECK (display_name = normalize(display_name, NFC)),
  birth_year smallint,               -- minors detection; never full DOB
  is_minor boolean NOT NULL,
  ui_locale text NOT NULL DEFAULT 'en',
  identity_level text NOT NULL DEFAULT 'none' CHECK (identity_level IN ('none','basic','in_person')),
  status account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TYPE role_kind AS ENUM ('learner','kin','facilitator','custodian','moderator','operator');
CREATE TABLE role_grant (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES account,
  role role_kind NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('global','hometown')),
  scope_id uuid,                     -- hometown id when scoped
  granted_via text NOT NULL,         -- 'vouch' | 'panel:<id>' | 'bootstrap' — never 'admin'
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK ((scope_type='global') = (scope_id IS NULL))
);
CREATE UNIQUE INDEX role_grant_active ON role_grant(account_id, role, scope_type, coalesce(scope_id,'00000000-0000-0000-0000-000000000000'))
  WHERE revoked_at IS NULL;
CREATE TABLE guardianship (
  guardian_id uuid NOT NULL REFERENCES account,
  minor_id uuid NOT NULL REFERENCES account,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guardian_id, minor_id),
  CHECK (guardian_id <> minor_id)
);

-- community --------------------------------------------------------------
CREATE TABLE state (id uuid PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE lga   (id uuid PRIMARY KEY, state_id uuid NOT NULL REFERENCES state, name text NOT NULL, UNIQUE(state_id,name));
CREATE TABLE hometown (
  id uuid PRIMARY KEY, lga_id uuid NOT NULL REFERENCES lga,
  name text NOT NULL CHECK (name = normalize(name, NFC)),
  name_search text GENERATED ALWAYS AS (lower(igbo_fold(name))) STORED,
  bootstrap_mode boolean NOT NULL DEFAULT true,
  UNIQUE (lga_id, name)
);
CREATE TABLE dialect (id uuid PRIMARY KEY, name text NOT NULL UNIQUE, parent_id uuid REFERENCES dialect);
CREATE TYPE kin_status AS ENUM ('pending','verified','revoked');
CREATE TABLE kin_membership (
  account_id uuid NOT NULL REFERENCES account,
  hometown_id uuid NOT NULL REFERENCES hometown,
  status kin_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz, verified_via text,
  last_active_at timestamptz,
  PRIMARY KEY (account_id, hometown_id)
);
-- max 3 hometowns enforced by trigger kin_membership_limit()
CREATE TABLE vouch (
  voucher_id uuid NOT NULL REFERENCES account,
  candidate_id uuid NOT NULL REFERENCES account,
  hometown_id uuid NOT NULL REFERENCES hometown,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (voucher_id, candidate_id, hometown_id),
  CHECK (voucher_id <> candidate_id)
);

-- archive + consent ------------------------------------------------------
CREATE TABLE elder_profile (
  id uuid PRIMARY KEY,
  display_name text NOT NULL CHECK (display_name = normalize(display_name, NFC)),
  hometown_id uuid NOT NULL REFERENCES hometown,
  dialect_id uuid NOT NULL REFERENCES dialect,
  birth_year smallint, deceased_at date,
  steward_account_id uuid REFERENCES account,
  beneficiary jsonb NOT NULL,          -- payout destination token, never raw bank data
  created_by uuid NOT NULL REFERENCES account,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TYPE recording_status AS ENUM ('draft','in_review','published','returned','withdrawn','unpublished','discarded');
CREATE TYPE consent_tier AS ENUM ('oha','umunna','nso');
CREATE TABLE recording (
  id uuid PRIMARY KEY,                 -- client-generated (offline)
  elder_id uuid NOT NULL REFERENCES elder_profile,
  facilitator_id uuid NOT NULL REFERENCES account,
  hometown_id uuid NOT NULL REFERENCES hometown,
  dialect_id uuid NOT NULL REFERENCES dialect,
  topic text NOT NULL,                 -- lookup key
  status recording_status NOT NULL DEFAULT 'draft',
  tier consent_tier NOT NULL,          -- cached from active consent; trigger-maintained
  current_revision_id uuid,
  recorded_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE consent_record (
  id uuid PRIMARY KEY,
  recording_id uuid NOT NULL REFERENCES recording,
  version int NOT NULL,
  tier consent_tier NOT NULL,
  umunna_scope uuid[],                 -- hometown ids when tier = umunna
  steward_may_widen_to consent_tier,   -- pre-authorisation, nullable
  evidence_media_id uuid,              -- spoken statement
  captured_by uuid NOT NULL REFERENCES account,
  captured_at timestamptz NOT NULL,
  revoked_at timestamptz, revoked_by uuid, revocation_reason text,
  UNIQUE (recording_id, version),
  CHECK ((tier='umunna') = (umunna_scope IS NOT NULL))
);
CREATE UNIQUE INDEX consent_one_active ON consent_record(recording_id) WHERE revoked_at IS NULL;

CREATE TABLE recording_revision (
  id uuid PRIMARY KEY,
  recording_id uuid NOT NULL REFERENCES recording,
  rev int NOT NULL,
  title_ig text NOT NULL CHECK (title_ig = normalize(title_ig, NFC)),
  transcript_ig text CHECK (transcript_ig = normalize(transcript_ig, NFC)),
  glosses jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(glosses)='object'),  -- {locale: {title, translation}}
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES account,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recording_id, rev)
);
CREATE TYPE surface AS ENUM ('oba','oha');
CREATE TABLE publication (
  id uuid PRIMARY KEY,
  recording_id uuid NOT NULL REFERENCES recording,
  revision_id uuid NOT NULL REFERENCES recording_revision,
  ikpe_case_id uuid NOT NULL,          -- INV-1: FK to a passed case (checked by trigger)
  surface surface NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  unpublished_at timestamptz, unpublish_reason text
);
CREATE UNIQUE INDEX publication_live ON publication(recording_id, surface) WHERE unpublished_at IS NULL;

-- media ------------------------------------------------------------------
CREATE TYPE media_kind AS ENUM ('audio_raw','audio_opus','audio_aac','peaks','consent_evidence','image');
CREATE TABLE media_asset (
  id uuid PRIMARY KEY,
  recording_id uuid REFERENCES recording,
  kind media_kind NOT NULL,
  storage_key text NOT NULL UNIQUE,    -- opaque: <kind>/<uuid>
  sha256 bytea NOT NULL, bytes bigint NOT NULL, duration_ms int, mime text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','uploaded','ready','purged')),
  created_at timestamptz NOT NULL DEFAULT now(), purged_at timestamptz
);
-- INV-2: trigger media_no_nso() rejects audio_* rows whose recording.tier = 'nso'

-- ikpe -------------------------------------------------------------------
CREATE TYPE case_status AS ENUM ('open','paused','passed','returned','withdrawn');
CREATE TABLE ikpe_case (
  id uuid PRIMARY KEY,
  recording_id uuid NOT NULL REFERENCES recording,
  revision_id uuid NOT NULL REFERENCES recording_revision,
  kind text NOT NULL DEFAULT 'recording' CHECK (kind IN ('recording','governance')),
  status case_status NOT NULL DEFAULT 'open',
  config_version int NOT NULL,         -- rules frozen at open
  quorum_required int NOT NULL CHECK (quorum_required BETWEEN 1 AND 1000),
  quorum_scope text NOT NULL CHECK (quorum_scope IN ('hometown','lga_bootstrap')),
  opened_at timestamptz NOT NULL DEFAULT now(),
  min_close_at timestamptz NOT NULL,
  timeout_at timestamptz NOT NULL,
  paused_total interval NOT NULL DEFAULT '0',
  closed_at timestamptz, outcome_reason text,
  CHECK (min_close_at > opened_at AND timeout_at > min_close_at)
);
CREATE UNIQUE INDEX ikpe_one_open_per_recording ON ikpe_case(recording_id) WHERE status IN ('open','paused');
CREATE TYPE vote_choice AS ENUM ('keep','wait','no');
CREATE TABLE ikpe_vote (
  case_id uuid NOT NULL REFERENCES ikpe_case,
  voter_id uuid NOT NULL REFERENCES account,
  choice vote_choice NOT NULL,
  counts_for_quorum boolean NOT NULL,  -- kin of scope at cast time (frozen)
  wait_reason text,
  cast_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  PRIMARY KEY (case_id, voter_id)
);
CREATE TABLE ikpe_vote_event (           -- append-only; INV-11
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id uuid NOT NULL, voter_id uuid NOT NULL,
  old_choice vote_choice, new_choice vote_choice NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ikpe_tally (
  case_id uuid PRIMARY KEY REFERENCES ikpe_case,
  kin_keep int NOT NULL DEFAULT 0, kin_wait int NOT NULL DEFAULT 0, kin_no int NOT NULL DEFAULT 0,
  other_keep int NOT NULL DEFAULT 0, other_wait int NOT NULL DEFAULT 0, other_no int NOT NULL DEFAULT 0,
  CHECK (least(kin_keep,kin_wait,kin_no,other_keep,other_wait,other_no) >= 0)
);
CREATE TABLE ikpe_comment (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES ikpe_case,
  author_id uuid NOT NULL REFERENCES account, parent_id uuid REFERENCES ikpe_comment,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000 AND body = normalize(body, NFC)),
  elder_badge boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), hidden_at timestamptz, hidden_by_pair uuid[]
);
CREATE TABLE ikpe_flag (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES ikpe_case,
  raised_by uuid NOT NULL REFERENCES account,
  kind text NOT NULL CHECK (kind IN ('consent','should_be_nso','misattribution','harm')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','upheld','dismissed','expired')),
  created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE TABLE panel_member (
  flag_id uuid NOT NULL REFERENCES ikpe_flag, account_id uuid NOT NULL REFERENCES account,
  drawn_at timestamptz NOT NULL, decision text CHECK (decision IN ('uphold','dismiss')), rationale text,
  PRIMARY KEY (flag_id, account_id)
);

-- payments ---------------------------------------------------------------
CREATE TABLE payout_obligation (
  id uuid PRIMARY KEY,
  recording_id uuid NOT NULL REFERENCES recording,
  kind text NOT NULL CHECK (kind IN ('elder','facilitator_stipend')),
  beneficiary_token text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0), currency char(3) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','processing','succeeded','needs_attention')),
  ikpe_case_id uuid NOT NULL,          -- must be passed (trigger) — INV-4
  provider_ref text, attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recording_id, kind)          -- INV-4: never twice
);

-- learning ---------------------------------------------------------------
CREATE TABLE word (
  id uuid PRIMARY KEY,
  lemma_ig text NOT NULL CHECK (lemma_ig = normalize(lemma_ig, NFC)),
  dialect_id uuid NOT NULL REFERENCES dialect,
  tone_pattern text NOT NULL,          -- e.g. 'L-H', 'H-!H' (downstep)
  glosses jsonb NOT NULL CHECK (jsonb_typeof(glosses)='object'),
  UNIQUE (lemma_ig, dialect_id)
);
CREATE TABLE tone_target (
  id uuid PRIMARY KEY,
  recording_id uuid NOT NULL REFERENCES recording,
  word_id uuid NOT NULL REFERENCES word,
  start_ms int NOT NULL, end_ms int NOT NULL CHECK (end_ms > start_ms),
  contour real[] NOT NULL,             -- semitones re speaker median, fixed N points
  syllables jsonb NOT NULL,            -- [{label, start_idx, end_idx, level}]
  algo_version text NOT NULL
);
CREATE TABLE lesson (id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, dialect_id uuid NOT NULL REFERENCES dialect,
  titles jsonb NOT NULL, status text NOT NULL CHECK (status IN ('draft','live','hidden')));
CREATE TABLE lesson_item (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lesson, position int NOT NULL,
  word_id uuid NOT NULL REFERENCES word, tone_target_id uuid NOT NULL REFERENCES tone_target,
  available boolean NOT NULL DEFAULT true,
  UNIQUE (lesson_id, position)
);
CREATE TABLE learner_progress (
  account_id uuid NOT NULL REFERENCES account, lesson_item_id uuid NOT NULL REFERENCES lesson_item,
  best_score real NOT NULL CHECK (best_score BETWEEN 0 AND 1), attempts int NOT NULL,
  completed_at timestamptz, updated_at timestamptz NOT NULL,
  PRIMARY KEY (account_id, lesson_item_id)
);
CREATE TABLE learner_attempt (           -- scores only; INV-8
  id uuid PRIMARY KEY, account_id uuid NOT NULL, lesson_item_id uuid NOT NULL,
  score real NOT NULL, per_syllable jsonb NOT NULL, algo_version text NOT NULL,
  client_at timestamptz NOT NULL, audio_sample_id uuid  -- only if opt-in row exists (trigger)
);

-- platform ---------------------------------------------------------------
CREATE TABLE governance_config (
  version int PRIMARY KEY, scope_type text NOT NULL, scope_id uuid,
  body jsonb NOT NULL,                 -- validated by contracts schema
  approved_by_case uuid NOT NULL, activated_at timestamptz NOT NULL
);
CREATE TABLE outbox_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text NOT NULL, aggregate_id uuid NOT NULL, payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), dispatched_at timestamptz
);
CREATE INDEX outbox_pending ON outbox_event(id) WHERE dispatched_at IS NULL;
CREATE TABLE audit_log (                 -- append-only, partitioned monthly
  id bigint GENERATED ALWAYS AS IDENTITY, at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid, actor_role text, action text NOT NULL,
  resource_type text NOT NULL, resource_id uuid, detail jsonb, request_id text,
  PRIMARY KEY (id, at)
) PARTITION BY RANGE (at);
-- REVOKE UPDATE, DELETE ON ikpe_vote_event, audit_log FROM app_role;  (INV-11)
```

## 4. State machines

Transitions are enforced twice: by the domain (`transition(from, event) → to | error`) and by a DB trigger that checks an allowed-transitions table. Neither alone is enough: the domain gives good errors, and the DB stops any path that skips the domain.

**recording:** `draft→in_review` (submit) · `in_review→published` (case passed) · `in_review→returned` · `returned→in_review` (new revision submitted) · `* (not discarded)→withdrawn` (consent revoked before publish) · `published→unpublished` (revocation / takedown) · `draft→discarded`.

**ikpe_case:** `open→paused` (flag) · `paused→open` (flags resolved; `paused_total` added to deadlines) · `open→passed | returned` (evaluate) · `open|paused→withdrawn` (consent revoked / audio replaced).

**payout_obligation:** `pending→processing→succeeded` · `processing→pending` (retryable) · `processing→needs_attention` (after 5) · `needs_attention→pending` (ops retry, audited).

## 5. Transaction boundaries

| Operation | Single transaction contains | Async after commit |
|---|---|---|
| Cast vote | vote upsert, vote event, tally delta, outbox `VoteCast` | evaluate case |
| Pass case | case→passed, publication insert, recording→published, outbox | payout, notify, index, lessons |
| Revoke consent | consent revoke, recording state, open case→withdrawn, publications unpublished, outbox | CDN purge, derivative delete, lesson items, client sync |
| Submit recording | recording→in_review, revision freeze, case open, tally row, outbox | notify kin |
| Verify kin | membership→verified, role grant, audit | notify, recompute active kin (nightly) |
| Payout attempt | status→processing + attempts++ (then a provider call **outside** the tx) | webhook → succeeded |

Rule: **never call an external provider inside a DB transaction.** Write intent, commit, then call, then record the result.

## 6. Keeping models consistent across web, mobile and backend

1. `packages/contracts` holds Zod schemas for every API payload. It generates OpenAPI and TS types. The DB row types come from the migrations (Kysely codegen), so a mismatch fails type-checking.
2. Mobile offline tables mirror API **read models**, not DB tables, and are versioned with `schema_version`. The app migrates its local DB on upgrade.
3. Cached denormalisations (`recording.tier`, `ikpe_tally`) are maintained in the same transaction **and** reconciled nightly. Any drift alerts.
4. No core field is ever stored in an untyped `jsonb`. `jsonb` is reserved for glosses (validated), provider payloads (raw) and audit detail.

## 7. Localisation and language pairs

- **Source:** Igbo with a dialect (`dialect_id`), always present and never translated in place.
- **Glosses:** `glosses->>'<locale>'`. A missing locale falls back along the requested `Accept-Language` chain, then `en`. The response always says which locale was served (`gloss_locale`).
- **Pair coverage report:** a nightly job computes the % of published items with a gloss per locale, so we know which pairs (e.g. `ig-nnewi → fr`) are ready to advertise.
- **Search:** `igbo_fold()` (an IMMUTABLE SQL function) strips tone marks and maps dotted vowels for **search keys only**. Results always display the original text. We do not use the generic `unaccent` extension because its rules aren't designed for Igbo.

## 8. Algorithms owned by the data layer

**Market day** (`packages/calendar-core`, pure, also SQL for server queries):
```
DAYS = ['Eke','Orie','Afọ','Nkwo']
index(date_lagos) = (anchor_index + (date_lagos − anchor_date).days) mod 4   -- positive modulo
```
The anchor comes from a governance-approved `calendar_anchor` row, per variant. Complexity is O(1).

**Daily proverb:** `pick = pool[ hash(date_lagos ‖ hometown_id) mod |pool| ]` over published proverbs for the dialect group. It is deterministic, cacheable per day, and everyone from a hometown sees the same ilu.

**Active kin count:** a nightly materialisation `hometown_stats(verified_active_kin)`. Quorum uses the snapshot taken when the case opens, so a case never pays the cost of a live count.

## 9. Retention

| Data | Retention |
|---|---|
| Revoked audio derivatives | Deleted within 15 min |
| Revoked raw audio | Deleted within 24 h, unless the elder chose private archiving (then a locked bucket, 30-day grace, then deleted) |
| Learner opt-in samples | Until opt-out + 7 days |
| Audit log | 7 years, monthly partitions moved to cold storage after 13 months |
| Vote events | Life of the case + 7 years |
| Erased account | PII nulled. Votes stay as `voter=erased:<hash>`, which preserves the tallies. |
