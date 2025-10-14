import { db } from '../../../shared/database/db'
import { platforms, type NewPlatform, type Platform } from '../../../shared/database/schema'
import { eq, desc, like, and, ilike, asc } from 'drizzle-orm'
import { logger } from '../../../shared/utils/logger'
import type {
  CreatePlatformRequest,
  UpdatePlatformRequest,
  PlatformResponse,
  PlatformsListResponse,
  PlatformFilters
} from '../types'

/**
 * 平台仓储层 - 只负责数据访问
 */
export class PlatformRepository {
  /**
   * 获取平台列表
   */
  async findMany(filters: PlatformFilters = {}): Promise<PlatformsListResponse> {
    try {
      const { page = 1, limit = 10, name, isActive } = filters
      const offset = (page - 1) * limit

      // 构建查询条件
      const whereConditions = []

      if (name) {
        whereConditions.push(ilike(platforms.name, `%${name}%`))
      }

      if (isActive !== undefined) {
        whereConditions.push(eq(platforms.isActive, isActive))
      }

      // 构建查询条件
      const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined

      // 查询数据 - 使用条件渲染来避免类型问题
      const platformList = await (
        whereCondition
          ? db.select().from(platforms).where(whereCondition)
          : db.select().from(platforms)
      )
        .limit(limit)
        .offset(offset)
        .orderBy(asc(platforms.name))

      // 查询总数
      const total = await (
        whereCondition
          ? db.select().from(platforms).where(whereCondition)
          : db.select().from(platforms)
      )

      const total_count = total.length

      logger.info('Platforms retrieved successfully', {
        count: platformList.length,
        filters
      })

      return {
        platforms: platformList.map(platform => this.mapToResponse(platform)),
        pagination: {
          page,
          limit,
          total: total_count,
          pages: Math.ceil(total_count / limit)
        }
      }
    } catch (error) {
      logger.error('Failed to find platforms', {
        filters,
        error: (error as Error).message
      })
      throw new Error(`Failed to find platforms: ${(error as Error).message}`)
    }
  }

  /**
   * 根据ID查找平台
   */
  async findById(id: number): Promise<PlatformResponse | null> {
    try {
      const platform = await db
        .select()
        .from(platforms)
        .where(eq(platforms.id, id))
        .limit(1)

      if (platform.length === 0) {
        return null
      }

      logger.info('Platform retrieved successfully', { platformId: id })
      return this.mapToResponse(platform[0])
    } catch (error) {
      logger.error('Failed to find platform by id', {
        id,
        error: (error as Error).message
      })
      throw new Error(`Failed to find platform: ${(error as Error).message}`)
    }
  }

  /**
   * 根据名称查找平台
   */
  async findByName(name: string): Promise<PlatformResponse | null> {
    try {
      const platform = await db
        .select()
        .from(platforms)
        .where(eq(platforms.name, name))
        .limit(1)

      if (platform.length === 0) {
        return null
      }

      return this.mapToResponse(platform[0])
    } catch (error) {
      logger.error('Failed to find platform by name', {
        name,
        error: (error as Error).message
      })
      throw new Error(`Failed to find platform by name: ${(error as Error).message}`)
    }
  }

  /**
   * 创建平台
   */
  async create(platformData: CreatePlatformRequest): Promise<PlatformResponse> {
    try {
      // 检查平台名称是否已存在
      const existingPlatform = await this.findByName(platformData.name)

      if (existingPlatform) {
        throw new Error('Platform with this name already exists')
      }

      const newPlatform: NewPlatform = {
        name: platformData.name,
        displayName: platformData.displayName,
        baseUrl: platformData.baseUrl,
        urlPattern: platformData.urlPattern,
        colorCode: platformData.colorCode || '#1890ff',
        iconUrl: platformData.iconUrl || null,
        rateLimit: platformData.rateLimit || 100,
        supportedFeatures: platformData.supportedFeatures || [],
        isActive: platformData.isActive !== undefined ? platformData.isActive : true
      }

      const [createdPlatform] = await db
        .insert(platforms)
        .values(newPlatform)
        .returning()

      logger.info('Platform created successfully', {
        platformId: createdPlatform.id,
        name: createdPlatform.name
      })

      return this.mapToResponse(createdPlatform)
    } catch (error) {
      logger.error('Failed to create platform', {
        platformData,
        error: (error as Error).message
      })
      throw new Error(`Failed to create platform: ${(error as Error).message}`)
    }
  }

  /**
   * 更新平台
   */
  async update(id: number, platformData: UpdatePlatformRequest): Promise<PlatformResponse> {
    try {
      // 检查平台是否存在
      const existingPlatform = await this.findById(id)

      if (!existingPlatform) {
        throw new Error('Platform not found')
      }

      // 如果要更新名称，检查名称是否已被其他平台使用
      if (platformData.name && platformData.name !== existingPlatform.name) {
        const nameExists = await this.findByName(platformData.name)

        if (nameExists) {
          throw new Error('Platform name already exists')
        }
      }

      const updateData: Partial<Platform> = {
        updatedAt: new Date()
      }

      if (platformData.name) updateData.name = platformData.name
      if (platformData.displayName) updateData.displayName = platformData.displayName
      if (platformData.baseUrl) updateData.baseUrl = platformData.baseUrl
      if (platformData.urlPattern) updateData.urlPattern = platformData.urlPattern
      if (platformData.colorCode !== undefined) updateData.colorCode = platformData.colorCode
      if (platformData.iconUrl !== undefined) updateData.iconUrl = platformData.iconUrl
      if (platformData.rateLimit !== undefined) updateData.rateLimit = platformData.rateLimit
      if (platformData.supportedFeatures !== undefined) updateData.supportedFeatures = platformData.supportedFeatures
      if (platformData.isActive !== undefined) updateData.isActive = platformData.isActive

      const [updatedPlatform] = await db
        .update(platforms)
        .set(updateData)
        .where(eq(platforms.id, id))
        .returning()

      logger.info('Platform updated successfully', {
        platformId: updatedPlatform.id,
        name: updatedPlatform.name
      })

      return this.mapToResponse(updatedPlatform)
    } catch (error) {
      logger.error('Failed to update platform', {
        id,
        platformData,
        error: (error as Error).message
      })
      throw new Error(`Failed to update platform: ${(error as Error).message}`)
    }
  }

  /**
   * 删除平台
   */
  async delete(id: number): Promise<void> {
    try {
      // 检查平台是否存在
      const existingPlatform = await this.findById(id)

      if (!existingPlatform) {
        throw new Error('Platform not found')
      }

      await db
        .delete(platforms)
        .where(eq(platforms.id, id))

      logger.info('Platform deleted successfully', {
        platformId: existingPlatform.id,
        name: existingPlatform.name
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to delete platform', {
        id,
        error: errorMessage
      })

      // 检查是否因为外键约束导致删除失败
      if (errorMessage.includes('violates foreign key constraint')) {
        throw new Error('Cannot delete platform that is in use by creator accounts')
      }

      throw new Error(`Failed to delete platform: ${errorMessage}`)
    }
  }

  /**
   * 检查平台是否存在
   */
  async exists(id: number): Promise<boolean> {
    try {
      const platform = await db
        .select({ id: platforms.id })
        .from(platforms)
        .where(eq(platforms.id, id))
        .limit(1)

      return platform.length > 0
    } catch (error) {
      logger.error('Failed to check platform existence', {
        id,
        error: (error as Error).message
      })
      return false
    }
  }

  /**
   * 私有方法：映射到响应格式
   */
  private mapToResponse(platform: Platform): PlatformResponse {
    return {
      id: platform.id,
      name: platform.name,
      displayName: platform.displayName,
      baseUrl: platform.baseUrl,
      urlPattern: platform.urlPattern,
      colorCode: platform.colorCode,
      iconUrl: platform.iconUrl,
      rateLimit: platform.rateLimit,
      supportedFeatures: platform.supportedFeatures,
      isActive: platform.isActive,
      created_at: platform.createdAt.toISOString(),
      updated_at: platform.updatedAt.toISOString()
    }
  }
}

// 导出单例
export const platformRepository = new PlatformRepository()