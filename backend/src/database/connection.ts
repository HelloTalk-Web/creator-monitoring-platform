import { Pool, PoolClient, PoolConfig } from 'pg';
import { logger } from '@/utils/logger';

/**
 * PostgreSQL数据库连接管理器
 * 提供数据库连接池和操作接口
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;
  private isInitialized: boolean = false;

  private constructor() {
    // 私有构造函数
  }

  /**
   * 获取数据库连接实例
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * 初始化数据库连接池
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 数据库连接配置
      const config: PoolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'creator_monitoring',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20, // 最大连接数
        idleTimeoutMillis: 30000, // 30秒空闲超时
        connectionTimeoutMillis: 10000, // 10秒连接超时
        ssl: process.env.DB_SSL === 'true' ? {
          rejectUnauthorized: false
        } : false
      };

      // 创建连接池
      this.pool = new Pool(config);

      // 测试连接
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      // 初始化表结构
      await this.createTables();

      this.isInitialized = true;
      logger.info('PostgreSQL database initialized successfully', {
        host: config.host,
        port: config.port,
        database: config.database
      });
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL database', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * 创建数据库表
   */
  private async createTables(): Promise<void> {
    try {
      // 创建用户表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          avatar_url VARCHAR(500),
          plan_type VARCHAR(50) DEFAULT 'free',
          api_quota INTEGER DEFAULT 1000,
          api_used INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建平台表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS platforms (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          base_url VARCHAR(200) NOT NULL,
          url_pattern VARCHAR(500) NOT NULL,
          color_code VARCHAR(7) DEFAULT '#1890ff',
          icon_url VARCHAR(200),
          rate_limit INTEGER DEFAULT 100,
          supported_features JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建创作者账号表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS creator_accounts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          platform_id INTEGER NOT NULL,
          platform_user_id VARCHAR(200) NOT NULL,
          username VARCHAR(200) NOT NULL,
          display_name VARCHAR(200),
          profile_url TEXT NOT NULL,
          avatar_url TEXT,
          bio TEXT,
          follower_count BIGINT DEFAULT 0,
          following_count BIGINT DEFAULT 0,
          total_videos INTEGER DEFAULT 0,
          is_verified BOOLEAN DEFAULT false,
          status VARCHAR(20) DEFAULT 'active',
          last_scraped_at TIMESTAMP WITH TIME ZONE,
          last_video_crawl_at TIMESTAMP WITH TIME ZONE,
          scrape_frequency INTEGER DEFAULT 24,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (platform_id) REFERENCES platforms(id),
          UNIQUE(user_id, platform_id, platform_user_id)
        )
      `);

      // 创建视频表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id SERIAL PRIMARY KEY,
          account_id INTEGER NOT NULL,
          platform_video_id VARCHAR(200) NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT NOT NULL,
          thumbnail_local_path TEXT,
          duration INTEGER,
          published_at TIMESTAMP WITH TIME ZONE NOT NULL,
          tags JSONB DEFAULT '[]',
          view_count BIGINT DEFAULT 0,
          like_count BIGINT DEFAULT 0,
          comment_count BIGINT DEFAULT 0,
          share_count BIGINT DEFAULT 0,
          save_count BIGINT DEFAULT 0,
          first_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          data_source VARCHAR(50) DEFAULT 'api',
          metadata JSONB DEFAULT '{}',
          FOREIGN KEY (account_id) REFERENCES creator_accounts(id) ON DELETE CASCADE,
          UNIQUE(account_id, platform_video_id)
        )
      `);

      // 创建视频指标历史表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS video_metrics_history (
          id SERIAL PRIMARY KEY,
          video_id INTEGER NOT NULL,
          view_count BIGINT DEFAULT 0,
          like_count BIGINT DEFAULT 0,
          comment_count BIGINT DEFAULT 0,
          share_count BIGINT DEFAULT 0,
          save_count BIGINT DEFAULT 0,
          recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )
      `);

      // 创建抓取任务表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS scrape_tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          account_id INTEGER,
          task_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          priority INTEGER DEFAULT 5,
          config JSONB DEFAULT '{}',
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          total_videos_found INTEGER DEFAULT 0,
          new_videos_added INTEGER DEFAULT 0,
          videos_updated INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (account_id) REFERENCES creator_accounts(id) ON DELETE CASCADE
        )
      `);

      // 创建系统配置表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS system_configs (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          is_public BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建审计日志表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50) NOT NULL,
          resource_id INTEGER,
          old_values JSONB,
          new_values JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // 创建索引
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_creator_accounts_user_id ON creator_accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_creator_accounts_platform_id ON creator_accounts(platform_id);
        CREATE INDEX IF NOT EXISTS idx_creator_accounts_status ON creator_accounts(status);
        CREATE INDEX IF NOT EXISTS idx_creator_accounts_last_scraped ON creator_accounts(last_scraped_at);
        CREATE INDEX IF NOT EXISTS idx_videos_account_id ON videos(account_id);
        CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_videos_last_updated ON videos(last_updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_scrape_tasks_user_id ON scrape_tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_scrape_tasks_status ON scrape_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_scrape_tasks_created_at ON scrape_tasks(created_at DESC);
      `);

      // 插入初始平台数据
      await this.insertInitialPlatforms();

      // 插入默认系统配置
      await this.insertDefaultConfigs();

      logger.info('PostgreSQL tables created successfully');
    } catch (error) {
      logger.error('Failed to create database tables', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * 插入初始平台数据
   */
  private async insertInitialPlatforms(): Promise<void> {
    const platforms = [
      {
        name: 'tiktok',
        display_name: 'TikTok',
        base_url: 'https://www.tiktok.com',
        url_pattern: '^https://(www\\.)?tiktok\\.com/@[^/]+/?',
        color_code: '#000000',
        rate_limit: 100
      },
      {
        name: 'instagram',
        display_name: 'Instagram',
        base_url: 'https://www.instagram.com',
        url_pattern: '^https://(www\\.)?instagram\\.com/[^/]+/?',
        color_code: '#E4405F',
        rate_limit: 100
      },
      {
        name: 'youtube',
        display_name: 'YouTube',
        base_url: 'https://www.youtube.com',
        url_pattern: '^https://(www\\.)?youtube\\.com/(c|channel|user)/[^/]+/?',
        color_code: '#FF0000',
        rate_limit: 100
      },
      {
        name: 'facebook',
        display_name: 'Facebook',
        base_url: 'https://www.facebook.com',
        url_pattern: '^https://(www\\.)?facebook\\.com/[^/]+/?',
        color_code: '#1877F2',
        rate_limit: 100
      },
      {
        name: 'xiaohongshu',
        display_name: '小红书',
        base_url: 'https://www.xiaohongshu.com',
        url_pattern: '^https://(www\\.)?xiaohongshu\\.com/user/profile/[^/]+/?',
        color_code: '#FE2C55',
        rate_limit: 50
      },
      {
        name: 'douyin',
        display_name: '抖音',
        base_url: 'https://www.douyin.com',
        url_pattern: '^https://(www\\.)?douyin\\.com/user/[^/]+/?',
        color_code: '#000000',
        rate_limit: 50
      }
    ];

    for (const platform of platforms) {
      await this.pool.query(`
        INSERT INTO platforms (name, display_name, base_url, url_pattern, color_code, rate_limit)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO NOTHING
      `, [
        platform.name,
        platform.display_name,
        platform.base_url,
        platform.url_pattern,
        platform.color_code,
        platform.rate_limit
      ]);
    }
  }

  /**
   * 插入默认系统配置
   */
  private async insertDefaultConfigs(): Promise<void> {
    const configs = [
      {
        key: 'scrape_limits',
        value: {
          daily_per_user: 1000,
          hourly_per_account: 10,
          concurrent_per_user: 3
        },
        description: '抓取限制配置',
        is_public: true
      },
      {
        key: 'data_retention',
        value: {
          video_metrics_days: 90,
          task_logs_days: 30
        },
        description: '数据保留期限',
        is_public: false
      },
      {
        key: 'api_settings',
        value: {
          timeout: 30000,
          retry_attempts: 3,
          rate_limit_window: 3600
        },
        description: 'API设置',
        is_public: false
      }
    ];

    for (const config of configs) {
      await this.pool.query(`
        INSERT INTO system_configs (key, value, description, is_public)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key) DO NOTHING
      `, [
        config.key,
        JSON.stringify(config.value),
        config.description,
        config.is_public
      ]);
    }
  }

  /**
   * 获取数据库连接池
   */
  public getPool(): Pool {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * 执行查询
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T> {
    const pool = this.getPool();
    const start = Date.now();

    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rowCount: result.rowCount
      });

      return result as T;
    } catch (error) {
      logger.error('Database query failed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * 执行事务
   */
  public async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 关闭数据库连接池
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isInitialized = false;
      logger.info('PostgreSQL connection pool closed');
    }
  }
}

/**
 * 数据库实例导出
 */
export const db = DatabaseConnection.getInstance();