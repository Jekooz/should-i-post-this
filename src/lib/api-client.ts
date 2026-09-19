import { NextResponse } from 'next/server';
import { z } from 'zod';

import { APP_NAME } from './constants';

// API Client Configuration
const API_CONFIG = {
  // For browser requests, use relative URLs or current origin
  // For server-side, use the provided base URL or environment variable
  baseURL: typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || ''),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Name': APP_NAME,
  },
};

// Custom Error Classes
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public retryable: boolean = true) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: any[],
    message: string = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Request/Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Validation Schemas
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// API Client Class
class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.defaultHeaders = API_CONFIG.headers;
    this.timeout = API_CONFIG.timeout;
  }

  // Core Request Method
  async request<T>(
    method: string,
    path: string,
    options: {
      body?: any;
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { body, params, headers: customHeaders = {}, timeout = this.timeout } = options;

    try {
      // In browser, use relative URLs which resolve against the current origin
      // In server-side, use the configured base URL
      let url: URL;
      if (typeof window !== 'undefined') {
        // Browser: use relative URL (path starts with /)
        url = new URL(path, window.location.origin);
      } else {
        // Server-side: use configured base URL
        url = new URL(path, this.baseURL || 'http://localhost:3000');
      }

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
      }

      const response = await fetch(url.toString(), {
        method: method.toUpperCase(),
        headers: {
          ...this.defaultHeaders,
          ...customHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeout),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(
          response.status,
          data.error || 'API_ERROR',
          data.message || 'An error occurred',
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new NetworkError('Network error: unable to connect to server');
      }

      throw error;
    }
  }

  // HTTP Methods
  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('GET', path, { params, headers });
  }

  async post<T>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('POST', path, { body, headers });
  }

  async put<T>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('PUT', path, { body, headers });
  }

  async patch<T>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('PATCH', path, { body, headers });
  }

  async delete<T>(
    path: string,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('DELETE', path, { headers });
  }

  // File Upload
  async upload<T>(
    path: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    // In browser, use relative URL
    let url: URL;
    if (typeof window !== 'undefined') {
      url = new URL(path, window.location.origin);
    } else {
      url = new URL(path, this.baseURL || 'http://localhost:3000');
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', url.toString());

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as T);
          } else {
            reject(
              new APIError(
                xhr.status,
                data.error || 'UPLOAD_ERROR',
                data.message || 'Upload failed',
                data
              )
            );
          }
        } catch (error) {
          reject(new APIError(xhr.status, 'PARSE_ERROR', 'Failed to parse response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new NetworkError('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new APIError(408, 'TIMEOUT', 'Upload timed out'));
      });

      xhr.timeout = this.timeout;
      xhr.send(formData);
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Utility Functions
export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        error: error.code,
        message: error.message,
        details: error.details,
      },
      { status: error.status }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
        errors: error.errors,
      },
      { status: 400 }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}
