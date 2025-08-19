// src/services/http.ts
import axios from 'axios';

/**
 * 自定義錯誤類別，用於在整個應用程式中提供一致的 API 錯誤處理。
 */
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// 建立一個單一、集中的 axios 實例
const http = axios.create({
  // 在開發環境中，baseURL 為空字串，請求會發送到同一個主機（例如 /api/posts），並由 Vite 代理處理。
  // 在生產環境中，它將使用您在 Vercel 中設定的 VITE_API_BASE_URL。
  baseURL: (import.meta as any).env.DEV ? '' : (import.meta as any).env.VITE_API_BASE_URL,
  // 根據您的要求，預設不發送 cookies/session。
  withCredentials: false, 
  timeout: 15000, // 設定合理的超時時間。
});

// 新增請求攔截器，自動為每個請求附加 JWT token。
http.interceptors.request.use(config => {
    // 從 localStorage 中檢索 token（或您儲存 token 的任何地方）。
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

/**
 * 通用的請求處理函數，用於標準化錯誤處理。
 * @param requestPromise - 一個 axios 請求的 Promise。
 * @returns - 成功時返回 response.data，失敗時拋出 ApiError。
 */
export const handleRequest = async (requestPromise: Promise<any>) => {
    try {
        const response = await requestPromise;
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const { status, data } = error.response;
            // 從後端響應中提取有意義的錯誤訊息。
            const message = data?.message || data?.error || error.message || 'An error occurred';
            throw new ApiError(message, status, data);
        }
        // 對於非 axios 錯誤，也進行包裝。
        if (error instanceof Error) {
            throw new ApiError(error.message, 500, null);
        }
        throw new ApiError('An unknown error occurred', 500, null);
    }
};

export default http;