// src/services/authService.ts
import { ApiService } from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User, UpdateUserRequest } from '../types/auth';

export class AuthService {
  static async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await ApiService.request<AuthResponse>({
        url: '/auth/login',
        method: 'POST',
        data: { username, password },
      });
      if ((response as any).token) {
        localStorage.setItem('authToken', (response as any).token);
        localStorage.setItem('refreshToken', (response as any).refreshToken);
        localStorage.setItem('authProvider', 'local');
      }
      return response;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  // 整頁跳轉：使用真實後端根網址
  static loginWithGoogle(): void {
    const base = ApiService.getAuthBaseUrl();
  try { localStorage.setItem('authProvider', 'google'); } catch {}
  window.location.href = `${base}/oauth2/authorization/google`;
  }

  static loginWithFacebook(): void {
    const base = ApiService.getAuthBaseUrl();
  try { localStorage.setItem('authProvider', 'facebook'); } catch {}
  window.location.href = `${base}/oauth2/authorization/facebook`;
  }

  static loginWithGithub(): void {
    const base = ApiService.getAuthBaseUrl();
    try { localStorage.setItem('authProvider', 'github'); } catch {}
    window.location.href = `${base}/oauth2/authorization/github`;
  }

  static bootstrapFromHash(): boolean {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return false;
    const params = new URLSearchParams(hash.slice(1));
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');
      if (token) localStorage.setItem('authToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken || '');
      if (token) {
        // 若有 token，清除 hash 並自動跳轉首頁
        window.location.hash = '';
        window.location.replace('/');
        return true;
      }
    return false;
  }

  static async getMe(): Promise<User> {
    const resp = await ApiService.request<{ success: boolean; message?: string; user: User }>(
      { url: '/auth/me', method: 'GET' }
    );
    return resp.user;
  }

  static async updateMe(payload: UpdateUserRequest): Promise<User> {
    const resp = await ApiService.request<{ success: boolean; user: User }>(
      { url: '/auth/me', method: 'PUT', data: payload }
    );
    if (resp?.user) this.setCurrentUser(resp.user);
    return resp.user;
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await ApiService.request<AuthResponse>({
        url: '/auth/register',
        method: 'POST',
        data: userData,
      });
      if ((response as any).token) {
        localStorage.setItem('authToken', (response as any).token);
        localStorage.setItem('refreshToken', (response as any).refreshToken);
        localStorage.setItem('authProvider', 'local');
      }
      return response;
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('沒有刷新令牌');
      const response = await ApiService.request<AuthResponse>({
        url: '/auth/refresh',
        method: 'POST',
        data: { refreshToken },
      });
      if ((response as any).token) {
        localStorage.setItem('authToken', (response as any).token);
        localStorage.setItem('refreshToken', (response as any).refreshToken);
      }
      return response;
    } catch (error) {
      console.error('Refresh Token Error:', error);
      this.logout();
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || '';
      await ApiService.request({
        url: '/auth/logout',
        method: 'POST',
        headers: { 'Refresh-Token': refreshToken },
      });
    } catch (error) {
      console.error('Logout Error:', error);
    } finally {
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('authProvider');
      } catch {}
    }
  }

  static isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('userProfile');
    return userStr ? JSON.parse(userStr) : null;
  }

  static setCurrentUser(user: User): void {
    localStorage.setItem('userProfile', JSON.stringify(user));
  }
}