ALTER TABLE "users" DROP CONSTRAINT "users_pictureId_images_metadata_id_fk";
--> statement-breakpoint
ALTER TABLE "spots" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_pictureId_images_metadata_id_fk" FOREIGN KEY ("pictureId") REFERENCES "public"."images_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_pictureId_unique" UNIQUE("pictureId");