CREATE TABLE "workspace_receipts" (
	"command_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor" text NOT NULL,
	"payload_identity" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_revisions" (
	"workspace_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"name" text NOT NULL,
	"brief" text NOT NULL,
	"constraints" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_revisions_workspace_id_revision_pk" PRIMARY KEY("workspace_id","revision")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"revision" integer NOT NULL,
	"name" text NOT NULL,
	"brief" text NOT NULL,
	"constraints" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_receipts" ADD CONSTRAINT "workspace_receipts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_revisions" ADD CONSTRAINT "workspace_revisions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;