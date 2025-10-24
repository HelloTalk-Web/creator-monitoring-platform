import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenListClient } from '../../src/modules/openlist/client';
import type { OpenListConfig } from '../../src/modules/openlist/types';

interface HttpMock {
  instance: AxiosInstance;
  post: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
}

const createHttpMock = (): HttpMock => {
  const post = vi.fn();
  const request = vi.fn();
  const get = vi.fn();

  return {
    post,
    request,
    get,
    instance: {
      post,
      request,
      get,
    } as unknown as AxiosInstance,
  };
};

const createClient = (httpMock: HttpMock) => {
  const config: OpenListConfig = {
    baseURL: 'http://localhost:5244',
    username: 'demo',
    password: 'secret',
  };

  // Mock login request
  httpMock.request.mockResolvedValue({
    data: {
      code: 200,
      message: 'success',
      data: {
        token: 'token-123',
      },
    },
  });

  return new OpenListClient(config, httpMock.instance);
};

describe('OpenListClient', () => {
  let httpMock: HttpMock;
  let client: OpenListClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    httpMock = createHttpMock();
    client = createClient(httpMock);
    // Login before each test to set the token
    await client.login();
    vi.clearAllMocks(); // Clear the login call from the mock history
  });

  it('should login successfully', async () => {
    await client.login();

    expect(httpMock.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/auth/login',
        data: {
          username: 'demo',
          password: 'secret',
        },
      })
    );
  });

  it('should upload file to OpenList', async () => {
    const uploadPath = '/images/avatar/user.jpg';

    httpMock.request
      .mockResolvedValueOnce({
        data: {
          code: 200,
          message: 'success',
          data: {},
        },
      })
      .mockResolvedValueOnce({
        data: {
          code: 200,
          message: 'success',
          data: {
            raw_url: 'http://localhost:5244/d/images/avatar/user.jpg',
          },
        },
      });

    const result = await client.upload(Buffer.from('file-data'), uploadPath);

    expect(result.path).toBe(uploadPath);
    expect(result.url).toBe('http://localhost:5244/d/images/avatar/user.jpg');
    expect(httpMock.request).toHaveBeenCalledTimes(2);

    const [uploadRequestConfig] = httpMock.request.mock.calls[0];

    expect(uploadRequestConfig.headers.Authorization).toBe('token-123');
    expect(uploadRequestConfig.headers['File-Path']).toBe(uploadPath);
  });

  it('should get proxy url', async () => {
    httpMock.request.mockResolvedValueOnce({
      data: {
        code: 200,
        message: 'success',
        data: {
          raw_url: 'http://localhost:5244/d/images/avatar/user.jpg',
        },
      },
    });

    const url = await client.getProxyUrl('/images/avatar/user.jpg');

    expect(url).toBe('http://localhost:5244/d/images/avatar/user.jpg');
    expect(httpMock.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/fs/get',
      }),
    );
  });

  it('should download file from OpenList', async () => {
    const rawUrl = 'http://localhost:5244/d/images/avatar/user.jpg';
    const buffer = Buffer.from('image data');
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );

    httpMock.request.mockResolvedValueOnce({
      data: {
        code: 200,
        message: 'success',
        data: {
          raw_url: rawUrl,
        },
      },
    });

    httpMock.get.mockResolvedValue({
      data: arrayBuffer,
    });

    const result = await client.download('/images/avatar/user.jpg');

    expect(result.equals(buffer)).toBe(true);
    expect(httpMock.get).toHaveBeenCalledWith(rawUrl, {
      responseType: 'arraybuffer',
    });
  });
});
