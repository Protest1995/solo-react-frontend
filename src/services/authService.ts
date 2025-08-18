import { ApiService } from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User, UpdateUserRequest } from '../types/auth';

/**
 * AuthService 類別。
 * 專門處理所有與身份驗證相關的 API 調用，使用 ApiService 來發送請求。
 * 這將認證邏輯與通用的 API 請求邏輯分離。
 */
export class AuthService {
  /**
   * 處理用戶登入。
   * @param username - 用戶名。
   * @param password - 密碼。
   * @returns Promise<AuthResponse> - 包含 token 和用戶信息的登入響應。
   */
  static async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await ApiService.request<AuthResponse>({
        url: '/auth/login',
        method: 'POST',
        data: { username, password },
      });
      
      // 登入成功後，將 token 和 refreshToken 保存到 localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('authProvider', 'local'); // 標記為本地密碼登入
      }
      
      return response;
    } catch (error) {
      console.error('Login Error:', error);
      throw error; // 向上拋出錯誤，由 AuthContext 處理
    }
  }

  /**
   * 觸發後端的 Google OAuth2 認證流程。
   * 這是一個客戶端重定向到後端端點的方法。
   */
  static loginWithGoogle(): void {
    const base = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '/api';
    try { localStorage.setItem('authProvider', 'google'); } catch {}
    // 將瀏覽器重定向到後端的 Google 認證 URL
    window.location.href = `${base}/auth/oauth2/authorize/google`;
  }

  /**
   * 從 URL 的 hash 中解析並保存 OAuth2 回調返回的 token。
   * @returns boolean - 如果成功解析並保存了 token，則返回 true。
   */
  static bootstrapFromHash(): boolean {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return false;
    
    // 解析 hash 中的查詢參數
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    
    if (token) localStorage.setItem('authToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    
    if (token) {
      // 清除 URL 中的 hash，避免殘留和重複處理
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    }
    return false;
  }

  /**
   * 從後端獲取當前已登入用戶的個人資料。
   * @returns Promise<User> - 當前用戶的資料。
   */
  static async getMe(): Promise<User> {
    const resp = await ApiService.request<{ success: boolean; message?: string; user: User }>(
      { url: '/auth/me', method: 'GET' }
    );
    return resp.user;
  }

  /**
   * 更新當前已登入用戶的個人資料。
   * @param payload - 包含要更新的用戶數據的請求體。
   * @returns Promise<User> - 更新後的用戶資料。
   */
  static async updateMe(payload: UpdateUserRequest): Promise<User> {
    const resp = await ApiService.request<{ success: boolean; user: User }>(
      {
        url: '/auth/me',
        method: 'PUT',
        data: payload,
      }
    );
    // 更新成功後，同時更新 localStorage 中的用戶資料
    if (resp?.user) this.setCurrentUser(resp.user);
    return resp.user;
  }

  /**
   * 處理新用戶註冊。
   * @param userData - 包含註冊所需資訊的物件。
   * @returns Promise<AuthResponse> - 包含 token 和用戶信息的註冊響應。
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await ApiService.request<AuthResponse>({
        url: '/auth/register',
        method: 'POST',
        data: userData,
      });
      
      // 註冊成功後，通常後端會自動登入，所以保存 token
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('authProvider', 'local');
      }
      
      return response;
    } catch (error) {
      console.error('Register Error:', error);
      throw error; // 向上拋出錯誤
    }
  }

  /**
   * 使用 refreshToken 刷新過期的 accessToken。
   * @returns Promise<AuthResponse> - 包含新 token 的響應。
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('沒有刷新令牌');
      }
      
      const response = await ApiService.request<AuthResponse>({
        url: '/auth/refresh',
        method: 'POST',
        data: { refreshToken },
      });
      
      // 更新本地存儲的 token
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('Refresh Token Error:', error);
      // 如果刷新失敗，通常意味著用戶需要重新登入，所以執行登出
      this.logout();
      throw error;
    }
  }

  /**
   * 處理用戶登出。
   * 清除本地存儲的所有認證相關信息。
   */
  static async logout(): Promise<void> {
    try {
      // 理想情況下，應該通知後端使 token 失效
      const refreshToken = localStorage.getItem('refreshToken') || '';
      await ApiService.request({
        url: '/auth/logout',
        method: 'POST',
        headers: { 'Refresh-Token': refreshToken },
      });
    } catch (error) {
      console.error('Logout Error:', error);
    } finally {
      // 無論後端是否成功，都必須清除客戶端的 token 和用戶資料
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('authProvider');
    }
  }

  /**
   * 檢查用戶是否已通過認證（通過檢查是否存在 authToken）。
   * @returns boolean - 如果存在 token，則返回 true。
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  /**
   * 從 localStorage 獲取當前用戶的個人資料。
   * @returns User | null - 如果存在，返回用戶物件，否則返回 null。
   */
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('userProfile');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * 將當前用戶的個人資料保存到 localStorage。
   * @param user - 要保存的用戶物件。
   */
  static setCurrentUser(user: User): void {
    localStorage.setItem('userProfile', JSON.stringify(user));
  }
}
