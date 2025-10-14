import { Request, Response } from 'express'
import { db } from '../../../shared/database/db'
import { users, type NewUser, type User } from '../../../shared/database/schema'
import { eq, desc, like, and, ilike } from 'drizzle-orm'
import { logger } from '../../../shared/utils/logger'
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UsersListResponse,
  UserFilters
} from '../types'

export class UserService {
  // 获取用户列表
  async getUsers(req: Request, res: Response) {
    try {
      const { page, limit, email, name } = req.query

      const filters = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        email: email as string,
        name: name as string
      }

      const { page: pageNum = 1, limit: limitNum = 10 } = filters
      const offset = (pageNum - 1) * limitNum

      // 构建查询条件
      const whereConditions = []

      if (filters.email) {
        whereConditions.push(ilike(users.email, `%${filters.email}%`))
      }

      if (filters.name) {
        whereConditions.push(ilike(users.name, `%${filters.name}%`))
      }

      // 查询数据
      let query = db.select().from(users)

      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions))
      }

      const userList = await query
        .limit(limitNum)
        .offset(offset)
        .orderBy(desc(users.createdAt))

      // 查询总数
      let countQuery = db.select().from(users)

      if (whereConditions.length > 0) {
        countQuery = countQuery.where(and(...whereConditions))
      }

      const total = await countQuery
      const total_count = total.length

      logger.info('Users retrieved successfully', {
        count: userList.length,
        filters
      })

      const result = {
        users: userList.map(this.mapToResponse),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total_count,
          pages: Math.ceil(total_count / limitNum)
        }
      }

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Failed to get users', {
        query: req.query,
        error: (error as Error).message
      })
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get users'
        }
      })
    }
  }

  // 根据ID获取用户
  async getUser(req: Request, res: Response) {
    try {
      const { id } = req.params

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)))
        .limit(1)

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      logger.info('User retrieved successfully', { userId: id })

      res.json({
        success: true,
        data: { user: this.mapToResponse(user[0]) }
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to get user', {
        id: req.params.id,
        error: errorMessage
      })

      if (errorMessage === 'User not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user'
        }
      })
    }
  }

  // 创建用户
  async createUser(req: Request, res: Response) {
    try {
      const userData: CreateUserRequest = req.body

      // 基本验证
      if (!userData.email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required'
          }
        })
      }

      // 检查邮箱是否已存在
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1)

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists'
          }
        })
      }

      const newUser: NewUser = {
        email: userData.email,
        name: userData.name || null
      }

      const [createdUser] = await db
        .insert(users)
        .values(newUser)
        .returning()

      logger.info('User created successfully', {
        userId: createdUser.id,
        email: createdUser.email
      })

      res.status(201).json({
        success: true,
        data: { user: this.mapToResponse(createdUser) },
        message: 'User created successfully'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to create user', {
        body: req.body,
        error: errorMessage
      })

      if (errorMessage.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: errorMessage
          }
        })
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user'
        }
      })
    }
  }

  // 更新用户
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userData: UpdateUserRequest = req.body

      // 检查用户是否存在
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)))
        .limit(1)

      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      // 如果要更新邮箱，检查邮箱是否已被其他用户使用
      if (userData.email && userData.email !== existingUser[0].email) {
        const emailExists = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email))
          .limit(1)

        if (emailExists.length > 0) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email already exists'
            }
          })
        }
      }

      const updateData: Partial<User> = {
        updatedAt: new Date()
      }

      if (userData.email) updateData.email = userData.email
      if (userData.name !== undefined) updateData.name = userData.name

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, Number(id)))
        .returning()

      logger.info('User updated successfully', {
        userId: updatedUser.id,
        email: updatedUser.email
      })

      res.json({
        success: true,
        data: { user: this.mapToResponse(updatedUser) },
        message: 'User updated successfully'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to update user', {
        id: req.params.id,
        body: req.body,
        error: errorMessage
      })

      if (errorMessage === 'User not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      if (errorMessage === 'Email already exists') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: errorMessage
          }
        })
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user'
        }
      })
    }
  }

  // 删除用户
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params

      // 检查用户是否存在
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)))
        .limit(1)

      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      await db
        .delete(users)
        .where(eq(users.id, Number(id)))

      logger.info('User deleted successfully', {
        userId: existingUser[0].id,
        email: existingUser[0].email
      })

      res.json({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to delete user', {
        id: req.params.id,
        error: errorMessage
      })

      if (errorMessage === 'User not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete user'
        }
      })
    }
  }

  // 私有方法：映射到响应格式
  private mapToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    }
  }
}

// 导出单例
export const userService = new UserService()