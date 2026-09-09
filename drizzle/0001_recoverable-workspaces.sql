ALTER TABLE "workspace_revisions" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;