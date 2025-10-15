/**
 * API密钥管理服务
 * 提供统一的API密钥管理和积分查询功能
 */
export class ApiKeyService {
  private baseUrl: string
  private apiKeys: string[] | null = null
  private currentKeyIndex: number = 0

  constructor() {
    this.baseUrl = process.env.SCRAPE_CREATORS_BASE_URL || 'https://api.scrapecreators.com'
  }

  /**
   * 初始化API密钥(延迟加载)
   */
  private initializeApiKeys(): void {
    if (this.apiKeys !== null) {
      return
    }

    // 解析多个API密钥(逗号分隔)
    const apiKeyEnv = process.env.SCRAPE_CREATORS_API_KEY || ''
    this.apiKeys = apiKeyEnv
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0)
  }

  /**
   * 获取当前API密钥(轮询方式)
   */
  getNextApiKey(): string {
    this.initializeApiKeys()

    if (!this.apiKeys || this.apiKeys.length === 0) {
      return ''
    }

    const key = this.apiKeys[this.currentKeyIndex]
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length
    return key
  }

  /**
   * 获取所有API密钥
   */
  getAllApiKeys(): string[] {
    this.initializeApiKeys()
    return this.apiKeys ? [...this.apiKeys] : []
  }

  /**
   * 获取API密钥数量
   */
  getApiKeyCount(): number {
    this.initializeApiKeys()
    return this.apiKeys ? this.apiKeys.length : 0
  }

  /**
   * 获取所有API密钥的积分余额
   * API文档: GET https://api.scrapecreators.com/v1/credit-balance
   */
  async getCreditBalance(): Promise<Array<{ apiKey: string; creditCount: number; error?: string }>> {
    this.initializeApiKeys()

    const results: Array<{ apiKey: string; creditCount: number; error?: string }> = []

    if (!this.apiKeys || this.apiKeys.length === 0) {
      return results
    }

    for (const apiKey of this.apiKeys) {
      try {
        const response = await fetch(`${this.baseUrl}/v1/credit-balance`, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          results.push({
            apiKey: this.maskApiKey(apiKey),
            creditCount: 0,
            error: `API error: ${response.status} ${response.statusText} - ${errorText}`
          })
          continue
        }

        const data = await response.json() as { creditCount: number }

        results.push({
          apiKey: this.maskApiKey(apiKey),
          creditCount: data.creditCount
        })
      } catch (error) {
        console.error(`Error fetching credit balance for API key:`, error)
        results.push({
          apiKey: this.maskApiKey(apiKey),
          creditCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * 掩码API密钥(只显示前4位和后4位)
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '****'
    }
    return `${apiKey.substring(0, 4)}****${apiKey.substring(apiKey.length - 4)}`
  }
}

// 导出单例
export const apiKeyService = new ApiKeyService()
