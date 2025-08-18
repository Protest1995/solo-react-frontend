// 定義後端 API 在認證成功後返回的標準響應結構
export interface AuthResponse {
  success: boolean;       // 操作是否成功
  message: string;        // 附帶的消息
  token: string;          // 訪問令牌 (Access Token)
  refreshToken: string;   // 刷新令牌 (Refresh Token)
  user: User;             // 關聯的用戶物件
}

// 定義使用者物件的詳細結構
export interface User {
  id: string;               // 唯一的使用者 ID
  username: string;         // 用戶名
  email: string;            // 電子郵件地址
  avatarUrl: string;        // 頭像圖片的 URL
  role: UserRole;           // 使用者角色
  gender?: 'male' | 'female' | 'other' | 'not_specified'; // 性別 (可選)
  birthday?: string;        // 生日 (可選)
  address?: string;         // 地址 (可選)
  phone?: string;           // 電話號碼 (可選)
  createdAt: string;        // 帳戶創建時間 (ISO 格式字符串)
  updatedAt: string;        // 帳戶最後更新時間 (ISO 格式字符串)
}

// 定義更新使用者資料時的請求體結構，所有欄位都是可選的
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other' | 'not_specified';
  birthday?: string;
  address?: string;
  phone?: string;
  password?: string; // 更新密碼時使用 (可選)
}

// 定義使用者角色的枚舉
export enum UserRole {
  USER = 'USER',           // 普通使用者
  ADMIN = 'ADMIN',         // 管理員
  SUPER_USER = 'SUPER_USER'// 超級管理員
}

// 定義登入請求的結構
export interface LoginRequest {
  username: string;
  password: string;
}

// 定義註冊請求的結構
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string; // 確認密碼，用於後端驗證
}

// 定義 API 錯誤響應的標準結構 (雖然在 ApiService 中有更通用的處理，但定義此類型有助於理解)
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>; // 可選的欄位特定錯誤
}
