import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

// 定義認證上下文的類型結構
interface AuthContextType {
  // 狀態
  user: User | null; // 當前登入的使用者物件，若未登入則為 null
  isAuthenticated: boolean; // 布林值，表示使用者是否已通過認證
  loading: boolean; // 布林值，表示是否正在進行認證相關的異步操作
  error: string | null; // 認證過程中發生的錯誤訊息，若無錯誤則為 null
  
  // 方法
  login: (credentials: LoginRequest) => Promise<boolean>; // 登入函數，接收登入憑證，返回一個表示成功的布林值的 Promise
  register: (userData: RegisterRequest) => Promise<boolean>; // 註冊函數，接收註冊資料，返回一個表示成功的布林值的 Promise
  logout: () => Promise<void>; // 登出函數
  clearError: () => void; // 清除錯誤訊息的函數
  refreshUser: () => Promise<void>; // 刷新使用者資訊的函數
}

// 創建 AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 定義 AuthProvider 的 props 類型
interface AuthProviderProps {
  children: ReactNode; // 子組件
}

// AuthProvider 組件，用於包裹應用程式並提供認證相關的狀態和方法
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // --- 狀態管理 ---
  const [user, setUser] = useState<User | null>(null); // 使用者狀態
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 認證狀態
  const [loading, setLoading] = useState(true); // 加載狀態，初始為 true 以處理初始化檢查
  const [error, setError] = useState<string | null>(null); // 錯誤狀態

  /**
   * 初始化認證狀態。
   * 此 useEffect 在組件首次掛載時運行，檢查本地儲存中是否有有效的 token，
   * 並嘗試從後端獲取使用者資訊以恢復登入狀態。
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 如果 URL 包含來自 OAuth2 重新導向的 hash，解析並保存 token。
        try { AuthService.bootstrapFromHash(); } catch {}
        // 檢查是否存在 token
        const hasToken = AuthService.isAuthenticated();
        if (hasToken) {
          let authed = false;
          try {
            // 優先嘗試從後端 /auth/me 端點獲取最新的使用者資訊
            const me = await AuthService.getMe();
            setUser(me);
            setIsAuthenticated(true);
            AuthService.setCurrentUser(me); // 更新 localStorage 中的使用者資料
            authed = true;
          } catch {
            // 如果獲取失敗（例如 token 過期但 refresh token 仍有效，或網路問題），
            // 則退回使用 localStorage 中儲存的使用者資料作為後備。
          }
          if (!authed) {
            const storedUser = AuthService.getCurrentUser();
            if (storedUser) {
              setUser(storedUser);
              setIsAuthenticated(true);
            } else {
              // fallback: 只要有 token 也算登入
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // 如果初始化過程中發生任何無法處理的錯誤，則執行登出以清理狀態
        await logout();
      } finally {
        // 無論成功或失敗，都結束加載狀態
        setLoading(false);
      }
    };
    initializeAuth();
  }, []); // 空依賴陣列確保此 effect 只運行一次

  /**
   * 處理使用者登入。
   * @param credentials - 包含使用者名稱和密碼的登入憑證。
   * @returns Promise<boolean> - 返回一個布林值，表示登入是否成功。
   */
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await AuthService.login(
        credentials.username, 
        credentials.password
      );
      
      setUser(response.user);
      setIsAuthenticated(true);
      AuthService.setCurrentUser(response.user);
      return true; // 登入成功
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      const rawMessage = error instanceof Error ? error.message : '登入失敗';
      // 將後端可能返回的各種認證相關錯誤訊息，統一為對使用者更友善的提示
      const normalized = /用戶|密碼|認證|憑證|Invalid|credential/i.test(rawMessage)
        ? '用戶名或密碼錯誤'
        : rawMessage;
      setError(normalized);
      return false; // 登入失敗
    } finally {
      setLoading(false);
    }
  };

  /**
   * 處理使用者註冊。
   * @param userData - 包含註冊所需資訊的物件。
   * @returns Promise<boolean> - 返回一個布林值，表示註冊是否成功。
   */
  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await AuthService.register(userData);
      
      setUser(response.user);
      setIsAuthenticated(true);
      AuthService.setCurrentUser(response.user);
      return true; // 註冊成功
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      const errorMessage = error instanceof Error ? error.message : '註冊失敗';
      setError(errorMessage);
      return false; // 註冊失敗
    } finally {
      setLoading(false);
    }
  };

  /**
   * 處理使用者登出。
   * 調用 AuthService 的登出方法，並清理本地狀態。
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 無論後端登出是否成功，都必須清理前端的狀態
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  /**
   * 刷新使用者資訊。
   * 當使用者資訊可能已在後端更新時調用（例如，在帳戶頁面更新資料後）。
   */
  const refreshUser = async (): Promise<void> => {
    try {
      // 理想情況下，這裡應該調用一個 API 端點（如 /auth/me）來獲取最新的使用者資料。
      // 目前的實現是從 localStorage 重新加載，作為一個簡單的刷新機制。
      const storedUser = AuthService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      await logout(); // 如果刷新失敗，則登出使用者
    }
  };

  /**
   * 清除錯誤訊息。
   * 當使用者開始新的輸入或操作時，可以調用此函數來清除舊的錯誤提示。
   */
  const clearError = (): void => {
    setError(null);
  };

  // 將所有狀態和方法打包到一個 value 物件中
  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  // 使用 Context.Provider 將 value 提供給所有子組件
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 自定義 Hook `useAuth`，用於在組件中方便地訪問認證上下文。
 * @returns AuthContextType - 包含認證狀態和方法的物件。
 * @throws Error - 如果在 AuthProvider 外部使用此 Hook，則拋出錯誤。
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
