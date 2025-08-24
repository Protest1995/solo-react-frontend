// 引入 React 相關鉤子
import React, { useState, useEffect, useRef } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
// 引入 React Router 的 Link 和 useLocation 鉤子
import { Link, useLocation } from 'react-router-dom';
// 引入類型定義
import { Page, NavItem } from '../types';
// 引入應用程式的常數
import { NAVIGATION_ITEMS, AUTH_NAVIGATION_ITEMS, ACCENT_FOCUS_VISIBLE_RING_CLASS } from '../constants';
// 引入社交媒體和功能圖標組件
import LoginIcon from './icons/LoginIcon';
import LogoutIcon from './icons/LogoutIcon';
import SettingsIcon from './icons/SettingsIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
// 引入部落格分類數據
import { blogCategoryDefinitions } from './data/blogData';
// 引入超級管理員相關圖標
import SuperUserIcon from './icons/SuperUserIcon';
import PhotoIcon from './icons/PhotoIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CloseIcon from './icons/CloseIcon';
// 引入認證上下文
import { useAuth } from '../src/contexts/AuthContext';
import LinkedInIcon from './icons/LinkedInIcon';
import GithubIcon from './icons/GithubIcon';
import InstagramIcon from './icons/InstagramIcon';
import LanguageIcon from './icons/LanguageIcon';
import UserIcon from './icons/UserIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 定義主題的類型
type Theme = 'light' | 'dark';

// 定義 Sidebar 組件的屬性介面
interface SidebarProps {
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  isOpen: boolean; // 側邊欄在移動端是否開啟
  closeSidebar: () => void; // 關閉側邊欄的函數
  isAuthenticated: boolean; // 用戶是否已登入
  handleLogout: () => void; // 處理登出的函數
  avatarUrl: string; // 用戶頭像 URL
  username: string; // 用戶名
  email: string; // 用戶 email
  currentTheme: Theme; // 當前主題
  toggleTheme: () => void; // 切換主題的函數
  isCollapsed: boolean; // 側邊欄在桌面端是否收合
  toggleCollapse: () => void; // 切換收合狀態的函數
  isSuperUser: boolean; // 用戶是否為超級管理員
  isMobileView: boolean;
}

/**
 * 側邊欄組件 (Sidebar)。
 * 負責應用程式的主要導航、用戶資訊顯示、主題切換、語言切換和登入/登出功能。
 * 它的佈局和行為會根據視窗大小（桌面/移動端）和狀態（展開/收合）動態調整。
 */
const Sidebar: React.FC<SidebarProps> = ({
  navigateTo,
  isOpen,
  closeSidebar,
  isAuthenticated,
  handleLogout,
  avatarUrl,
  username,
  email,
  currentTheme,
  toggleTheme,
  isCollapsed,
  toggleCollapse,
  isSuperUser,
  isMobileView,
}) => {
  // --- 鉤子 (Hooks) ---
  const { t, i18n } = useTranslation();
  const { logout: authLogout } = useAuth();
  const location = useLocation(); // 獲取當前路由資訊，用於高亮顯示活動的導航項目
  
  // --- 狀態管理 (useState) ---
  const [avatarImageError, setAvatarImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isBlogSubMenuOpen, setIsBlogSubMenuOpen] = useState(false); // 部落格子菜單是否展開
  const [isSuperUserMenuOpen, setIsSuperUserMenuOpen] = useState(false); // 超級管理員菜單是否展開
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // 新增：個人資料下拉菜單狀態
  const profileMenuRef = useRef<HTMLDivElement>(null); // 新增：用於偵測點擊外部以關閉菜單的 ref

  // --- 副作用 (useEffect) ---

  // 當頭像 URL 改變時，重置圖片加載狀態以顯示加載動畫
  useEffect(() => {
    setAvatarImageError(false);
    setIsImageLoaded(false);
  }, [avatarUrl]);


  // 判斷是否為桌面端的收合狀態 (此狀態下不應響應 isOpen)
  const isDesktopCollapsed = isCollapsed && !isOpen;

  // 判斷當前是否在部落格相關頁面
  const isBlogSectionActive = location.pathname.startsWith('/blog');
  // 判斷當前是否在超級管理員相關頁面
  const isSuperUserSectionActive = location.pathname.startsWith('/manage');

  // 當路由變化時，如果進入了部落格或管理員區塊，則自動展開對應的子菜單
  useEffect(() => {
    if (isBlogSectionActive) setIsBlogSubMenuOpen(true);
    if (isSuperUserSectionActive) setIsSuperUserMenuOpen(true);
  }, [location.pathname, isBlogSectionActive, isSuperUserSectionActive]);

  // 新增：處理點擊外部以關閉個人資料菜單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setIsProfileMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- 處理函數 ---
  const handleImageLoad = () => setIsImageLoaded(true);
  const handleImageError = () => setAvatarImageError(true);
  
  const handleAccountClick = () => {
    navigateTo(Page.Account);
    setIsProfileMenuOpen(false);
    closeSidebar();
  };
  
  const handleLogoutClick = async () => {
    try {
        await authLogout();
    } finally {
        handleLogout();
        setIsProfileMenuOpen(false);
        closeSidebar();
    }
  };
  const handleLoginClick = () => {
      navigateTo(Page.Login);
      closeSidebar();
  };

  // 根據認證狀態合併導航項目列表
  const allNavItems = isAuthenticated ? [...NAVIGATION_ITEMS, ...AUTH_NAVIGATION_ITEMS] : NAVIGATION_ITEMS;

  // --- 動態 CSS Class ---
  // 側邊欄基礎樣式（移除了 inset-y-0 以進行條件應用）
  const sidebarBaseClasses = "fixed left-0 flex flex-col transform transition-all duration-300 ease-in-out z-40";
  // 移動端開啟時的樣式（pt-20 調整為 pt-4）
  const mobileOpenClasses = `translate-x-0 w-4/5 max-w-sm bg-glass border-r border-theme-primary px-8 pb-8 pt-4`;
  // 移動端關閉時的樣式
  const mobileClosedClasses = `-translate-x-full w-4/5 max-w-sm bg-theme-secondary`;
  // 桌面端基礎樣式
  const desktopBaseClasses = "lg:translate-x-0 lg:bg-theme-secondary";
  // 桌面端展開時的樣式
  const desktopExpandedClasses = "lg:w-80 lg:p-8";
  // 桌面端收合時的樣式
  const desktopCollapsedClasses = "lg:w-20 lg:p-3 lg:items-center";

  // --- 渲染 (JSX) ---
  return (
    <aside className={`${sidebarBaseClasses} ${isMobileView ? 'top-16 bottom-0' : 'inset-y-0'} ${isOpen ? mobileOpenClasses : mobileClosedClasses} ${desktopBaseClasses} ${isDesktopCollapsed ? desktopCollapsedClasses : desktopExpandedClasses}`}>
      
      {!isMobileView && (
        <button
          onClick={toggleCollapse}
          className={`
            absolute bottom-40 right-0 transform translate-x-1/2 -translate-y-1/2 z-50
            w-6 h-8 rounded-lg
            bg-theme-secondary border border-theme-primary
            flex items-center justify-center
            text-theme-secondary hover:text-custom-cyan
            transition-colors duration-300 ease-in-out
            focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}
            shadow-md
          `}
          aria-label={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isCollapsed ? 'right' : 'left'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>
      )}

      {/* Profile Section */}
      {!isMobileView && (
        <div ref={profileMenuRef}>
          <div className={`w-full`}>
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={isDesktopCollapsed ? 'profile-collapsed' : 'profile-expanded'}
                initial={{ opacity: 0, x: isDesktopCollapsed ? 0 : -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: isDesktopCollapsed ? 0.1 : 0.2, duration: 0.3 } }}
                exit={{ opacity: 0, x: isDesktopCollapsed ? 0 : -20, transition: { duration: 0.2 } }}
              >
                {isDesktopCollapsed ? (
                  <div className="relative flex flex-col items-center space-y-2">
                    {isAuthenticated ? (
                      <button onClick={() => setIsProfileMenuOpen(p => !p)} className={`w-12 h-12 rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`} aria-label={username} title={username}>
                        <div className="w-full h-full bg-theme-tertiary rounded-full flex items-center justify-center relative overflow-hidden">
                            {avatarUrl && !avatarImageError ? (
                                <motion.img
                                    key={`avatar-collapsed-${avatarUrl}`}
                                    src={avatarUrl}
                                    alt={username}
                                    className="w-full h-full object-cover rounded-full absolute inset-0"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isImageLoaded ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            ) : null}
                            <AnimatePresence>
                                {(!isImageLoaded || avatarImageError) && (
                                    <motion.div
                                        key="avatar-fallback-collapsed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute"
                                    >
                                        <UserIcon className="w-6 h-6 text-theme-secondary" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                      </button>
                    ) : (
                      <button onClick={handleLoginClick} className={`flex items-center justify-center rounded-full transition-all duration-200 ease-in-out text-sm button-theme-accent font-semibold shadow-md focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} w-10 h-10`} aria-label={t('sidebar.login')} title={t('sidebar.login')}>
                        <LoginIcon className="w-5 h-5" />
                      </button>
                    )}
                    <AnimatePresence>
                        {isProfileMenuOpen && isAuthenticated && (
                            <motion.div 
                                className="absolute left-full top-0 ml-3 w-48 bg-theme-secondary rounded-md shadow-lg border border-theme-primary z-50"
                                initial={{ opacity: 0, scale: 0.95, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ul className="p-2 text-sm text-theme-primary">
                                    <li>
                                        <button onClick={handleAccountClick} className="w-full flex items-center px-4 py-2 text-left rounded-md hover:bg-theme-hover hover:text-custom-cyan transition-colors">
                                            <SettingsIcon className="w-4 h-4 mr-2" />
                                            {t('sidebar.account')}
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={handleLogoutClick} className="w-full flex items-center px-4 py-2 text-left rounded-md hover:bg-theme-hover text-red-500 hover:text-red-400 transition-colors">
                                            <LogoutIcon className="w-4 h-4 mr-2" />
                                            {t('sidebar.logout')}
                                        </button>
                                    </li>
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div>
                    {isAuthenticated ? (
                      <div>
                        <button onClick={() => setIsProfileMenuOpen(p => !p)} className="w-full group flex items-center p-2 text-left hover:bg-theme-hover rounded-lg transition-colors" aria-expanded={isProfileMenuOpen}>
                          <div className="w-10 h-10 bg-theme-tertiary rounded-full flex items-center justify-center mr-3 flex-shrink-0 relative overflow-hidden">
                            {avatarUrl && !avatarImageError ? (
                                <motion.img
                                    key={`avatar-expanded-${avatarUrl}`}
                                    src={avatarUrl}
                                    alt={username}
                                    className="w-full h-full object-cover rounded-full absolute inset-0"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isImageLoaded ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            ) : null}
                            <AnimatePresence>
                                {(!isImageLoaded || avatarImageError) && (
                                    <motion.div
                                        key="avatar-fallback-expanded"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute"
                                    >
                                        <UserIcon className="w-6 h-6 text-theme-secondary" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-semibold text-theme-primary leading-tight truncate">{username}</p>
                            <p className="text-sm text-theme-secondary leading-tight truncate">{email}</p>
                          </div>
                          <motion.div 
                            animate={{ rotate: isProfileMenuOpen ? 0 : 180 }} 
                            className="text-theme-secondary group-hover:text-custom-cyan transition-colors"
                          >
                            <ChevronUpIcon className="w-5 h-5 flex-shrink-0 ml-2" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {isProfileMenuOpen && (
                            <motion.div
                              className="overflow-hidden"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                              <div className="pt-2">
                                <ul className="list-none p-0">
                                  <li className="mb-1">
                                    <button onClick={handleAccountClick} className={`flex items-center rounded-full transition-all duration-200 ease-in-out relative w-full py-3 px-4 justify-start text-theme-secondary hover:text-custom-cyan`}>
                                      <SettingsIcon className={`w-5 h-5 transition-colors duration-200 ease-in-out mr-3`} />
                                      <span className="whitespace-nowrap">{t('sidebar.account')}</span>
                                    </button>
                                  </li>
                                  <li className="mb-1">
                                    <button onClick={handleLogoutClick} className={`flex items-center rounded-full transition-all duration-200 ease-in-out relative w-full py-3 px-4 justify-start text-red-500 hover:text-red-400`}>
                                      <LogoutIcon className={`w-5 h-5 transition-colors duration-200 ease-in-out mr-3`} />
                                      <span className="whitespace-nowrap">{t('sidebar.logout')}</span>
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <button onClick={handleLoginClick} className="w-full flex items-center p-2 text-left hover:bg-theme-hover rounded-lg transition-colors">
                        <div className="w-10 h-10 bg-theme-tertiary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <LoginIcon className="w-5 h-5 text-theme-secondary" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-theme-primary leading-tight">{t('sidebar.login')}</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Separator */}
      {!isMobileView && (
        <motion.div
            key={isDesktopCollapsed ? 'collapsed-separator' : 'expanded-separator'}
            className={isDesktopCollapsed ? "my-2" : "my-4"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <hr className="border-theme-primary w-full" />
        </motion.div>
      )}

      {/* 導航菜單 */}
      <nav className="flex-grow w-full overflow-y-auto min-h-0">
        <ul>
          {allNavItems.map((item) => {
            // 對於部落格菜單項，在展開模式下渲染為可折疊的子菜單
            if (item.page === Page.Blog && !isDesktopCollapsed) {
              return (
                <li key="blog-expandable" className="mb-1">
                  <button onClick={() => setIsBlogSubMenuOpen(p => !p)} className={`flex items-center rounded-full transition-all duration-200 ease-in-out relative w-full py-3 px-4 justify-between bg-transparent ${isBlogSectionActive ? `text-custom-cyan font-semibold` : `text-theme-secondary hover:text-custom-cyan`}`} aria-expanded={isBlogSubMenuOpen}>
                    <div className="flex items-center">
                      <item.icon className={`w-5 h-5 transition-colors duration-200 ease-in-out mr-3`} />
                      <AnimatePresence>
                        {!isDesktopCollapsed && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="whitespace-nowrap">
                            {t(item.label)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.div animate={{ rotate: isBlogSubMenuOpen ? 180 : 0 }}> <ChevronDownIcon className="w-4 h-4" /> </motion.div>
                  </button>
                  {/* 子菜單的進入和退出動畫 */}
                  <AnimatePresence> {isBlogSubMenuOpen && (<motion.ul className="pl-8 pr-2 pt-1 space-y-1 overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                      <li> <Link to="/blog" onClick={closeSidebar} className={`block w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors ${location.pathname === '/blog' ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> {t('blogPage.viewAll')} </Link> </li>
                      {blogCategoryDefinitions.map(cat => (<li key={cat.titleKey}> <Link to={`/blog/category/${cat.titleKey.split('.').pop()}`} onClick={closeSidebar} className={`block w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors ${location.pathname.includes(`/blog/category/${cat.titleKey.split('.').pop()}`) ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> {t(cat.titleKey)} </Link> </li>))}
                  </motion.ul> )} </AnimatePresence>
                </li>
              );
            }
            // 渲染普通導航項目
            const isActive = item.page === Page.Blog ? isBlogSectionActive : location.pathname === item.path;
            return (
              <li key={item.path} className="mb-1">
                <Link to={item.path} onClick={closeSidebar} className={`flex items-center rounded-full transition-all duration-200 ease-in-out relative ${isDesktopCollapsed ? 'w-12 h-12 justify-center mx-auto' : 'w-full py-3 px-4'} bg-transparent ${isActive ? `text-custom-cyan font-semibold` : `text-theme-secondary hover:text-custom-cyan`}`} aria-current={isActive ? 'page' : undefined} title={isDesktopCollapsed ? t(item.label) : undefined}>
                  <item.icon className={`w-5 h-5 transition-colors duration-200 ease-in-out ${isDesktopCollapsed ? '' : 'mr-3'}`} />
                  <AnimatePresence>
                    {!isDesktopCollapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="whitespace-nowrap">
                        {t(item.label)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
        {/* 超級管理員工具菜單 */}
        {isSuperUser && !isMobileView && (
          <div className="mt-4 pt-4 border-t border-theme-primary">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={isDesktopCollapsed ? 'admin-collapsed' : 'admin-expanded'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                {isDesktopCollapsed ? (
                  // 收合模式下的管理員工具
                  <div className="space-y-1">
                      <Link to="/manage/photos" title={t('sidebar.photoManagement')} className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-colors bg-transparent hover:text-custom-cyan ${location.pathname === '/manage/photos' ? 'text-custom-cyan' : 'text-theme-secondary'}`}> <PhotoIcon className="w-5 h-5"/> </Link>
                      <Link to="/manage/posts" title={t('sidebar.postManagement')} className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full transition-colors bg-transparent hover:text-custom-cyan ${location.pathname === '/manage/posts' ? 'text-custom-cyan' : 'text-theme-secondary'}`}> <DocumentTextIcon className="w-5 h-5"/> </Link>
                  </div>
                ) : (
                  // 展開模式下的管理員工具
                  <div>
                    <button onClick={() => setIsSuperUserMenuOpen(p => !p)} className={`flex items-center justify-between w-full py-3 px-4 rounded-full transition-all duration-200 ease-in-out bg-transparent ${isSuperUserSectionActive ? `text-custom-cyan font-semibold` : 'text-theme-secondary hover:text-custom-cyan'}`} aria-expanded={isSuperUserMenuOpen}>
                      <div className="flex items-center">
                        <SuperUserIcon className="w-5 h-5 mr-3" />
                        <span className="font-semibold">{t('sidebar.SuperUserTools')}</span>
                      </div>
                      <motion.div animate={{ rotate: isSuperUserMenuOpen ? 180 : 0 }}> <ChevronDownIcon className="w-4 h-4" /> </motion.div>
                    </button>
                    <AnimatePresence> {isSuperUserMenuOpen && (<motion.ul className="pl-8 pr-2 pt-1 space-y-1 overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                      <li> <Link to="/manage/photos" onClick={closeSidebar} className={`w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors flex items-center ${location.pathname === '/manage/photos' ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> <PhotoIcon className="w-4 h-4 mr-2" />{t('sidebar.photoManagement')} </Link> </li>
                      <li> <Link to="/manage/posts" onClick={closeSidebar} className={`w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors flex items-center ${location.pathname === '/manage/posts' ? 'text-custom-cyan font-semibold' : 'text-theme-secondary hover:text-custom-cyan'}`}> <DocumentTextIcon className="w-4 h-4 mr-2" />{t('sidebar.postManagement')} </Link> </li>
                    </motion.ul>)} </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </nav>
      {/* 側邊欄底部 */}
      <div className="w-full mt-auto">
        {/* 登入/登出、語言和主題切換 (在桌面端顯示) */}
        {!isMobileView && (
          <div className={`w-full pt-4 border-t border-theme-primary`}>
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={isDesktopCollapsed ? 'footer-collapsed' : 'footer-expanded'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.1 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                {isDesktopCollapsed ? (
                  // 收合模式
                  <div className="flex flex-col items-center space-y-2">
                    <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh-Hant' : 'en')} className={`flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} button-theme-neutral w-10 h-10 text-lg font-semibold`} aria-label={t(i18n.language === 'en' ? 'switchToChinese' : 'switchToEnglish')} title={t(i18n.language === 'en' ? 'switchToChinese' : 'switchToEnglish')}>
                      <span>{i18n.language === 'en' ? '中' : 'E'}</span>
                    </button>
                    <button onClick={toggleTheme} className={`flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} button-theme-toggle w-10 h-10`} aria-label={currentTheme === 'light' ? t('sidebar.switchToDarkMode') : t('sidebar.switchToLightMode')} title={currentTheme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')}>
                      {currentTheme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  // 展開模式
                  <div>
                    <div className="flex justify-between items-center space-x-2">
                      <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh-Hant' : 'en')} className={`flex-1 flex items-center justify-center text-xs font-semibold rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} button-theme-neutral px-4 py-1.5`}>
                         <span>{i18n.language === 'en' ? t('switchToChinese') : 'English'}</span>
                      </button>
                      <button onClick={toggleTheme} className={`flex-1 flex items-center justify-center text-xs font-semibold rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} button-theme-toggle px-4 py-1.5`}>
                        {currentTheme === 'light' ? <MoonIcon className="w-4 h-4 mr-2" /> : <SunIcon className="w-4 h-4 mr-2" />}
                        <span>{currentTheme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        {/* 社交媒體與版權 (在桌面端展開時顯示) */}
        <AnimatePresence>
          {!isMobileView && !isDesktopCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className={`pt-6 mt-6 border-t border-theme-primary text-center`}
              >
                  <div className={`flex justify-center space-x-4 mb-4`}>
                      <a href="https://www.linkedin.com/in/solo-huang-203774214/" target="_blank" rel="noopener noreferrer" aria-label={t('sidebar.profileName') + " LinkedIn"} className="text-theme-secondary transition-colors hover:text-custom-cyan inline-block p-1"> <LinkedInIcon className="w-5 h-5 mx-auto" /> </a>
                      <a href="https://github.com/solohuang" target="_blank" rel="noopener noreferrer" aria-label={t('sidebar.profileName') + " GitHub"} className="text-theme-secondary transition-colors hover:text-custom-cyan inline-block p-1"> <GithubIcon className="w-5 h-5 mx-auto" /> </a>
                      <a href="https://www.instagram.com/solo_snapshots/" target="_blank" rel="noopener noreferrer" aria-label={t('sidebar.instagramAriaLabel')} className="text-theme-secondary transition-colors hover:text-custom-cyan inline-block p-1"> <InstagramIcon className="w-5 h-5 mx-auto" /> </a>
                  </div>
                  <p className="text-xs text-theme-muted mt-4">
                      {(() => {
                          const copyrightText = t('sidebar.copyright');
                          const parts = copyrightText.split('Solo');
                          return (
                               <>
                                  {parts[0]}
                                  <span className="text-custom-cyan">Solo</span>
                                  {parts[1]}
                              </>
                          );
                      })()}
                  </p>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default Sidebar;