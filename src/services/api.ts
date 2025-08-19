import axios, { AxiosError, AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { i18n } from '../../i18n';

// 自定義錯誤
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

export class ApiService {
  // 根據環境動態獲取 baseURL
  private static getBaseURL(): string {
    // 在開發環境中，返回空字串。這會讓 axios 的請求（例如 /api/posts）
    // 發送到當前主機（例如 http://localhost:5173/api/posts），
    // 這樣 Vite 的代理伺服器才能攔截並轉發請求。
    if (import.meta.env.DEV) {
      return '';
    }
    // 在生產環境中，明確使用後端的絕對 URL。
    // 這確保了從 Vercel 部署的前端發出的 API 請求
    // 會直接發送到 Railway 部署的後端。
    return 'https://solo-springboot-backend-production.up.railway.app';
  }

  private static baseURL = ApiService.getBaseURL();

  private static axiosInstance = axios.create({
    baseURL: ApiService.baseURL,
    withCredentials: false, // 與後端 CORS allowCredentials=false 對齊
    timeout: 15000,
  });

  // request 攔截器：加上 token 與語系
  static {
    this.axiosInstance.interceptors.request.use((config) => {
      const token = ApiService.getToken();
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['Accept-Language'] = i18n?.language || 'en';
      return config;
    });
  }

  private static getToken(): string | null {
    return localStorage.getItem('authToken');
  }
  private static setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }
  private static removeToken(): void {
    localStorage.removeItem('authToken');
  }

  static async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>(config);
      return response.data as T;
    } catch (error) {
      console.error('API Request Error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        const status = axiosError.response?.status || 500;
        const errorData = axiosError.response?.data;
        const rawMessage =
          (errorData && (errorData.message || errorData.error || errorData.details)) || axiosError.message;
        const message = ApiService.translateServerMessage(rawMessage);
        if (status === 401) this.removeToken();
        throw new ApiError(message, status, errorData);
      }
      throw error;
    }
  }

  // 上傳（發到同域或外部完整 URL 都可）
  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    try {
      const response = await this.axiosInstance.post<T>(url, formData);
      return response.data;
    } catch (error) {
      console.error('Upload Error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        const errorData = axiosError.response?.data;
        const message = (errorData && errorData.message) || `Upload Error: ${axiosError.response?.status}`;
        throw new Error(message);
      }
      throw error;
    }
  }

  // 上傳（含進度）
  static async uploadFileWithProgress<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };
    return (await axios.post<T>(url, formData, config)).data;
  }

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

  // Blog Post APIs（改為 /api/...）
  static async getPosts() { return this.request<any[]>({ url: '/api/posts', method: 'GET' }); }
  static async getPost(id: string) { return this.request<any>({ url: `/api/posts/${id}`, method: 'GET' }); }
  static async createPost(postData: any) { return this.request<any>({ url: '/api/posts', method: 'POST', data: postData }); }
  static async updatePost(id: string, postData: any) { return this.request<any>({ url: `/api/posts/${id}`, method: 'PUT', data: postData }); }
  static async deletePost(id: string) { return this.request<void>({ url: `/api/posts/${id}`, method: 'DELETE' }); }

  // Portfolio APIs（改為 /api/...）
  static async getPortfolio() { return this.request<any[]>({ url: '/api/portfolio', method: 'GET' }); }
  static async getPortfolioItem(id: string) { return this.request<any>({ url: `/api/portfolio/${id}`, method: 'GET' }); }
  static async createPortfolioItem(itemData: any) { return this.request<any>({ url: '/api/portfolio', method: 'POST', data: itemData }); }
  static async updatePortfolioItem(id: string, itemData: any) { return this.request<any>({ url: `/api/portfolio/${id}`, method: 'PUT', data: itemData }); }
  static async deletePortfolioItem(id: string) { return this.request<void>({ url: `/api/portfolio/${id}`, method: 'DELETE' }); }

  // Comment APIs（維持原有前綴，若後端是 /api/comments 也請同步改）
  static async getCommentsByPost(postId: string) { return this.request<any[]>({ url: `/api/comments/post/${postId}`, method: 'GET' }); }
  static async addComment(payload: { postId: string; text: string; parentId?: string | null }) { return this.request<any>({ url: '/api/comments', method: 'POST', data: payload }); }
  static async deleteComment(id: string) { return this.request<void>({ url: `/api/comments/${id}`, method: 'DELETE' }); }
}