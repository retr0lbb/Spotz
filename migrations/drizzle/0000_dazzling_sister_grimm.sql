CREATE TABLE "images_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"s3_key" varchar(512) NOT NULL,
	"mime_type" varchar(50),
	"size_bytes" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "images_metadata_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
CREATE TABLE "spots_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spot_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "spots_images_image_id_unique" UNIQUE("image_id")
);
--> statement-breakpoint
CREATE TABLE "spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alias" varchar NOT NULL,
	"description" varchar,
	"location" geography(Point,4326) NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "spots_images" ADD CONSTRAINT "spots_images_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots_images" ADD CONSTRAINT "spots_images_image_id_images_metadata_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spots_location_idx" ON "spots" USING gist ("location");