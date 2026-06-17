ALTER TABLE "spots" ADD COLUMN "lat" numeric(9, 6) NOT NULL;--> statement-breakpoint
ALTER TABLE "spots" ADD COLUMN "lon" numeric(9, 6) NOT NULL;--> statement-breakpoint
ALTER TABLE "spots" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "spots" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
CREATE INDEX "spots_lat_lon_idx" ON "spots" USING btree ("lat","lon");--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_alias_lat_lon_unique" UNIQUE("alias","lon","lat");