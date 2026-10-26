CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'erased');--> statement-breakpoint
CREATE TYPE "public"."age_band" AS ENUM('under_13', 'age_13_17', 'adult');--> statement-breakpoint
CREATE TYPE "public"."device_platform" AS ENUM('ios', 'android', 'web');--> statement-breakpoint
CREATE TYPE "public"."identity_level" AS ENUM('none', 'basic', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."role_kind" AS ENUM('learner', 'kin', 'facilitator', 'custodian', 'organiser', 'moderator', 'operator');--> statement-breakpoint
CREATE TABLE "idempotency_key" (
	"account_id" uuid NOT NULL,
	"key" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"request_hash" text NOT NULL,
	"status" smallint NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_key_account_id_key_pk" PRIMARY KEY("account_id","key"),
	CONSTRAINT "idempotency_key_len" CHECK (length("idempotency_key"."key") between 8 and 128)
);
--> statement-breakpoint
CREATE TABLE "job" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "job_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"queue" text NOT NULL,
	"type" text NOT NULL,
	"dedupe_key" text,
	"payload" jsonb NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 8 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_error" text,
	"done_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_queue" CHECK ("job"."queue" in ('default','payments','notify','audio','ikpe','ai')),
	CONSTRAINT "job_attempts" CHECK ("job"."attempts" >= 0 and "job"."max_attempts" between 1 and 50),
	CONSTRAINT "job_terminal" CHECK (not ("job"."done_at" is not null and "job"."failed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "outbox_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "outbox_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dispatched_at" timestamp with time zone,
	CONSTRAINT "outbox_payload_object" CHECK (jsonb_typeof("outbox_event"."payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "rate_limit_bucket" (
	"bucket_key" text PRIMARY KEY NOT NULL,
	"tokens" real NOT NULL,
	"refilled_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_token" (
	"jti" uuid PRIMARY KEY NOT NULL,
	"job_id" bigint NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "service_token_expiry" CHECK ("service_token"."expires_at" > "service_token"."issued_at")
);
--> statement-breakpoint
CREATE TABLE "trigger_invocation" (
	"invocation_id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"birth_year" smallint,
	"age_band" "age_band",
	"ui_locale" text DEFAULT 'en' NOT NULL,
	"identity_level" "identity_level" DEFAULT 'none' NOT NULL,
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"auth_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_display_name_nfc" CHECK ("account"."display_name" is null or "account"."display_name" = normalize("account"."display_name", NFC)),
	CONSTRAINT "account_display_name_len" CHECK ("account"."display_name" is null or length("account"."display_name") between 1 and 120),
	CONSTRAINT "account_birth_year" CHECK ("account"."birth_year" is null or "account"."birth_year" between 1900 and 2100),
	CONSTRAINT "account_ui_locale" CHECK ("account"."ui_locale" ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$')
);
--> statement-breakpoint
CREATE TABLE "auth"."account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."jwks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"alg" text,
	"crv" text,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth"."passkey" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth"."session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"amr" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth"."user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone_number" text,
	"phone_number_verified" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "auth"."verification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"platform" "device_platform" NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "guardianship" (
	"guardian_id" uuid NOT NULL,
	"minor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guardianship_guardian_id_minor_id_pk" PRIMARY KEY("guardian_id","minor_id"),
	CONSTRAINT "guardianship_distinct" CHECK ("guardianship"."guardian_id" <> "guardianship"."minor_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"id" uuid PRIMARY KEY NOT NULL,
	"family_id" uuid NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "refresh_token_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "refresh_token_expiry" CHECK ("refresh_token"."expires_at" > "refresh_token"."issued_at")
);
--> statement-breakpoint
CREATE TABLE "role_grant" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"role" "role_kind" NOT NULL,
	"scope_type" text NOT NULL,
	"scope_id" uuid,
	"granted_via" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "role_grant_scope_type" CHECK ("role_grant"."scope_type" in ('global','hometown')),
	CONSTRAINT "role_grant_scope_id" CHECK (("role_grant"."scope_type" = 'global') = ("role_grant"."scope_id" is null)),
	CONSTRAINT "role_grant_not_admin" CHECK ("role_grant"."granted_via" ~ '^(signup|vouch|bootstrap|panel:[0-9a-f-]{36}|governance:[0-9a-f-]{36})$')
);
--> statement-breakpoint
CREATE TABLE "session_family" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"device_id" uuid,
	"auth_session_id" uuid NOT NULL,
	"amr" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoke_reason" text,
	CONSTRAINT "session_family_auth_session_id_unique" UNIQUE("auth_session_id"),
	CONSTRAINT "session_family_revoke_reason" CHECK (("session_family"."revoked_at" is null) = ("session_family"."revoke_reason" is null))
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardianship" ADD CONSTRAINT "guardianship_guardian_id_account_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardianship" ADD CONSTRAINT "guardianship_minor_id_account_id_fk" FOREIGN KEY ("minor_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_family_id_session_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."session_family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_grant" ADD CONSTRAINT "role_grant_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_family" ADD CONSTRAINT "session_family_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_family" ADD CONSTRAINT "session_family_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idempotency_key_created" ON "idempotency_key" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_dedupe_open" ON "job" USING btree ("dedupe_key") WHERE "job"."done_at" is null and "job"."failed_at" is null;--> statement-breakpoint
CREATE INDEX "job_ready" ON "job" USING btree ("queue","run_at") WHERE "job"."done_at" is null and "job"."failed_at" is null;--> statement-breakpoint
CREATE INDEX "outbox_pending" ON "outbox_event" USING btree ("id") WHERE "outbox_event"."dispatched_at" is null;--> statement-breakpoint
CREATE INDEX "auth_account_user" ON "auth"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_passkey_user" ON "auth"."passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_passkey_credential" ON "auth"."passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "auth_session_user" ON "auth"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier" ON "auth"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "device_account" ON "device" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "refresh_token_family" ON "refresh_token" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_grant_active" ON "role_grant" USING btree ("account_id","role","scope_type",coalesce("scope_id", '00000000-0000-0000-0000-000000000000'::uuid)) WHERE "role_grant"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "role_grant_account" ON "role_grant" USING btree ("account_id") WHERE "role_grant"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "session_family_account" ON "session_family" USING btree ("account_id") WHERE "session_family"."revoked_at" is null;