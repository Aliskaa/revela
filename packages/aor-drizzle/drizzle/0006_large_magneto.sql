ALTER TABLE "participant_progress" ALTER COLUMN "self_rating_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "self_rating_status" SET DEFAULT 'pending'::text;--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "peer_feedback_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "peer_feedback_status" SET DEFAULT 'pending'::text;--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "element_humain_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "element_humain_status" SET DEFAULT 'locked'::text;--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "results_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "results_status" SET DEFAULT 'locked'::text;--> statement-breakpoint
DROP TYPE "public"."participant_step_status";--> statement-breakpoint
CREATE TYPE "public"."participant_step_status" AS ENUM('locked', 'pending', 'completed');--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "self_rating_status" SET DEFAULT 'pending'::"public"."participant_step_status";--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "self_rating_status" SET DATA TYPE "public"."participant_step_status" USING "self_rating_status"::"public"."participant_step_status";--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "peer_feedback_status" SET DEFAULT 'pending'::"public"."participant_step_status";--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "peer_feedback_status" SET DATA TYPE "public"."participant_step_status" USING "peer_feedback_status"::"public"."participant_step_status";--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "element_humain_status" SET DEFAULT 'locked'::"public"."participant_step_status";--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "element_humain_status" SET DATA TYPE "public"."participant_step_status" USING "element_humain_status"::"public"."participant_step_status";--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "results_status" SET DEFAULT 'locked'::"public"."participant_step_status";--> statement-breakpoint
ALTER TABLE "participant_progress" ALTER COLUMN "results_status" SET DATA TYPE "public"."participant_step_status" USING "results_status"::"public"."participant_step_status";
