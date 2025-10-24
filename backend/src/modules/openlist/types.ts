/**
 * OpenList 模块类型定义
 */

/**
 * OpenList配置类型
 */
export interface OpenListConfig {
  baseURL: string;      // OpenList服务地址
  username: string;     // 登录用户名
  password: string;     // 登录密码
  storagePath?: string; // 存储路径前缀(可选),如: "/百度网盘"
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
export class OpenListError extends Error {
  code?: string;     // 错误码: AUTH_FAILED, NETWORK_ERROR, FILE_TOO_LARGE, etc.
  status?: number;   // HTTP状态码: 401, 413, 500, etc.
  details?: any;     // 额外错误信息

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'OpenListError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * OpenList API响应类型
 */
export interface OpenListApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  token: string;
}

/**
 * 文件信息响应数据
 */
export interface FileInfoResponseData {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  created: string;
  sign: string;
  thumb: string;
  type: number;
  hashinfo: string;
  hash_info: string | null;
  raw_url: string;
  readme: string;
  header: string;
  provider: string;
  related: any[];
}
