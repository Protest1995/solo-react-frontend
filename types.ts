

import React from 'react';

// 定義應用程式中的所有頁面枚舉
export enum Page {
  Home = 'Home',
  About = 'About',
  Resume = 'Resume',
  Portfolio = 'Portfolio',
  Blog = 'Blog',
  Contact = 'Contact',
  BlogPostDetail = 'BlogPostDetail',
  EditBlogPost = 'EditBlogPost',
  Login = 'Login',
  Register = 'Register',
  Account = 'Account',
  CategoryPage = 'CategoryPage',
  AllPostsArchive = 'AllPostsArchive',
  AddBlogPost = 'AddBlogPost',
  PhotoManagement = 'PhotoManagement',
  PostManagement = 'PostManagement',
}

// 用戶個人資料介面
export interface UserProfile {
  username: string; // 用戶名
  email: string; // 電子郵件
  avatarUrl: string; // 頭像 URL
  gender?: 'male' | 'female' | 'other' | 'not_specified'; // 性別
  birthday?: string; // 生日
  address?: string; // 地址
  phone?: string; // 電話
}

// 側邊欄導航項目介面
export interface NavItem {
  page: Page; // 對應的頁面
  path: string; // 導航路徑
  label: string; // 標籤（現在是翻譯鍵）
  icon: React.ElementType; // 圖標組件
}

// 技能項目介面
export interface Skill {
  nameKey: string; // 技能名稱的翻譯鍵
  level: number; // 技能水平 (0-100 的百分比)
}

// 時間軸項目介面 (用於履歷)
export interface TimelineItem {
  date: string; // 日期
  titleKey: string; // 標題的翻譯鍵
  institutionKey: string; // 機構/公司的翻譯鍵
  descriptionKey: string; // 描述的翻譯鍵
}

// 服務項目介面 (用於關於我頁面)
export interface ServiceItem {
  icon: React.ReactNode; // 圖標節點
  titleKey: string; // 標題的翻譯鍵
  descriptionKey: string; // 描述的翻譯鍵
}

// 作品集項目數據介面
export interface PortfolioItemData {
  id: string; // 唯一 ID
  date?: string; // 日期
  imageUrl: string; // 圖片 URL
  projectLinkUrl?: string; // 項目連結 URL
  isStatic?: boolean; // 是否為靜態數據 (來自 JSON 文件)

  // 用於靜態數據的翻譯鍵
  titleKey?: string;      // 標題翻譯鍵
  descriptionKey?: string;// 描述翻譯鍵

  // 用戶添加項目的雙語輸入
  title?: string;         // 用戶輸入的英文標題
  titleZh?: string;       // 用戶輸入的中文標題
  description?: string;   // 用戶輸入的英文描述
  descriptionZh?: string; // 用戶輸入的中文描述
  projectLinkText?: string; // 用戶輸入的連結文字

  // 分類鍵
  categoryKey?: string;     // 例如: 'portfolioPage.filterStreet'
  views?: number; // 觀看次數
  isFeatured?: boolean; // 是否為精選項目
}

// 部落格文章數據介面
export interface BlogPostData {
  id: string; // 唯一 ID
  date: string; // 發布日期
  imageUrl: string; // 圖片 URL
  isLocked?: boolean; // 是否為鎖定文章（例如需要訂閱）
  createdAt: number; // 創建時間戳，用於排序
  categoryKey?: string; // 分類鍵，用於分組
  likes?: number; // 點讚數
  commentsCount?: number; // 留言數
  views?: number; // 觀看次數
  isFeatured?: boolean; // 是否為精選文章
  isStatic?: boolean; // 是否為靜態數據 (來自 JSON 文件)
  
  // 用於靜態數據的翻譯鍵
  titleKey?: string;
  excerptKey?: string;
  contentKey?: string;
  
  // 用戶添加的、非翻譯（但雙語）文章的字段
  title?: string;
  titleZh?: string;
  excerpt?: string; 
  excerptZh?: string;
  content?: string; 
  contentZh?: string; 
}

// 社交媒體登入提供商類型
export type SocialLoginProvider = 'google' | 'facebook';

// 留言數據介面
export interface Comment {
  id: string; // 唯一 ID
  postId: string; // 所屬文章 ID
  userId: string; // 用戶 ID
  username: string; // 用戶名
  avatarUrl: string; // 頭像 URL
  date: string; // 發布日期 (ISO 格式字符串)
  text: string; // 留言內容
  parentId: string | null; // 父留言 ID，用於實現回覆
}

// 帶有子留言的留言介面，用於構建留言樹
export interface CommentWithChildren extends Comment {
  children: CommentWithChildren[];
}

// 分類資訊介面
export interface CategoryInfo {
  categoryKeys: string[]; // 此大分類包含的所有小分類鍵
  titleKey: string; // 此大分類的標題翻譯鍵
  isEditable?: boolean; // 此分類下的內容是否可由用戶編輯
}