/**
 * OpenList Client - AList API客户端
 */

import { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import {
  OpenListConfig,
  UploadResult,
  OpenListError,
  OpenListApiResponse,
  LoginResponseData,
  FileInfoResponseData,
} from './types';
import openlistConfig from '../../config/openlist.config';
import { createChildLogger } from '../../shared/utils/logger';
import axios from 'axios';

const logger = createChildLogger('OpenListClient');

export class OpenListClient {
  private http: AxiosInstance;
  private token: string | null = null;
  private config: OpenListConfig;

  constructor(config?: OpenListConfig, httpInstance?: AxiosInstance) {
    this.config = config || {
      baseURL: openlistConfig.baseURL,
      username: openlistConfig.username,
      password: openlistConfig.password,
      storagePath: openlistConfig.storagePath,
    };

    // 使用提供的 http 实例(用于测试)或创建新的
    this.http = httpInstance || axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 配置响应拦截器 - 401 自动重登录 (仅在非测试模式下)
    if (!httpInstance && this.http.interceptors) {
      this.http.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          const originalRequest = error.config as any;

          // 401 错误且未重试过
          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              // 重新登录
              await this.login();

              // 更新请求头
              if (originalRequest.headers && this.token) {
                originalRequest.headers['Authorization'] = this.token;
              }

              // 重试原请求
              return this.http.request(originalRequest);
            } catch (loginError) {
              return Promise.reject(loginError);
            }
          }

          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * 登录获取 JWT 令牌
   */
  async login(): Promise<void> {
    try {
      logger.info('Logging in to OpenList', { baseURL: this.config.baseURL });

      const response = await this.http.request<OpenListApiResponse<LoginResponseData>>({
        method: 'POST',
        url: '/api/auth/login',
        data: {
          username: this.config.username,
          password: this.config.password,
        },
      });

      if (response.data.code === 200 && response.data.data?.token) {
        this.token = response.data.data.token;
        // 设置默认认证头 (如果可用)
        if (this.http.defaults?.headers?.common) {
          this.http.defaults.headers.common['Authorization'] = this.token;
        }
        logger.info('Successfully logged in to OpenList');
      } else {
        logger.error('Login failed: Invalid response', { status: response.status });
        throw new OpenListError(
          'Login failed: Invalid response',
          'AUTH_FAILED',
          response.status
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Login failed', {
          message: error.message,
          status: error.response?.status
        });
        throw new OpenListError(
          `Login failed: ${error.message}`,
          'AUTH_FAILED',
          error.response?.status,
          error.response?.data
        );
      }
      throw error;
    }
  }

  /**
   * 上传文件到 OpenList
   */
  async upload(fileBuffer: Buffer, remotePath: string): Promise<UploadResult> {
    // 确保已登录
    if (!this.token) {
      await this.login();
    }

    // 构建完整存储路径
    const fullPath = this.buildFullPath(remotePath);

    let lastError: Error | null = null;

    // 重试逻辑: 最多尝试 2 次 (首次 + 重试 1 次)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        logger.info('Uploading file to OpenList', {
          fullPath,
          remotePath,
          storagePath: this.config.storagePath,
          fileSize: fileBuffer.length,
          attempt: attempt + 1
        });

        const response = await this.http.request<OpenListApiResponse>({
          method: 'PUT',
          url: `/api/fs/put`,
          data: fileBuffer,
          headers: {
            'Authorization': this.token!,
            'File-Path': fullPath, // 使用 File-Path header (大小写敏感!)
            'Content-Type': 'application/octet-stream',
          },
        });

        if (response.data.code === 200) {
          logger.info('Successfully uploaded file', {
            path: fullPath,
            size: fileBuffer.length
          });

          // 获取代理 URL
          const proxyUrl = await this.getProxyUrl(remotePath);

          return {
            path: remotePath,
            url: proxyUrl,
            size: fileBuffer.length,
          };
        } else {
          logger.error('Upload failed', {
            message: response.data.message,
            path: remotePath
          });
          throw new OpenListError(
            `Upload failed: ${response.data.message}`,
            'UPLOAD_FAILED',
            response.status,
            response.data
          );
        }
      } catch (error) {
        lastError = error as Error;

        // 如果是网络错误且还有重试机会,等待 1 秒后重试
        if (axios.isAxiosError(error) && error.code === 'ECONNRESET' && attempt < 1) {
          logger.warn('Upload network error, retrying...', {
            path: remotePath,
            attempt: attempt + 1
          });
          await this.sleep(1000);
          continue;
        }

        // 其他错误直接抛出
        break;
      }
    }

    // 所有重试都失败
    logger.error('Upload failed after retries', { path: remotePath });
    if (axios.isAxiosError(lastError)) {
      throw new OpenListError(
        `Upload failed after retries: ${lastError.message}`,
        'NETWORK_ERROR',
        lastError.response?.status,
        lastError.response?.data
      );
    }

    throw lastError!;
  }

  /**
   * 获取文件的代理 URL
   */
  async getProxyUrl(remotePath: string): Promise<string> {
    // 确保已登录
    if (!this.token) {
      await this.login();
    }

    // 构建完整存储路径
    const fullPath = this.buildFullPath(remotePath);

    try {
      const response = await this.http.request<OpenListApiResponse<FileInfoResponseData>>({
        method: 'POST',
        url: '/api/fs/get',
        data: {
          path: fullPath,
          password: '',
        },
        headers: {
          'Authorization': this.token!,
        },
      });

      if (response.data.code === 200 && response.data.data?.raw_url) {
        logger.info('Successfully got proxy URL', { path: remotePath });
        return response.data.data.raw_url;
      } else {
        logger.error('Get proxy URL failed', {
          message: response.data.message,
          path: remotePath
        });
        throw new OpenListError(
          `Get proxy URL failed: ${response.data.message}`,
          'GET_URL_FAILED',
          response.status,
          response.data
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Get proxy URL failed', {
          message: error.message,
          path: remotePath
        });
        throw new OpenListError(
          `Get proxy URL failed: ${error.message}`,
          'NETWORK_ERROR',
          error.response?.status,
          error.response?.data
        );
      }
      throw error;
    }
  }

  /**
   * 下载文件内容
   */
  async download(remotePath: string): Promise<Buffer> {
    // 先获取文件的 raw_url
    const rawUrl = await this.getProxyUrl(remotePath);

    let lastError: Error | null = null;

    // 重试逻辑: 最多尝试 2 次 (首次 + 重试 1 次)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await this.http.get(rawUrl, {
          responseType: 'arraybuffer',
        });

        logger.info('Successfully downloaded file', { path: remotePath });
        return Buffer.from(response.data);
      } catch (error) {
        lastError = error as Error;

        // 如果是网络错误且还有重试机会,等待 1 秒后重试
        if (axios.isAxiosError(error) && error.code === 'ECONNRESET' && attempt < 1) {
          logger.warn('Download network error, retrying...', {
            path: remotePath,
            attempt: attempt + 1
          });
          await this.sleep(1000);
          continue;
        }

        // 其他错误直接抛出
        break;
      }
    }

    // 所有重试都失败
    logger.error('Download failed after retries', { path: remotePath });
    if (axios.isAxiosError(lastError)) {
      throw new OpenListError(
        `Download failed after retries: ${lastError.message}`,
        'NETWORK_ERROR',
        lastError.response?.status,
        lastError.response?.data
      );
    }

    throw lastError!;
  }

  /**
   * 工具方法: 延迟执行
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 工具方法: 构建完整存储路径
   */
  private buildFullPath(remotePath: string): string {
    const storagePath = this.config.storagePath || '';
    if (!remotePath.startsWith('/')) {
      remotePath = '/' + remotePath;
    }
    return storagePath ? `${storagePath}${remotePath}` : remotePath;
  }
}
