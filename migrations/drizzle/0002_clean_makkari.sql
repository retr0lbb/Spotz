CREATE TABLE "spots_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spot_id" uuid NOT NULL,
	"mime_type" varchar(50),
	"size_bytes" integer,
	"key" varchar(512) NOT NULL,
	"alt" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "spots_images_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "spots_images" ADD CONSTRAINT "spots_images_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;