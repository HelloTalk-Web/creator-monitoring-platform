import winston from 'winston'

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
}

// 添加颜色到winston
winston.addColors(colors)

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.stack ? '\n' + info.stack : ''
    }${
      info.userId || info.accountId || info.error ?
        '\n  Context: ' + JSON.stringify({
          userId: info.userId,
          accountId: info.accountId,
          platform: info.platform,
          error: info.error
        }, null, 2) : ''
    }`
  )
)

// 定义传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      format
    )
  }),
  // 错误日志文件
  new winston.transports.File({
    filename: process.env.ERROR_LOG_FILE || 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  // 所有日志文件
  new winston.transports.File({
    filename: process.env.COMBINED_LOG_FILE || 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
]

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'creator-monitoring-api' },
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({ filename: process.env.EXCEPTION_LOG_FILE || 'logs/exceptions.log' })
  ],
  // 处理未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({ filename: process.env.REJECTION_LOG_FILE || 'logs/rejections.log' })
  ]
})

// 生产环境下的额外配置
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: process.env.PRODUCTION_LOG_FILE || 'logs/production.log',
    level: 'warn',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }))
}

// 开发环境下的额外配置
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// 导出便捷方法
export const logError = (message: string, meta?: any) => {
  logger.error(message, meta)
}

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta)
}

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta)
}

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta)
}

// 创建子logger
export const createChildLogger = (service: string) => {
  return logger.child({ service })
}

// HTTP请求日志中间件
export const httpLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'http' },
  transports: [
    new winston.transports.File({
      filename: process.env.HTTP_LOG_FILE || 'logs/http.log',
      format: winston.format.json()
    })
  ]
})

export default logger