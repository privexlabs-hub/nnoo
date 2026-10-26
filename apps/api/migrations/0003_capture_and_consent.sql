CREATE TYPE "public"."consent_tier" AS ENUM('oha', 'umunna', 'nso');--> statement-breakpoint
CREATE TYPE "public"."payee_kind" AS ENUM('elder', 'family_member');--> statement-breakpoint
CREATE TYPE "public"."recording_status" AS ENUM('draft', 'in_review', 'published', 'returned', 'withdrawn', 'unpublished', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."recording_topic" AS ENUM('story', 'proverb', 'song', 'recipe', 'craft', 'place_lore');--> statement-breakpoint
CREATE TYPE "public"."consent_end_reason" AS ENUM('withdrawn', 'narrowed', 'widened', 'amended');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('audio_raw', 'audio_master', 'audio_opus', 'audio_aac', 'peaks', 'consent_evidence', 'consent_signature');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'uploaded', 'ready', 'rejected', 'purged');--> statement-breakpoint
CREATE TABLE "elder_profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"hometown_id" uuid NOT NULL,
	"dialect_id" uuid NOT NULL,
	"birth_year" smallint,
	"lineage" text,
	"deceased_at" date,
	"steward_account_id" uuid,
	"family_representative_name" text,
	"payee_kind" "payee_kind" DEFAULT 'elder' NOT NULL,
	"payee_name" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "elder_display_name_nfc" CHECK ("elder_profile"."display_name" is null or "elder_profile"."display_name" = normalize("elder_profile"."display_name", NFC)),
	CONSTRAINT "elder_display_name_len" CHECK (length("elder_profile"."display_name") between 1 and 120),
	CONSTRAINT "elder_lineage_nfc" CHECK ("elder_profile"."lineage" is null or "elder_profile"."lineage" = normalize("elder_profile"."lineage", NFC)),
	CONSTRAINT "elder_family_rep_nfc" CHECK ("elder_profile"."family_representative_name" is null or "elder_profile"."family_representative_name" = normalize("elder_profile"."family_representative_name", NFC)),
	CONSTRAINT "elder_payee_name_nfc" CHECK ("elder_profile"."payee_name" is null or "elder_profile"."payee_name" = normalize("elder_profile"."payee_name", NFC)),
	CONSTRAINT "elder_payee" CHECK (("elder_profile"."payee_kind" = 'family_member') = ("elder_profile"."payee_name" is not null)),
	CONSTRAINT "elder_birth_year" CHECK ("elder_profile"."birth_year" is null or "elder_profile"."birth_year" between 1880 and 2100)
);
--> statement-breakpoint
CREATE TABLE "recording" (
	"id" uuid PRIMARY KEY NOT NULL,
	"elder_id" uuid NOT NULL,
	"facilitator_id" uuid NOT NULL,
	"hometown_id" uuid NOT NULL,
	"dialect_id" uuid NOT NULL,
	"topic" "recording_topic" NOT NULL,
	"status" "recording_status" DEFAULT 'draft' NOT NULL,
	"tier" "consent_tier",
	"current_revision_id" uuid,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recording_note" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recording_id" uuid NOT NULL,
	"at_ms" integer NOT NULL,
	"body" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "note_at_ms" CHECK ("recording_note"."at_ms" >= 0),
	CONSTRAINT "note_body_nfc" CHECK ("recording_note"."body" is null or "recording_note"."body" = normalize("recording_note"."body", NFC)),
	CONSTRAINT "note_body_len" CHECK (length("recording_note"."body") between 1 and 2000)
);
--> statement-breakpoint
CREATE TABLE "recording_revision" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recording_id" uuid NOT NULL,
	"rev" integer NOT NULL,
	"title_ig" text NOT NULL,
	"transcript_ig" text,
	"glosses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"draft_source" text DEFAULT 'human' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revision_rev_positive" CHECK ("recording_revision"."rev" >= 1),
	CONSTRAINT "revision_title_nfc" CHECK ("recording_revision"."title_ig" is null or "recording_revision"."title_ig" = normalize("recording_revision"."title_ig", NFC)),
	CONSTRAINT "revision_title_len" CHECK (length("recording_revision"."title_ig") between 1 and 200),
	CONSTRAINT "revision_transcript_nfc" CHECK ("recording_revision"."transcript_ig" is null or "recording_revision"."transcript_ig" = normalize("recording_revision"."transcript_ig", NFC)),
	CONSTRAINT "revision_glosses_object" CHECK (jsonb_typeof("recording_revision"."glosses") = 'object'),
	CONSTRAINT "revision_draft_source" CHECK ("recording_revision"."draft_source" in ('human','machine_assisted'))
);
--> statement-breakpoint
CREATE TABLE "recording_status_transition" (
	"from_status" "recording_status" NOT NULL,
	"to_status" "recording_status" NOT NULL,
	CONSTRAINT "recording_status_transition_from_status_to_status_pk" PRIMARY KEY("from_status","to_status")
);
--> statement-breakpoint
CREATE TABLE "dialect" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	CONSTRAINT "dialect_name_unique" UNIQUE("name"),
	CONSTRAINT "dialect_name_nfc" CHECK ("dialect"."name" = normalize("dialect"."name", NFC)),
	CONSTRAINT "dialect_not_own_parent" CHECK ("dialect"."parent_id" is distinct from "dialect"."id")
);
--> statement-breakpoint
CREATE TABLE "hometown" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lga_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_search" text GENERATED ALWAYS AS (lower(igbo_fold(name))) STORED,
	"bootstrap_mode" boolean DEFAULT true NOT NULL,
	CONSTRAINT "hometown_name_nfc" CHECK ("hometown"."name" = normalize("hometown"."name", NFC))
);
--> statement-breakpoint
CREATE TABLE "hometown_dialect" (
	"hometown_id" uuid NOT NULL,
	"dialect_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "hometown_dialect_hometown_id_dialect_id_pk" PRIMARY KEY("hometown_id","dialect_id")
);
--> statement-breakpoint
CREATE TABLE "lga" (
	"id" uuid PRIMARY KEY NOT NULL,
	"state_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "lga_name_nfc" CHECK ("lga"."name" = normalize("lga"."name", NFC))
);
--> statement-breakpoint
CREATE TABLE "state" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "state_name_unique" UNIQUE("name"),
	CONSTRAINT "state_name_nfc" CHECK ("state"."name" = normalize("state"."name", NFC))
);
--> statement-breakpoint
CREATE TABLE "consent_record" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recording_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"tier" "consent_tier" NOT NULL,
	"umunna_scope" uuid[],
	"allow_archive" boolean NOT NULL,
	"allow_lessons" boolean NOT NULL,
	"allow_social" boolean NOT NULL,
	"allow_photo" boolean NOT NULL,
	"allow_machine_assist" boolean DEFAULT false NOT NULL,
	"steward_may_widen_to" "consent_tier",
	"witness_name" text,
	"evidence_media_id" uuid,
	"acted_as" text DEFAULT 'facilitator' NOT NULL,
	"signature_media_id" uuid,
	"captured_by" uuid NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"ended_by" uuid,
	"end_reason" "consent_end_reason",
	"ended_evidence_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consent_version_positive" CHECK ("consent_record"."version" >= 1),
	CONSTRAINT "consent_acted_as" CHECK ("consent_record"."acted_as" in ('facilitator','steward')),
	CONSTRAINT "consent_evidence_unless_steward" CHECK ("consent_record"."acted_as" = 'steward' or "consent_record"."evidence_media_id" is not null),
	CONSTRAINT "consent_first_by_facilitator" CHECK ("consent_record"."version" > 1 or "consent_record"."acted_as" = 'facilitator'),
	CONSTRAINT "consent_umunna_scope" CHECK (("consent_record"."tier" = 'umunna') = ("consent_record"."umunna_scope" is not null and cardinality("consent_record"."umunna_scope") > 0)),
	CONSTRAINT "consent_end_fields" CHECK (("consent_record"."ended_at" is null) = ("consent_record"."end_reason" is null) and ("consent_record"."ended_at" is null) = ("consent_record"."ended_by" is null)),
	CONSTRAINT "consent_witness_nfc" CHECK ("consent_record"."witness_name" is null or "consent_record"."witness_name" = normalize("consent_record"."witness_name", NFC)),
	CONSTRAINT "consent_nso_restrictions" CHECK ("consent_record"."tier" <> 'nso' or not ("consent_record"."allow_lessons" or "consent_record"."allow_social" or "consent_record"."allow_machine_assist"))
);
--> statement-breakpoint
CREATE TABLE "media_asset" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recording_id" uuid,
	"kind" "media_kind" NOT NULL,
	"bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"sha256" "bytea" NOT NULL,
	"bytes" bigint NOT NULL,
	"duration_ms" integer,
	"mime" text NOT NULL,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"source_asset_id" uuid,
	"reject_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_at" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"object_deleted_at" timestamp with time zone,
	CONSTRAINT "media_asset_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "media_bytes" CHECK ("media_asset"."bytes" > 0),
	CONSTRAINT "media_sha256_len" CHECK (length("media_asset"."sha256") = 32),
	CONSTRAINT "media_key_opaque" CHECK ("media_asset"."storage_key" ~ '^[a-z_]+/[0-9a-f-]{36}$'),
	CONSTRAINT "media_bucket" CHECK ("media_asset"."bucket" in ('media-uploads','media-masters','media-derivatives','consent-evidence')),
	CONSTRAINT "media_purged" CHECK (("media_asset"."status" = 'purged') = ("media_asset"."purged_at" is not null)),
	CONSTRAINT "media_reject_reason" CHECK (("media_asset"."status" = 'rejected') = ("media_asset"."reject_reason" is not null))
);
--> statement-breakpoint
CREATE TABLE "upload_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"s3_upload_id" text NOT NULL,
	"part_size" integer NOT NULL,
	"part_count" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"aborted_at" timestamp with time zone,
	CONSTRAINT "upload_part_size" CHECK ("upload_session"."part_size" between 5242880 and 104857600),
	CONSTRAINT "upload_part_count" CHECK ("upload_session"."part_count" between 1 and 10000),
	CONSTRAINT "upload_terminal" CHECK (not ("upload_session"."completed_at" is not null and "upload_session"."aborted_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "service_token" ADD COLUMN "secret_hash" "bytea";--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_elder_id_elder_profile_id_fk" FOREIGN KEY ("elder_id") REFERENCES "public"."elder_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_note" ADD CONSTRAINT "recording_note_recording_id_recording_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."recording"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_revision" ADD CONSTRAINT "recording_revision_recording_id_recording_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."recording"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dialect" ADD CONSTRAINT "dialect_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dialect"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hometown" ADD CONSTRAINT "hometown_lga_id_lga_id_fk" FOREIGN KEY ("lga_id") REFERENCES "public"."lga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hometown_dialect" ADD CONSTRAINT "hometown_dialect_hometown_id_hometown_id_fk" FOREIGN KEY ("hometown_id") REFERENCES "public"."hometown"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hometown_dialect" ADD CONSTRAINT "hometown_dialect_dialect_id_dialect_id_fk" FOREIGN KEY ("dialect_id") REFERENCES "public"."dialect"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lga" ADD CONSTRAINT "lga_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_media_asset_id_media_asset_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "elder_hometown" ON "elder_profile" USING btree ("hometown_id");--> statement-breakpoint
CREATE INDEX "recording_facilitator" ON "recording" USING btree ("facilitator_id","created_at");--> statement-breakpoint
CREATE INDEX "recording_hometown_status" ON "recording" USING btree ("hometown_id","status");--> statement-breakpoint
CREATE INDEX "recording_elder" ON "recording" USING btree ("elder_id");--> statement-breakpoint
CREATE INDEX "note_recording" ON "recording_note" USING btree ("recording_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recording_revision_rev" ON "recording_revision" USING btree ("recording_id","rev");--> statement-breakpoint
CREATE UNIQUE INDEX "hometown_lga_name" ON "hometown" USING btree ("lga_id","name");--> statement-breakpoint
CREATE INDEX "hometown_name_search" ON "hometown" USING gin ("name_search" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "hometown_one_primary_dialect" ON "hometown_dialect" USING btree ("hometown_id") WHERE "hometown_dialect"."is_primary";--> statement-breakpoint
CREATE UNIQUE INDEX "lga_state_name" ON "lga" USING btree ("state_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_recording_version" ON "consent_record" USING btree ("recording_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_one_active" ON "consent_record" USING btree ("recording_id") WHERE "consent_record"."ended_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "consent_evidence_once" ON "consent_record" USING btree ("evidence_media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_end_evidence_once" ON "consent_record" USING btree ("ended_evidence_media_id");--> statement-breakpoint
CREATE INDEX "consent_recording" ON "consent_record" USING btree ("recording_id");--> statement-breakpoint
CREATE INDEX "media_recording" ON "media_asset" USING btree ("recording_id","kind");--> statement-breakpoint
CREATE INDEX "media_pending" ON "media_asset" USING btree ("created_at") WHERE "media_asset"."status" in ('pending','uploaded');--> statement-breakpoint
CREATE INDEX "media_purge_due" ON "media_asset" USING btree ("purged_at") WHERE "media_asset"."purged_at" is not null and "media_asset"."object_deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "upload_session_asset" ON "upload_session" USING btree ("media_asset_id");