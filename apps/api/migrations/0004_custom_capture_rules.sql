-- Custom SQL for Phase 1 capture & consent (ADR-018). Business rules the database enforces even
-- if application code is bypassed. Each section is owned by the module named in its header.

-- ── archive: cross-module foreign keys ────────────────────────────────────────
ALTER TABLE elder_profile ADD CONSTRAINT elder_hometown_fk FOREIGN KEY (hometown_id) REFERENCES hometown(id);
--> statement-breakpoint
ALTER TABLE elder_profile ADD CONSTRAINT elder_dialect_fk FOREIGN KEY (dialect_id) REFERENCES dialect(id);
--> statement-breakpoint
ALTER TABLE elder_profile ADD CONSTRAINT elder_steward_fk FOREIGN KEY (steward_account_id) REFERENCES account(id);
--> statement-breakpoint
ALTER TABLE elder_profile ADD CONSTRAINT elder_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id);
--> statement-breakpoint
ALTER TABLE recording ADD CONSTRAINT recording_facilitator_fk FOREIGN KEY (facilitator_id) REFERENCES account(id);
--> statement-breakpoint
ALTER TABLE recording ADD CONSTRAINT recording_hometown_fk FOREIGN KEY (hometown_id) REFERENCES hometown(id);
--> statement-breakpoint
ALTER TABLE recording ADD CONSTRAINT recording_dialect_fk FOREIGN KEY (dialect_id) REFERENCES dialect(id);
--> statement-breakpoint
ALTER TABLE recording ADD CONSTRAINT recording_current_revision_fk FOREIGN KEY (current_revision_id) REFERENCES recording_revision(id);
--> statement-breakpoint
ALTER TABLE recording_revision ADD CONSTRAINT revision_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id);
--> statement-breakpoint
ALTER TABLE recording_note ADD CONSTRAINT note_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id);
--> statement-breakpoint

-- ── consent: cross-module foreign keys ────────────────────────────────────────
ALTER TABLE consent_record ADD CONSTRAINT consent_recording_fk FOREIGN KEY (recording_id) REFERENCES recording(id);
--> statement-breakpoint
ALTER TABLE consent_record ADD CONSTRAINT consent_evidence_fk FOREIGN KEY (evidence_media_id) REFERENCES media_asset(id);
--> statement-breakpoint
ALTER TABLE consent_record ADD CONSTRAINT consent_signature_fk FOREIGN KEY (signature_media_id) REFERENCES media_asset(id);
--> statement-breakpoint
ALTER TABLE consent_record ADD CONSTRAINT consent_captured_by_fk FOREIGN KEY (captured_by) REFERENCES account(id);
--> statement-breakpoint
ALTER TABLE consent_record ADD CONSTRAINT consent_ended_by_fk FOREIGN KEY (ended_by) REFERENCES account(id);
--> statement-breakpoint

-- ── media: cross-module foreign keys ──────────────────────────────────────────
ALTER TABLE media_asset ADD CONSTRAINT media_recording_fk FOREIGN KEY (recording_id) REFERENCES recording(id);
--> statement-breakpoint
ALTER TABLE media_asset ADD CONSTRAINT media_source_fk FOREIGN KEY (source_asset_id) REFERENCES media_asset(id);
--> statement-breakpoint
ALTER TABLE media_asset ADD CONSTRAINT media_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id);
--> statement-breakpoint
ALTER TABLE upload_session ADD CONSTRAINT upload_created_by_fk FOREIGN KEY (created_by) REFERENCES account(id);
--> statement-breakpoint

-- ── archive: the recording state machine (docs/03 §4) ─────────────────────────
-- Enforced twice: the domain gives good errors; this trigger stops any path that skips it.
INSERT INTO recording_status_transition (from_status, to_status) VALUES
  ('draft', 'in_review'),       -- submit (Phase 2)
  ('draft', 'discarded'),       -- facilitator discards
  ('draft', 'withdrawn'),       -- consent revoked before publication
  ('in_review', 'published'),   -- case passed (Phase 2)
  ('in_review', 'returned'),    -- case returned
  ('in_review', 'withdrawn'),
  ('returned', 'in_review'),    -- new revision submitted
  ('returned', 'withdrawn'),
  ('returned', 'discarded'),
  ('published', 'unpublished'), -- revocation or takedown
  ('published', 'withdrawn');
--> statement-breakpoint
CREATE FUNCTION recording_status_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT EXISTS (
       SELECT 1 FROM recording_status_transition t WHERE t.from_status = OLD.status AND t.to_status = NEW.status) THEN
    RAISE EXCEPTION 'recording.invalid_transition: % -> %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER recording_status_guard BEFORE UPDATE ON recording
  FOR EACH ROW EXECUTE FUNCTION recording_status_guard();
--> statement-breakpoint
CREATE FUNCTION recording_insert_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> 'draft' THEN
    RAISE EXCEPTION 'recording.invalid_transition: a recording starts as draft' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.tier IS NOT NULL THEN
    RAISE EXCEPTION 'recording.tier_from_consent: tier is set only by consent' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER recording_insert_guard BEFORE INSERT ON recording
  FOR EACH ROW EXECUTE FUNCTION recording_insert_guard();
--> statement-breakpoint

-- ── consent: recording.tier always equals the active consent (docs/03 §6.3) ───
CREATE FUNCTION consent_sync_recording_tier() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE recording r SET tier = (
    SELECT c.tier FROM consent_record c WHERE c.recording_id = NEW.recording_id AND c.ended_at IS NULL)
  WHERE r.id = NEW.recording_id;
  RETURN NULL;
END $$;
--> statement-breakpoint
CREATE TRIGGER consent_sync_recording_tier AFTER INSERT OR UPDATE ON consent_record
  FOR EACH ROW EXECUTE FUNCTION consent_sync_recording_tier();
--> statement-breakpoint

-- Evidence for a consent act: this recording's spoken statement, uploaded, never reused.
CREATE FUNCTION consent_evidence_ok(rec uuid, media uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM media_asset m WHERE m.id = media AND m.recording_id = rec
                   AND m.kind = 'consent_evidence' AND m.status IN ('uploaded', 'ready'))
     AND NOT EXISTS (SELECT 1 FROM consent_record c
                     WHERE c.evidence_media_id = media OR c.ended_evidence_media_id = media)
$$;
--> statement-breakpoint
-- A new version must follow the previous one, and its evidence must be valid.
CREATE FUNCTION consent_version_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prev int;
BEGIN
  SELECT max(version) INTO prev FROM consent_record WHERE recording_id = NEW.recording_id;
  IF NEW.version <> coalesce(prev, 0) + 1 THEN
    RAISE EXCEPTION 'consent.invalid_terms: expected version %', coalesce(prev, 0) + 1 USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.evidence_media_id IS NOT NULL AND NOT consent_evidence_ok(NEW.recording_id, NEW.evidence_media_id) THEN
    RAISE EXCEPTION 'consent.evidence_required: evidence must be this recording''s uploaded, unused spoken statement'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER consent_version_guard BEFORE INSERT ON consent_record
  FOR EACH ROW EXECUTE FUNCTION consent_version_guard();
--> statement-breakpoint

-- An ended consent never becomes active again.
CREATE FUNCTION consent_end_is_final() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'consent.not_active: an ended consent cannot change' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.ended_evidence_media_id IS NOT NULL
     AND NOT consent_evidence_ok(NEW.recording_id, NEW.ended_evidence_media_id) THEN
    RAISE EXCEPTION 'consent.evidence_required: evidence must be this recording''s uploaded, unused spoken statement'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER consent_end_is_final BEFORE UPDATE ON consent_record
  FOR EACH ROW EXECUTE FUNCTION consent_end_is_final();
--> statement-breakpoint

-- ── media: INV-2 — no audio for Nsọ recordings, ever ──────────────────────────
CREATE FUNCTION media_no_nso() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kind::text LIKE 'audio_%' OR NEW.kind = 'peaks' THEN
    IF EXISTS (SELECT 1 FROM recording r WHERE r.id = NEW.recording_id AND r.tier = 'nso') THEN
      RAISE EXCEPTION 'INV-2: audio for nso recording %', NEW.recording_id USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER media_no_nso BEFORE INSERT OR UPDATE OF kind, recording_id, status ON media_asset
  FOR EACH ROW WHEN (NEW.status <> 'purged') EXECUTE FUNCTION media_no_nso();
--> statement-breakpoint
-- The other direction (INV-2, INV-7): when a recording becomes Nsọ, or is withdrawn, unpublished or discarded,
-- every audio asset becomes unservable in the same transaction. The media purge job then deletes
-- the bytes from storage (object_deleted_at). Consent evidence is kept (life of consent + 7 years).
CREATE FUNCTION recording_restrict_purges_audio() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.tier = 'nso' AND OLD.tier IS DISTINCT FROM 'nso')
     OR (NEW.status IN ('withdrawn', 'unpublished', 'discarded') AND OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE media_asset SET status = 'purged', purged_at = now(), reject_reason = NULL
    WHERE recording_id = NEW.id AND status <> 'purged'
      AND (kind::text LIKE 'audio_%' OR kind = 'peaks');
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER recording_restrict_purges_audio AFTER UPDATE OF tier, status ON recording
  FOR EACH ROW EXECUTE FUNCTION recording_restrict_purges_audio();
--> statement-breakpoint

-- ── grants (ADR-026) ──────────────────────────────────────────────────────────
-- Consent history is immutable: only the end fields can be set, once.
REVOKE UPDATE, DELETE, TRUNCATE ON consent_record FROM nnoo_app;
--> statement-breakpoint
GRANT UPDATE (ended_at, ended_by, end_reason, ended_evidence_media_id) ON consent_record TO nnoo_app;
--> statement-breakpoint
-- Reference data the runtime only reads.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON recording_status_transition FROM nnoo_app;
--> statement-breakpoint
-- Revisions are append-only (a change is a new revision).
REVOKE UPDATE, DELETE, TRUNCATE ON recording_revision FROM nnoo_app;
--> statement-breakpoint
-- Recordings and elders are never deleted by the app (withdrawal/discard are states; erasure is a later, audited flow).
REVOKE DELETE, TRUNCATE ON recording, elder_profile, media_asset FROM nnoo_app;
--> statement-breakpoint

-- ── ownership (docs/03 §1) ────────────────────────────────────────────────────
COMMENT ON TABLE state IS 'owner: community';
--> statement-breakpoint
COMMENT ON TABLE lga IS 'owner: community';
--> statement-breakpoint
COMMENT ON TABLE hometown IS 'owner: community';
--> statement-breakpoint
COMMENT ON TABLE dialect IS 'owner: community';
--> statement-breakpoint
COMMENT ON TABLE hometown_dialect IS 'owner: community';
--> statement-breakpoint
COMMENT ON TABLE elder_profile IS 'owner: archive';
--> statement-breakpoint
COMMENT ON TABLE recording IS 'owner: archive. tier is maintained by consent triggers.';
--> statement-breakpoint
COMMENT ON TABLE recording_status_transition IS 'owner: archive. Reference data.';
--> statement-breakpoint
COMMENT ON TABLE recording_revision IS 'owner: archive. Append-only.';
--> statement-breakpoint
COMMENT ON TABLE recording_note IS 'owner: archive';
--> statement-breakpoint
COMMENT ON TABLE consent_record IS 'owner: consent. Append-only except end fields.';
--> statement-breakpoint
COMMENT ON TABLE media_asset IS 'owner: media';
--> statement-breakpoint
COMMENT ON TABLE upload_session IS 'owner: media';
