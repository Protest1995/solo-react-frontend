// src/services/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { i18n } from '../../i18n';

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// 寬鬆讀取 Vite 環境變數，避免 TS 型別報錯
const ENV = (import.meta as any).env ?? {};

type ApiResponse<T = any> = T;

export class ApiService {
  // 讀取環境變數
  private static readonly API_BASE_FROM_ENV: string | undefined =
    (ENV.VITE_API_BASE_URL as string | undefined)?.trim();
  private static readonly BACKEND_BASE_FROM_ENV: string | undefined =
    (ENV.VITE_BACKEND_BASE_URL as string | undefined)?.trim();

  private static isDev(): boolean {
    return !!ENV.DEV;
  }
  private static stripTrailingSlash(u: string): string {
    return u.replace(/\/+$/, '');
  }

  // 供 axios REST 請求使用（可走 /api 代理）
  static getApiBaseUrl(): string {
    if (this.isDev()) {
      // In dev: if VITE_API_BASE_URL is set and non-empty, use it;
      // otherwise return empty string so request URLs like '/api/posts'
      // are sent to the dev server root and handled by Vite proxy (no double /api).
      const devBase = this.API_BASE_FROM_ENV && this.API_BASE_FROM_ENV.length > 0 ? this.API_BASE_FROM_ENV : '';
      return this.stripTrailingSlash(devBase);
    }
    const fromEnv =
      this.API_BASE_FROM_ENV ||
      (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');
    return this.stripTrailingSlash(fromEnv);
  }

  // 供 OAuth 整頁跳轉使用（不可含 /api）
  static getAuthBaseUrl(): string {
    if (this.isDev()) {
      // In dev: prefer using the front-end origin when the site is accessed
      // via a LAN IP or hostname (mobile testing). For desktop developers
      // accessing via `localhost` or `127.0.0.1` keep the backend base so
      // existing OAuth client settings remain valid.
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          const devBackend = this.BACKEND_BASE_FROM_ENV || 'http://localhost:8080';
          return this.stripTrailingSlash(devBackend);
        }
        // For LAN IPs / remote devices, use the frontend origin so redirects
        // go through the dev server and the Host header is preserved by the
        // proxy (/oauth2 configured with changeOrigin: false).
        return this.stripTrailingSlash(window.location.origin);
      }
      const devBackend = this.BACKEND_BASE_FROM_ENV || 'http://localhost:8080';
      return this.stripTrailingSlash(devBackend);
    }
    const fromEnv =
  // Prefer explicit env var; otherwise fall back to the canonical
  // production API host so clients don't attempt to use an undefined origin.
  // This ensures production social/OAuth redirects use the correct backend
  // when VITE_BACKEND_BASE_URL was not configured in the environment.
  this.BACKEND_BASE_FROM_ENV || 'https://api.soloproject.site';
    return this.stripTrailingSlash(fromEnv);
  }

  // 舊名同義方法，避免既有呼叫壞掉
  static getBaseURL(): string {
    return this.getApiBaseUrl();
  }

  // 內部 baseURL 與 axios 實例
  private static baseURL = ApiService.getApiBaseUrl();

  private static axiosInstance = axios.create({
    baseURL: ApiService.baseURL,
    withCredentials: false, // 與後端 CORS allowCredentials=false 對齊
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // request/response 攔截器
  static {
    this.axiosInstance.interceptors.request.use((config) => {
      const token = ApiService.getToken();
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      (config.headers as any)['Accept-Language'] = i18n?.language || 'en';
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        const status = error?.response?.status;
        const original: any = error?.config;
        // 可選：401 時移除 token 或在此加入刷新邏輯
        if (status === 401 && !original?._retry) {
          ApiService.removeToken();
        }
        return Promise.reject(error);
      }
    );
  }

  private static getToken(): string | null {
    try {
      return localStorage.getItem('authToken');
    } catch {
      return null;
    }
  }
  private static setToken(token: string): void {
    try {
      localStorage.setItem('authToken', token);
    } catch {}
  }
  private static removeToken(): void {
    try {
      localStorage.removeItem('authToken');
    } catch {}
  }

  // 通用請求
  static async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // 自動設定 JSON header
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.headers = {
          ...(config.headers || {}),
          'Content-Type': 'application/json',
        };
      }
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.request(config);
      return response.data as T;
    } catch (error) {
      console.error('API Request Error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status || 500;
        const errorData: any = axiosError.response?.data;
        const rawMessage =
          (errorData && (errorData.message || errorData.error || errorData.details)) ||
          axiosError.message;
        const message = ApiService.translateServerMessage(String(rawMessage));
        if (status === 401) this.removeToken();
        throw new ApiError(message, status, errorData);
      }
      throw error;
    }
  }

  // 上傳（發到同域或外部完整 URL 都可）
  static async uploadFile(endpoint: string, formData: FormData): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    try {
      const response = await this.axiosInstance.post(url, formData);
      return response.data;
    } catch (error) {
      console.error('Upload Error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorData: any = axiosError.response?.data;
        const message =
          (errorData && errorData.message) || `Upload Error: ${axiosError.response?.status}`;
        throw new Error(message);
      }
      throw error;
    }
  }

  // 翻譯後端錯誤訊息
  private static translateServerMessage(message: string): string {
    const lang = i18n?.language || 'en';
    const isZh = lang.startsWith('zh');
    const maps: Array<{ zh: RegExp; en: string; zhOut?: string }> = [
      { zh: /用戶名或密碼錯誤|認證失敗/, en: 'Invalid username or password.', zhOut: '用戶名或密碼錯誤' },
      { zh: /登入失敗[:：]?\s*憑證錯誤|憑證錯誤/, en: 'Invalid username or password.', zhOut: '用戶名或密碼錯誤' },
      { zh: /使用者名稱不存在|用戶名不存在/, en: 'Username does not exist.', zhOut: '使用者名稱不存在' },
      { zh: /用戶名長度必須在3-50個字符之間/, en: 'Username must be between 3 and 50 characters.', zhOut: '用戶名長度必須在3-50個字元之間' },
      { zh: /密碼長度至少6個字符/, en: 'Password must be at least 6 characters.', zhOut: '密碼長度至少 6 個字元' },
      { zh: /郵箱格式不正確|郵箱格式不正确/, en: 'Invalid email format.', zhOut: '電子郵件格式不正確' },
      { zh: /用戶名.*已存在|使用者名稱.*已存在|帳號.*已存在/, en: 'Username already exists.', zhOut: '使用者名稱已存在' },
      { zh: /郵箱.*已被使用|郵箱已存在|電子郵件.*已被使用|電子郵件.*已存在/, en: 'Email already exists.', zhOut: '電子郵件已被使用' },
      { zh: /密碼確認不匹配/, en: 'Passwords do not match.', zhOut: '兩次密碼輸入不一致' },
    ];
    for (const m of maps) {
      if (m.zh.test(message)) return isZh ? m.zhOut || message : m.en;
    }
    if (isZh) return message;
    if (/錯誤|失敗/.test(message)) return 'Request failed. Please try again.';
    return message;
  }

  // 你現有的 REST API 包裝（改成統一 /api 前綴）
  static async getPosts() { return this.request({ url: '/api/posts', method: 'GET' }); }
  static async getPost(id: string) { return this.request({ url: `/api/posts/${id}`, method: 'GET' }); }
  static async createPost(postData: any) { return this.request({ url: '/api/posts', method: 'POST', data: postData }); }
  static async updatePost(id: string, postData: any) { return this.request({ url: `/api/posts/${id}`, method: 'PUT', data: postData }); }
  static async deletePost(id: string) { return this.request({ url: `/api/posts/${id}`, method: 'DELETE' }); }

  static async getPortfolio() { return this.request({ url: '/api/portfolio', method: 'GET' }); }
  static async getPortfolioItem(id: string) { return this.request({ url: `/api/portfolio/${id}`, method: 'GET' }); }
  static async createPortfolioItem(itemData: any) { return this.request({ url: '/api/portfolio', method: 'POST', data: itemData }); }
  static async updatePortfolioItem(id: string, itemData: any) { return this.request({ url: `/api/portfolio/${id}`, method: 'PUT', data: itemData }); }
  static async deletePortfolioItem(id: string) { return this.request({ url: `/api/portfolio/${id}`, method: 'DELETE' }); }

  static async getCommentsByPost(postId: string) {
    return this.request({ url: `/api/comments/post/${postId}`, method: 'GET' });
  }
  static async addComment(payload: { postId: string; text: string; parentId?: string | null }) {
    return this.request({ url: '/api/comments', method: 'POST', data: payload });
  }
  static async deleteComment(id: string) {
    return this.request({ url: `/api/comments/${id}`, method: 'DELETE' });
  }
}

export default ApiService;
