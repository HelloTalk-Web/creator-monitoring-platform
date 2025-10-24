/**
 * OpenList Client API Contract
 *
 * 定义OpenListClient类的公共接口
 * 测试必须验证这些接口的行为符合预期
 */

export interface IOpenListClient {
  /**
   * 登录OpenList服务获取JWT令牌
   *
   * @throws {OpenListError} 当认证失败时
   * @returns {Promise<void>} 登录成功,令牌内部存储
   *
   * **Contract**:
   * - 成功: 内部存储有效JWT令牌
   * - 失败: 抛出OpenListError,code='AUTH_FAILED'
   * - 幂等性: 多次调用安全,使用最新令牌
   */
  login(): Promise<void>;

  /**
   * 上传文件到OpenList
   *
   * @param fileBuffer - 文件内容Buffer
   * @param remotePath - 目标路径,如: "/images/avatar/user123.jpg"
   * @throws {OpenListError} 当上传失败时
   * @returns {Promise<UploadResult>} 上传结果,包含OpenList URL
   *
   * **Contract**:
   * - 成功: 返回UploadResult { path, url }
   * - 失败: 抛出OpenListError,包含status和code
   * - 401错误: 自动重新登录并重试一次
   * - 网络错误: 重试1次,间隔1秒
   * - remotePath必须以"/"开头
   */
  upload(fileBuffer: Buffer, remotePath: string): Promise<UploadResult>;

  /**
   * 获取文件的OpenList代理URL
   *
   * @param remotePath - 文件路径
   * @throws {OpenListError} 当获取失败时
   * @returns {Promise<string>} OpenList代理URL
   *
   * **Contract**:
   * - 成功: 返回 OpenList raw_url (可直接 GET)
   * - 失败: 抛出OpenListError
   * - 401错误: 自动重新登录并重试一次
   */
  getProxyUrl(remotePath: string): Promise<string>;

  /**
   * 下载文件内容
   *
   * @param remotePath - 文件路径
   * @throws {OpenListError} 当下载失败时
   * @returns {Promise<Buffer>} 文件内容
   *
   * **Contract**:
   * - 成功: 返回文件Buffer
   * - 失败: 抛出OpenListError
   * - 401错误: 自动重新登录并重试一次
   * - 网络错误: 重试1次,间隔1秒
   */
  download(remotePath: string): Promise<Buffer>;
}

/**
 * 上传结果类型
 */
export interface UploadResult {
  path: string;   // 上传的目标路径
  url: string;    // OpenList代理URL
  size?: number;  // 文件大小(可选)
}

/**
 * OpenList错误类型
 */
export interface OpenListError extends Error {
  code?: string;     // 错误码: AUTH_FAILED, NETWORK_ERROR, FILE_TOO_LARGE, etc.
  status?: number;   // HTTP状态码: 401, 413, 500, etc.
  details?: any;     // 额外错误信息
}

/**
 * OpenList配置类型
 */
export interface OpenListConfig {
  baseURL: string;    // OpenList服务地址
  username: string;   // 登录用户名
  password: string;   // 登录密码
}
