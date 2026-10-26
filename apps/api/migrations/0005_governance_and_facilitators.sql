CREATE TABLE "facilitator_application" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"hometown_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"training_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "facilitator_app_status" CHECK ("facilitator_application"."status" in ('pending','approved','withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "facilitator_signoff" (
	"application_id" uuid NOT NULL,
	"custodian_id" uuid NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facilitator_signoff_application_id_custodian_id_pk" PRIMARY KEY("application_id","custodian_id")
);
--> statement-breakpoint
CREATE TABLE "governance_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"approvals" jsonb NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_event_kind" CHECK ("governance_event"."kind" in ('interim_council_bootstrap')),
	CONSTRAINT "governance_payload_object" CHECK (jsonb_typeof("governance_event"."payload") = 'object'),
	CONSTRAINT "governance_approvals_two" CHECK (jsonb_typeof("governance_event"."approvals") = 'array' and jsonb_array_length("governance_event"."approvals") >= 2)
);
--> statement-breakpoint
ALTER TABLE "facilitator_application" ADD CONSTRAINT "facilitator_application_hometown_id_hometown_id_fk" FOREIGN KEY ("hometown_id") REFERENCES "public"."hometown"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilitator_signoff" ADD CONSTRAINT "facilitator_signoff_application_id_facilitator_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."facilitator_application"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "facilitator_app_open" ON "facilitator_application" USING btree ("account_id","hometown_id") WHERE "facilitator_application"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "facilitator_app_hometown" ON "facilitator_application" USING btree ("hometown_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "governance_one_bootstrap" ON "governance_event" USING btree ("kind") WHERE "governance_event"."kind" = 'interim_council_bootstrap';