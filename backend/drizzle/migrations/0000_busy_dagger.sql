CREATE TABLE "creator_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform_id" integer NOT NULL,
	"platform_user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"profile_url" text NOT NULL,
	"avatar_url" text,
	"local_avatar_url" text,
	"bio" text,
	"follower_count" bigint,
	"following_count" bigint,
	"total_videos" integer,
	"is_verified" boolean,
	"status" text,
	"last_scraped_at" timestamp,
	"last_video_crawl_at" timestamp,
	"scrape_frequency" integer,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "image_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_url" text NOT NULL,
	"url_hash" varchar(32) NOT NULL,
	"local_path" text,
	"file_size" bigint,
	"mime_type" varchar(50),
	"download_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp,
	"access_count" bigint DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp,
	"first_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "image_metadata_original_url_unique" UNIQUE("original_url"),
	CONSTRAINT "image_metadata_url_hash_unique" UNIQUE("url_hash")
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"base_url" varchar(255) NOT NULL,
	"url_pattern" varchar(255) NOT NULL,
	"color_code" varchar(7),
	"icon_url" varchar(255),
	"rate_limit" integer,
	"supported_features" json,
	"is_active" boolean,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scrape_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"task_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"priority" integer DEFAULT 5,
	"config" json,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"total_videos_found" integer DEFAULT 0,
	"new_videos_added" integer DEFAULT 0,
	"videos_updated" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" json NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_configs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "video_metrics_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer NOT NULL,
	"view_count" bigint,
	"like_count" bigint,
	"comment_count" bigint,
	"share_count" bigint,
	"save_count" bigint,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"platform_video_id" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"page_url" text,
	"thumbnail_url" text NOT NULL,
	"thumbnail_local_path" varchar(500),
	"duration" integer,
	"published_at" timestamp NOT NULL,
	"tags" json,
	"view_count" bigint,
	"like_count" bigint,
	"comment_count" bigint,
	"share_count" bigint,
	"save_count" bigint,
	"first_scraped_at" timestamp,
	"last_updated_at" timestamp,
	"data_source" varchar(20),
	"metadata" json
);
--> statement-breakpoint
ALTER TABLE "scrape_tasks" ADD CONSTRAINT "scrape_tasks_account_id_creator_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."creator_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_metrics_history" ADD CONSTRAINT "video_metrics_history_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_image_url_hash" ON "image_metadata" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "idx_image_status" ON "image_metadata" USING btree ("download_status");--> statement-breakpoint
CREATE INDEX "idx_image_access" ON "image_metadata" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX "status_created_at_idx" ON "scrape_tasks" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "video_recorded_at_idx" ON "video_metrics_history" USING btree ("video_id","recorded_at");