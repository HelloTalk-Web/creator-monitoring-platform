export { platformController } from './controller/platform.controller'
export { platformManager } from './managers/platform.manager'
export type {
  CreatePlatformRequest,
  UpdatePlatformRequest,
  PlatformResponse,
  PlatformsListResponse,
  PlatformFilters
} from './types'
export { default as platformRoutes } from './routes'