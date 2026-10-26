-- Custom SQL: what Drizzle cannot express (ADR-018). Owner: platform, audit, identity.
-- Reviewed by hand. Never edit after it has been applied to a shared branch; add a new migration.

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

-- ── Igbo text (INV-9, ADR-014) ────────────────────────────────────────────────
-- Stored Igbo text must be NFC. Tone marks and dotted vowels are never stripped.
CREATE DOMAIN igbo_text AS text CHECK (VALUE IS NULL OR VALUE = normalize(VALUE, NFC));
--> statement-breakpoint

-- Search key only, never displayed. Must stay identical to fold() in packages/igbo-text
-- (decompose, strip grave/acute/macron/dot-above/dot-below, lowercase, recompose).
CREATE FUNCTION igbo_fold(t text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT normalize(lower(translate(normalize(t, NFD), U&'\0300\0301\0304\0307\0323', '')), NFC)
$$;
--> statement-breakpoint

-- ── Audit log (append-only, partitioned monthly; INV-11) ─────────────────────
CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY,
  at          timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid,
  actor_role  text,
  action      text NOT NULL CHECK (action ~ '^[a-z_]+\.[a-z_.]+$'),
  resource_type text NOT NULL,
  resource_id uuid,
  detail      jsonb CHECK (detail IS NULL OR jsonb_typeof(detail) = 'object'),
  request_id  text,
  PRIMARY KEY (id, at)
) PARTITION BY RANGE (at);
--> statement-breakpoint
COMMENT ON TABLE audit_log IS 'owner: audit. Append-only (INV-11). Partitioned monthly by `at`.';
--> statement-breakpoint
CREATE INDEX audit_log_resource ON audit_log (resource_type, resource_id, at);
--> statement-breakpoint
CREATE TABLE audit_log_default PARTITION OF audit_log DEFAULT;
--> statement-breakpoint

-- Creates the monthly partition containing `month` if it is missing. Idempotent.
-- Called by migrations and by the monthly `partitions` job (docs/neon/03 §7).
CREATE FUNCTION ensure_monthly_partition(parent regclass, month date) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  start_at date := date_trunc('month', month)::date;
  end_at   date := (date_trunc('month', month) + interval '1 month')::date;
  part     text := format('%s_%s', parent::text, to_char(start_at, 'YYYYMM'));
BEGIN
  IF to_regclass(part) IS NULL THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF %s FOR VALUES FROM (%L) TO (%L)',
                   part, parent, start_at, end_at);
  END IF;
END $$;
--> statement-breakpoint
SELECT ensure_monthly_partition('audit_log', (now() + make_interval(months => m))::date)
FROM generate_series(0, 2) AS m;
--> statement-breakpoint

-- ── Ownership comments (03 §1) ───────────────────────────────────────────────
COMMENT ON TABLE job IS 'owner: platform';
--> statement-breakpoint
COMMENT ON TABLE outbox_event IS 'owner: platform. Append-only except dispatched_at.';
--> statement-breakpoint
COMMENT ON TABLE trigger_invocation IS 'owner: platform';
--> statement-breakpoint
COMMENT ON TABLE idempotency_key IS 'owner: platform';
--> statement-breakpoint
COMMENT ON TABLE rate_limit_bucket IS 'owner: platform';
--> statement-breakpoint
COMMENT ON TABLE service_token IS 'owner: platform';
--> statement-breakpoint
COMMENT ON TABLE account IS 'owner: identity';
--> statement-breakpoint
COMMENT ON TABLE role_grant IS 'owner: identity';
--> statement-breakpoint
COMMENT ON TABLE guardianship IS 'owner: identity';
--> statement-breakpoint
COMMENT ON TABLE device IS 'owner: identity';
--> statement-breakpoint
COMMENT ON TABLE session_family IS 'owner: identity';
--> statement-breakpoint
COMMENT ON TABLE refresh_token IS 'owner: identity';
--> statement-breakpoint
COMMENT ON SCHEMA auth IS 'owner: identity. Better Auth library tables (ADR-028).';
--> statement-breakpoint

-- ── Every auth user is a Nnọọ account, created atomically ────────────────────
-- Sign-up through any method (phone OTP, email OTP) inserts auth."user"; the
-- account row and the global learner grant are created in the same transaction.
CREATE FUNCTION identity_account_for_auth_user() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.account (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.role_grant (id, account_id, role, scope_type, scope_id, granted_via)
  VALUES (uuidv7(), NEW.id, 'learner', 'global', NULL, 'signup')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER identity_account_for_auth_user AFTER INSERT ON auth."user"
  FOR EACH ROW EXECUTE FUNCTION identity_account_for_auth_user();
