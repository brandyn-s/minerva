CREATE TABLE "proposal_assessments" (
	"idea_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"run_id" uuid NOT NULL,
	"state" text NOT NULL,
	"report" jsonb,
	CONSTRAINT "proposal_assessments_idea_id_revision_pk" PRIMARY KEY("idea_id","revision")
);
--> statement-breakpoint
CREATE TABLE "operation_attempts" (
	"run_id" uuid NOT NULL,
	"slot" integer NOT NULL,
	"purpose" text NOT NULL,
	"status" text NOT NULL,
	"proposal_id" uuid NOT NULL,
	"input" text NOT NULL,
	"artifact" jsonb,
	"usage" jsonb,
	"error" text,
	CONSTRAINT "operation_attempts_run_id_slot_purpose_pk" PRIMARY KEY("run_id","slot","purpose")
);
--> statement-breakpoint
CREATE TABLE "proposal_decisions" (
	"command_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"idea_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"decision" text NOT NULL,
	"payload_identity" text NOT NULL,
	"historical_context" integer NOT NULL,
	"acknowledged_unreviewed" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operation_manifests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"hash" text NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_controls" (
	"command_id" uuid PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"payload_identity" text NOT NULL,
	"result" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operation_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"manifest_id" uuid NOT NULL,
	"command_id" uuid NOT NULL,
	"payload_identity" text NOT NULL,
	"state" text NOT NULL,
	"workflow_id" text,
	"dispatch_generation" integer DEFAULT 0 NOT NULL,
	"reserved_micros" integer NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operation_runs_command_id_unique" UNIQUE("command_id")
);
--> statement-breakpoint
CREATE TABLE "application_spending" (
	"id" text PRIMARY KEY NOT NULL,
	"reserved_micros" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposal_assessments" ADD CONSTRAINT "proposal_assessments_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_assessments" ADD CONSTRAINT "proposal_assessments_run_id_operation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."operation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_attempts" ADD CONSTRAINT "operation_attempts_run_id_operation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."operation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_decisions" ADD CONSTRAINT "proposal_decisions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_decisions" ADD CONSTRAINT "proposal_decisions_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_manifests" ADD CONSTRAINT "operation_manifests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_controls" ADD CONSTRAINT "run_controls_run_id_operation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."operation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_runs" ADD CONSTRAINT "operation_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_runs" ADD CONSTRAINT "operation_runs_manifest_id_operation_manifests_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."operation_manifests"("id") ON DELETE no action ON UPDATE no action;