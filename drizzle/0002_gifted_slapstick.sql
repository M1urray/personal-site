ALTER TABLE "posts" ADD COLUMN "scheduled_for" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "posts_scheduled_for_idx" ON "posts" USING btree ("status","scheduled_for");