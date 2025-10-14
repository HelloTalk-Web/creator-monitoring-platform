export interface CreateUserRequest {
  email: string
  name?: string
}

export interface UpdateUserRequest {
  email?: string
  name?: string
}

export interface UserResponse {
  id: number
  email: string
  name: string | null
  created_at: string
  updated_at: string
}

export interface UsersListResponse {
  users: UserResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface UserFilters {
  email?: string
  name?: string
  page?: number
  limit?: number
}