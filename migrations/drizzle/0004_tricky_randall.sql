ALTER TABLE "spots_images" ADD COLUMN "uploaded_by" uuid;--> statement-breakpoint
ALTER TABLE "spots_images" ADD CONSTRAINT "spots_images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spots_images_spot_id_idx" ON "spots_images" USING btree ("spot_id");