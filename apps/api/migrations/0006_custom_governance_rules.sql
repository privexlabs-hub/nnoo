-- Governance & facilitator rules (ADR-018). Owners: governance, community.

-- community: cross-module foreign keys
ALTER TABLE facilitator_application ADD CONSTRAINT facilitator_app_account_fk FOREIGN KEY (account_id) REFERENCES account(id);
--> statement-breakpoint
ALTER TABLE facilitator_signoff ADD CONSTRAINT facilitator_signoff_custodian_fk FOREIGN KEY (custodian_id) REFERENCES account(id);
--> statement-breakpoint

-- No one signs off their own application (Igbo enwe eze: two other people decide).
CREATE FUNCTION facilitator_signoff_not_self() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM facilitator_application a WHERE a.id = NEW.application_id AND a.account_id = NEW.custodian_id) THEN
    RAISE EXCEPTION 'community.signoff_not_allowed: no one signs off their own application' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER facilitator_signoff_not_self BEFORE INSERT ON facilitator_signoff
  FOR EACH ROW EXECUTE FUNCTION facilitator_signoff_not_self();
--> statement-breakpoint

-- A facilitator grant through an application needs two distinct custodian sign-offs (01 §3).
CREATE FUNCTION role_grant_facilitator_needs_signoffs() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE app uuid;
BEGIN
  IF NEW.role = 'facilitator' AND NEW.granted_via LIKE 'panel:%' THEN
    app := substring(NEW.granted_via FROM 7)::uuid;
    IF (SELECT count(DISTINCT custodian_id) FROM facilitator_signoff WHERE application_id = app) < 2 THEN
      RAISE EXCEPTION 'INV-5: facilitator grant without two custodian sign-offs' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER role_grant_facilitator_needs_signoffs BEFORE INSERT ON role_grant
  FOR EACH ROW EXECUTE FUNCTION role_grant_facilitator_needs_signoffs();
--> statement-breakpoint

-- A custodian grant through governance needs a recorded event (the interim council bootstrap).
CREATE FUNCTION role_grant_custodian_needs_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'custodian' AND NEW.granted_via LIKE 'governance:%' AND NOT EXISTS (
       SELECT 1 FROM governance_event e WHERE e.id = substring(NEW.granted_via FROM 12)::uuid) THEN
    RAISE EXCEPTION 'INV-5: custodian grant without a governance event' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER role_grant_custodian_needs_event BEFORE INSERT ON role_grant
  FOR EACH ROW EXECUTE FUNCTION role_grant_custodian_needs_event();
--> statement-breakpoint

-- grants: governance events and sign-offs are append-only
REVOKE UPDATE, DELETE, TRUNCATE ON governance_event, facilitator_signoff FROM nnoo_app;
--> statement-breakpoint

COMMENT ON TABLE governance_event IS 'owner: governance. Append-only.';
--> statement-breakpoint
COMMENT ON TABLE facilitator_application IS 'owner: community';
--> statement-breakpoint
COMMENT ON TABLE facilitator_signoff IS 'owner: community. Append-only.';
