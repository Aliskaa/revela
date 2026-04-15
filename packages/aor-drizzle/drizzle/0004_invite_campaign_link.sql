ALTER TABLE "invite_tokens" ADD COLUMN IF NOT EXISTS "campaign_id" integer;
--> statement-breakpoint
ALTER TABLE "invite_tokens"
    ADD CONSTRAINT "invite_tokens_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invite_tokens_campaign_id_idx" ON "invite_tokens" USING btree ("campaign_id");
