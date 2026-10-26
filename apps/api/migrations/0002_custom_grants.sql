-- Least-privilege runtime roles (ADR-026, docs/neon/07 §4). Runs as the owner role.
-- The LOGIN role nnoo_app_login is created outside migrations (Neon CLI/console on
-- Neon, the test harness locally) and is granted membership in nnoo_app.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nnoo_app') THEN
    CREATE ROLE nnoo_app NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nnoo_readonly') THEN
    CREATE ROLE nnoo_readonly NOLOGIN;
  END IF;
END $$;
--> statement-breakpoint

GRANT USAGE ON SCHEMA public, auth TO nnoo_app;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO nnoo_readonly;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, auth TO nnoo_app;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, auth TO nnoo_app;
--> statement-breakpoint
-- Analytics and replicas read the domain only, never the auth store.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nnoo_readonly;
--> statement-breakpoint

-- INV-11: append-only tables. outbox_event may only have dispatched_at set.
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log, outbox_event FROM nnoo_app;
--> statement-breakpoint
GRANT UPDATE (dispatched_at) ON outbox_event TO nnoo_app;
--> statement-breakpoint

-- Partitions are reached only through their parent, so a direct UPDATE/DELETE on a
-- partition is not possible either: no privileges on partitions at all.
DO $$
DECLARE p regclass;
BEGIN
  FOR p IN SELECT inhrelid::regclass FROM pg_inherits WHERE inhparent = 'audit_log'::regclass LOOP
    EXECUTE format('REVOKE ALL ON %s FROM nnoo_app, nnoo_readonly', p);
  END LOOP;
END $$;
--> statement-breakpoint

-- Partition maintenance runs as the owner so the app role never needs CREATE.
CREATE OR REPLACE FUNCTION ensure_monthly_partition(parent regclass, month date) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  start_at date := date_trunc('month', month)::date;
  end_at   date := (date_trunc('month', month) + interval '1 month')::date;
  part     text := format('%s_%s', parent::text, to_char(start_at, 'YYYYMM'));
BEGIN
  IF parent NOT IN ('audit_log'::regclass) THEN
    RAISE EXCEPTION 'ensure_monthly_partition: % is not a managed partitioned table', parent;
  END IF;
  IF to_regclass(part) IS NULL THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF %s FOR VALUES FROM (%L) TO (%L)',
                   part, parent, start_at, end_at);
    EXECUTE format('REVOKE ALL ON %I FROM nnoo_app, nnoo_readonly', part);
  END IF;
END $$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION ensure_monthly_partition(regclass, date) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION ensure_monthly_partition(regclass, date) TO nnoo_app;
--> statement-breakpoint

-- Future tables: CRUD by default. Every append-only table must add its own REVOKE in
-- the same migration that creates it; CI asserts the append-only set (tests/integration).
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nnoo_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nnoo_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nnoo_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO nnoo_readonly;
