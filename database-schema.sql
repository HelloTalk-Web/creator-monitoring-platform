-- ===============================================
-- 创作者数据监控平台 - 数据库结构
-- Creator Monitoring Platform - Database Schema
-- ===============================================
-- 导出时间: 2025-10-15
-- PostgreSQL版本: 17.6
-- 说明: 从实际运行的数据库导出的完整schema
-- ===============================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ===============================================
-- 1. 用户表 (Users)
-- ===============================================

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- ===============================================
-- 2. 平台配置表 (Platforms)
-- ===============================================

CREATE TABLE public.platforms (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(100) NOT NULL,
    base_url character varying(255) NOT NULL,
    url_pattern character varying(255) NOT NULL,
    color_code character varying(7) DEFAULT '#1890ff'::character varying,
    icon_url character varying(255),
    rate_limit integer DEFAULT 100,
    supported_features json DEFAULT '[]'::json,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.platforms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.platforms_id_seq OWNED BY public.platforms.id;
ALTER TABLE ONLY public.platforms ALTER COLUMN id SET DEFAULT nextval('public.platforms_id_seq'::regclass);

-- ===============================================
-- 3. 创作者账号表 (Creator Accounts)
-- ===============================================

CREATE TABLE public.creator_accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    platform_id integer NOT NULL,
    platform_user_id text NOT NULL,
    username text NOT NULL,
    display_name text,
    profile_url text NOT NULL,
    avatar_url text,
    bio text,
    follower_count bigint DEFAULT 0,
    following_count bigint DEFAULT 0,
    total_videos integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    last_scraped_at timestamp without time zone,
    last_video_crawl_at timestamp without time zone,
    scrape_frequency integer DEFAULT 24,
    metadata json DEFAULT '{}'::json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.creator_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.creator_accounts_id_seq OWNED BY public.creator_accounts.id;
ALTER TABLE ONLY public.creator_accounts ALTER COLUMN id SET DEFAULT nextval('public.creator_accounts_id_seq'::regclass);

-- ===============================================
-- 4. 视频数据表 (Videos)
-- ===============================================

CREATE TABLE public.videos (
    id integer NOT NULL,
    account_id integer NOT NULL,
    platform_video_id character varying(100) NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    video_url character varying(500) NOT NULL,
    thumbnail_url character varying(500) NOT NULL,
    thumbnail_local_path character varying(500),
    duration integer,
    published_at timestamp without time zone NOT NULL,
    tags json DEFAULT '[]'::json,
    view_count bigint DEFAULT 0,
    like_count bigint DEFAULT 0,
    comment_count bigint DEFAULT 0,
    share_count bigint DEFAULT 0,
    save_count bigint DEFAULT 0,
    first_scraped_at timestamp without time zone DEFAULT now(),
    last_updated_at timestamp without time zone DEFAULT now(),
    data_source character varying(20) DEFAULT 'api'::character varying,
    metadata json DEFAULT '{}'::json,
    page_url text
);

CREATE SEQUENCE public.videos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.videos_id_seq OWNED BY public.videos.id;
ALTER TABLE ONLY public.videos ALTER COLUMN id SET DEFAULT nextval('public.videos_id_seq'::regclass);

-- ===============================================
-- 5. 视频历史数据表 (Video Metrics History)
-- ===============================================

CREATE TABLE public.video_metrics_history (
    id integer NOT NULL,
    video_id integer NOT NULL,
    view_count bigint DEFAULT 0,
    like_count bigint DEFAULT 0,
    comment_count bigint DEFAULT 0,
    share_count bigint DEFAULT 0,
    save_count bigint DEFAULT 0,
    recorded_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.video_metrics_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.video_metrics_history_id_seq OWNED BY public.video_metrics_history.id;
ALTER TABLE ONLY public.video_metrics_history ALTER COLUMN id SET DEFAULT nextval('public.video_metrics_history_id_seq'::regclass);

-- ===============================================
-- 6. 抓取任务表 (Scrape Tasks)
-- ===============================================

CREATE TABLE public.scrape_tasks (
    id integer NOT NULL,
    account_id integer,
    task_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    priority integer DEFAULT 5,
    config json DEFAULT '{}'::json,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    total_videos_found integer DEFAULT 0,
    new_videos_added integer DEFAULT 0,
    videos_updated integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.scrape_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.scrape_tasks_id_seq OWNED BY public.scrape_tasks.id;
ALTER TABLE ONLY public.scrape_tasks ALTER COLUMN id SET DEFAULT nextval('public.scrape_tasks_id_seq'::regclass);

-- ===============================================
-- 7. 系统配置表 (System Configs)
-- ===============================================

CREATE TABLE public.system_configs (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value json NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.system_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.system_configs_id_seq OWNED BY public.system_configs.id;
ALTER TABLE ONLY public.system_configs ALTER COLUMN id SET DEFAULT nextval('public.system_configs_id_seq'::regclass);

-- ===============================================
-- 主键约束 (Primary Keys)
-- ===============================================

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.creator_accounts
    ADD CONSTRAINT creator_accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.video_metrics_history
    ADD CONSTRAINT video_metrics_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.scrape_tasks
    ADD CONSTRAINT scrape_tasks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (id);

-- ===============================================
-- 唯一约束 (Unique Constraints)
-- ===============================================

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);

ALTER TABLE ONLY public.platforms
    ADD CONSTRAINT platforms_name_unique UNIQUE (name);

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_key_unique UNIQUE (key);

-- ===============================================
-- 索引 (Indexes)
-- ===============================================

-- 创作者账号唯一索引 (同一用户不能重复添加同一平台的同一账号)
CREATE UNIQUE INDEX user_platform_unique ON public.creator_accounts USING btree (user_id, platform_id, platform_user_id);

-- 视频唯一索引 (同一账号不能有重复的视频)
CREATE UNIQUE INDEX account_video_unique ON public.videos USING btree (account_id, platform_video_id);

-- 视频查询索引
CREATE INDEX published_at_idx ON public.videos USING btree (published_at);
CREATE INDEX last_updated_idx ON public.videos USING btree (last_updated_at);

-- 历史数据查询索引
CREATE INDEX video_recorded_at_idx ON public.video_metrics_history USING btree (video_id, recorded_at);

-- 任务查询索引
CREATE INDEX status_created_at_idx ON public.scrape_tasks USING btree (status, created_at);

-- ===============================================
-- 外键约束 (Foreign Keys)
-- ===============================================

ALTER TABLE ONLY public.creator_accounts
    ADD CONSTRAINT creator_accounts_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.creator_accounts
    ADD CONSTRAINT creator_accounts_platform_id_platforms_id_fk 
    FOREIGN KEY (platform_id) REFERENCES public.platforms(id);

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_account_id_creator_accounts_id_fk 
    FOREIGN KEY (account_id) REFERENCES public.creator_accounts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.video_metrics_history
    ADD CONSTRAINT video_metrics_history_video_id_videos_id_fk 
    FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.scrape_tasks
    ADD CONSTRAINT scrape_tasks_account_id_creator_accounts_id_fk 
    FOREIGN KEY (account_id) REFERENCES public.creator_accounts(id) ON DELETE CASCADE;

-- ===============================================
-- 初始数据 (Initial Data)
-- ===============================================

-- 插入默认用户
INSERT INTO public.users (id, email, name) VALUES (1, 'admin@hellotalk.com', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- 插入平台数据
INSERT INTO public.platforms (name, display_name, base_url, url_pattern, color_code, rate_limit) VALUES
('tiktok', 'TikTok', 'https://www.tiktok.com', '^https://(www\.)?tiktok\.com/@[^/]+/?', '#000000', 100),
('youtube', 'YouTube', 'https://www.youtube.com', '^https://(www\.)?youtube\.com/(c|channel|user|@)[^/]+/?', '#FF0000', 100),
('instagram', 'Instagram', 'https://www.instagram.com', '^https://(www\.)?instagram\.com/[^/]+/?', '#E4405F', 100),
('douyin', '抖音', 'https://www.douyin.com', '^https://(www\.)?douyin\.com/user/[^/]+/?', '#000000', 50),
('xiaohongshu', '小红书', 'https://www.xiaohongshu.com', '^https://(www\.)?xiaohongshu\.com/user/profile/[^/]+/?', '#FE2C55', 50),
('facebook', 'Facebook', 'https://www.facebook.com', '^https://(www\.)?facebook\.com/[^/]+/?', '#1877F2', 100)
ON CONFLICT (name) DO NOTHING;

-- ===============================================
-- 说明
-- ===============================================
-- 
-- 表结构说明:
-- 1. users - 用户表,存储系统用户信息
-- 2. platforms - 平台配置,定义支持的社交媒体平台
-- 3. creator_accounts - 创作者账号,关联用户和平台
-- 4. videos - 视频数据,存储视频的基本信息和互动指标
-- 5. video_metrics_history - 历史快照,用于趋势分析
-- 6. scrape_tasks - 爬虫任务,管理数据抓取任务
-- 7. system_configs - 系统配置,存储系统级配置参数
--
-- 数据类型说明:
-- - bigint: 用于可能超过int范围的计数器(播放量、点赞数等)
-- - json: 用于灵活存储平台特定的元数据
-- - text: 用于不确定长度的文本字段
--
-- 索引策略:
-- - 唯一索引保证数据完整性
-- - btree索引优化常见查询
-- - 复合索引优化多条件查询
--
-- 外键策略:
-- - ON DELETE CASCADE: 级联删除相关数据
-- - 保持数据一致性
--
