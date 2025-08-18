

import { Page, NavItem } from './types';
import HomeIcon from './components/icons/HomeIcon';
import UserIcon from './components/icons/UserIcon';
import BriefcaseIcon from './components/icons/BriefcaseIcon';
import CollectionIcon from './components/icons/CollectionIcon';
import PenPaperIcon from './components/icons/PenPaperIcon'; // Blog 的新圖示
import MailIcon from './components/icons/MailIcon';
import SettingsIcon from './components/icons/SettingsIcon'; // Account 的新圖示
import NewspaperIcon from './components/icons/NewspaperIcon';

// 主要導航項目列表
export const NAVIGATION_ITEMS: NavItem[] = [
  { page: Page.Home, path: '/', label: 'sidebar.home', icon: HomeIcon },
  { page: Page.About, path: '/about', label: 'sidebar.aboutMe', icon: UserIcon },
  { page: Page.Resume, path: '/resume', label: 'sidebar.resume', icon: BriefcaseIcon },
  { page: Page.Portfolio, path: '/portfolio', label: 'sidebar.portfolio', icon: CollectionIcon },
  { page: Page.Blog, path: '/blog', label: 'sidebar.blog', icon: PenPaperIcon }, // Blog 的圖示已更改
  { page: Page.Contact, path: '/contact', label: 'sidebar.contact', icon: MailIcon },
];

// 已驗證用戶的導航項目列表
export const AUTH_NAVIGATION_ITEMS: NavItem[] = [
    { page: Page.Account, path: '/account', label: 'sidebar.account', icon: SettingsIcon },
];


// 主題強調色相關的 CSS class 常數
// 更新為使用 index.html 中定義的自訂 CSS class

// 用於文字顏色
export const ACCENT_COLOR = 'text-custom-cyan';
// 用於漸變背景
export const ACCENT_BG_COLOR = 'bg-custom-cyan-gradient';
// 用於邊框顏色
export const ACCENT_BORDER_COLOR = 'border-custom-cyan';
// 用於實色背景
export const ACCENT_SOLID_BG_COLOR = 'bg-custom-cyan';
// 用於漸變文字顏色
export const ACCENT_TEXT_GRADIENT_COLOR = 'text-custom-cyan-gradient';

// 漸變背景的懸停（hover）狀態
export const ACCENT_BG_HOVER_COLOR = 'hover:bg-custom-cyan-gradient-hover';

// 用於表單輸入元素（焦點環、文件輸入）
// 應用於 :focus
export const ACCENT_FOCUS_RING_CLASS = 'focus-ring-custom-cyan';
// 應用於 :focus-visible
export const ACCENT_FOCUS_VISIBLE_RING_CLASS = 'focus-visible-ring-custom-cyan';
// 用於文件選擇器按鈕的背景
export const ACCENT_FILE_BG_CLASS = 'file-bg-custom-cyan';
// 用於文件選擇器按鈕的懸停背景
export const ACCENT_FILE_BG_HOVER_CLASS = 'hover-file-bg-custom-cyan-hover';