CREATE TABLE "graph_receipts" (
	"command_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"payload_identity" text NOT NULL,
	"result" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_layouts" (
	"idea_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"width" double precision NOT NULL,
	"height" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_relationships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"source_revision" integer NOT NULL,
	"target_revision" integer NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"contribution" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_revisions" (
	"workspace_id" uuid NOT NULL,
	"idea_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "idea_revisions_workspace_id_idea_id_revision_pk" PRIMARY KEY("workspace_id","idea_id","revision")
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"revision" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "viewpoints" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"revision" integer NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"zoom" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "graph_receipts" ADD CONSTRAINT "graph_receipts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_layouts" ADD CONSTRAINT "idea_layouts_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_layouts" ADD CONSTRAINT "idea_layouts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_relationships" ADD CONSTRAINT "idea_relationships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_relationships" ADD CONSTRAINT "idea_relationships_workspace_id_from_id_source_revision_idea_revisions_workspace_id_idea_id_revision_fk" FOREIGN KEY ("workspace_id","from_id","source_revision") REFERENCES "public"."idea_revisions"("workspace_id","idea_id","revision") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_relationships" ADD CONSTRAINT "idea_relationships_workspace_id_to_id_target_revision_idea_revisions_workspace_id_idea_id_revision_fk" FOREIGN KEY ("workspace_id","to_id","target_revision") REFERENCES "public"."idea_revisions"("workspace_id","idea_id","revision") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_revisions" ADD CONSTRAINT "idea_revisions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_revisions" ADD CONSTRAINT "idea_revisions_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewpoints" ADD CONSTRAINT "viewpoints_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;