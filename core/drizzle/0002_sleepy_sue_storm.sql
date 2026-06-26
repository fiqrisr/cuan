ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_global_name_idx" ON "categories" USING btree ("name") WHERE user_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_name_idx" ON "categories" USING btree ("user_id","name") WHERE user_id IS NOT NULL;