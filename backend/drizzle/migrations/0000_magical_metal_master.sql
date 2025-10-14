CREATE TABLE "creator_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"platform_id" integer NOT NULL,
	"platform_user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"profile_url" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"follower_count" bigint DEFAULT 0,
	"following_count" bigint DEFAULT 0,
	"total_videos" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"status" text DEFAULT 'active',
	"last_scraped_at" timestamp,
	"last_video_crawl_at" timestamp,
	"scrape_frequency" integer DEFAULT 24,
	"metadata" json DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"base_url" varchar(255) NOT NULL,
	"url_pattern" varchar(255) NOT NULL,
	"color_code" varchar(7) DEFAULT '#1890ff',
	"icon_url" varchar(255),
	"rate_limit" integer DEFAULT 100,
	"supported_features" json DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "platforms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scrape_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"task_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"priority" integer DEFAULT 5,
	"config" json DEFAULT '{}',
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
	"view_count" bigint DEFAULT 0,
	"like_count" bigint DEFAULT 0,
	"comment_count" bigint DEFAULT 0,
	"share_count" bigint DEFAULT 0,
	"save_count" bigint DEFAULT 0,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"platform_video_id" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"video_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500) NOT NULL,
	"thumbnail_local_path" varchar(500),
	"duration" integer,
	"published_at" timestamp NOT NULL,
	"tags" json DEFAULT '[]',
	"view_count" bigint DEFAULT 0,
	"like_count" bigint DEFAULT 0,
	"comment_count" bigint DEFAULT 0,
	"share_count" bigint DEFAULT 0,
	"save_count" bigint DEFAULT 0,
	"first_scraped_at" timestamp DEFAULT now(),
	"last_updated_at" timestamp DEFAULT now(),
	"data_source" varchar(20) DEFAULT 'api',
	"metadata" json DEFAULT '{}'
);
--> statement-breakpoint
ALTER TABLE "creator_accounts" ADD CONSTRAINT "creator_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_accounts" ADD CONSTRAINT "creator_accounts_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_tasks" ADD CONSTRAINT "scrape_tasks_account_id_creator_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."creator_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_metrics_history" ADD CONSTRAINT "video_metrics_history_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_account_id_creator_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."creator_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_platform_unique" ON "creator_accounts" USING btree ("user_id","platform_id","platform_user_id");--> statement-breakpoint
CREATE INDEX "status_created_at_idx" ON "scrape_tasks" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "video_recorded_at_idx" ON "video_metrics_history" USING btree ("video_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "account_video_unique" ON "videos" USING btree ("account_id","platform_video_id");--> statement-breakpoint
CREATE INDEX "published_at_idx" ON "videos" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "last_updated_idx" ON "videos" USING btree ("last_updated_at");