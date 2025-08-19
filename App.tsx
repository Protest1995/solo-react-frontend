
import React, { useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { Routes, Route, Outlet, useLocation, useNavigate, useParams, Navigate, matchPath } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './components/pages/HomePage';
import AboutPage from './components/pages/AboutPage';
import ResumePage from './components/pages/ResumePage';
import { PortfolioPage } from './components/pages/PortfolioPage';
import { BlogPage } from './components/pages/BlogPage';
import ContactPage from './components/pages/ContactPage';
import BlogPostDetailPage from './components/pages/BlogPostDetailPage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import AccountPage from './components/pages/AccountPage';
import { Page, BlogPostData, PortfolioItemData, SocialLoginProvider, UserProfile, Comment, CategoryInfo } from './types';
import MenuIcon from './components/icons/MenuIcon';
import { pageTransitionVariants } from './animationVariants';
import BackToTopButton from './components/ui/BackToTopButton';
import CategoryArchivePage from './components/pages/CategoryArchivePage';
import AddBlogPostPage from './components/pages/AddBlogPostPage';
import EditBlogPostPage from './components/pages/EditBlogPostPage';
import PhotoManagementPage from './components/pages/PhotoManagementPage';
import PostManagementPage from './components/pages/PostManagementPage';
import SplashScreen from './components/ui/SplashScreen';
import Footer from './components/ui/Footer';
import { blogCategoryDefinitions } from './components/data/blogData';
import { NAVIGATION_ITEMS, AUTH_NAVIGATION_ITEMS } from './constants';
// AuthProvider 由 index.tsx 包裹，避免重複包裹導致重新掛載

// 引入靜態數據
import { ApiService } from './src/services/api';
import { useAuth } from './src/contexts/AuthContext';


// 將 motionTyped 轉型為 any 以解決類型問題
const motion: any = motionTyped;

// --- Route Protection Components ---
interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

interface SuperUserRouteProps {
  isSuperUser: boolean;
  children: ReactNode;
}

const SuperUserRoute: React.FC<SuperUserRouteProps> = ({ isSuperUser, children }) => {
  if (!isSuperUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// --- Route Component Wrappers ---
// By defining these wrappers outside the App component, we ensure they are stable
// and do not get recreated on every render, which prevents page state from being lost.

const LoginPageWrapper: React.FC = () => <LoginPage />;
const RegisterPageWrapper: React.FC = () => <RegisterPage />;

const PortfolioPageWrapper: React.FC<any> = (props) => <PortfolioPage {...props} />;
const BlogPageWrapper: React.FC<any> = (props) => <BlogPage {...props} />;
const BlogPostDetailWrapper: React.FC<any> = ({ userAddedPosts, allComments, ...props }) => {
    const { postId } = useParams();
    const location = useLocation();
    const post = useMemo(() => userAddedPosts.find((p: BlogPostData) => p.id === postId), [postId, userAddedPosts]);
    const originCategoryInfo = location.state?.fromCategory as CategoryInfo | null;
    if (!post) return <Navigate to="/blog" replace />;
    return <BlogPostDetailPage post={post} allPosts={userAddedPosts} comments={allComments.filter((c: Comment) => c.postId === post.id)} {...props} originCategoryInfo={originCategoryInfo} />;
};
const CategoryArchiveWrapper: React.FC<any> = ({ allPosts, ...props }) => {
    const { categoryKey } = useParams();
    const categoryInfo = useMemo(() => {
        if (categoryKey === 'all') return { titleKey: 'portfolioPage.filterAll', categoryKeys: [], isEditable: true };
        return blogCategoryDefinitions.find(def => (def.titleKey.split('.').pop() || '') === categoryKey) || null;
    }, [categoryKey]);
    if (!categoryInfo) return <Navigate to="/blog" replace />;
    return <CategoryArchivePage categoryInfo={categoryInfo} allPosts={allPosts} {...props} />;
};
const AccountPageWrapper: React.FC<any> = (props) => <AccountPage {...props} />;
const AddBlogPostPageWrapper: React.FC<any> = (props) => <AddBlogPostPage {...props} />;
const EditBlogPostWrapper: React.FC<any> = ({ userAddedPosts, ...props }) => {
    const { postId } = useParams();
    const postToEdit = useMemo(() => userAddedPosts.find((p: BlogPostData) => p.id === postId), [postId, userAddedPosts]);
    if (!postToEdit) return <Navigate to="/blog" replace />;
    return <EditBlogPostPage postToEdit={postToEdit} {...props} />;
};
const PhotoManagementPageWrapper: React.FC<any> = (props) => <PhotoManagementPage {...props} />;
const PostManagementPageWrapper: React.FC<any> = (props) => <PostManagementPage {...props} />;


// 定義主題類型
type Theme = 'light' | 'dark';

const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const storedValue = window.localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
        console.error(`Could not access localStorage for key "${key}"`, error);
        return defaultValue;
    }
};

const getInitialTheme = (): Theme => getFromLocalStorage<Theme>('theme', 'dark');
const getInitialSidebarCollapsed = (): boolean => getFromLocalStorage<boolean>('sidebarCollapsed', false);

// --- Layout Component ---
// This component is defined outside of App to prevent re-mounting on every render.
interface LayoutProps {
  isSidebarOpen: boolean;
  isMobileView: boolean;
  isLandscape: boolean;
  isAuthenticated: boolean;
  isSuperUser: boolean;
  username: string;
  avatarUrl: string;
  currentTheme: Theme;
  isSidebarCollapsed: boolean;
  showBackToTop: boolean;
  mobileHeaderClasses: string;
  glassEffectClass: string;
  mainContentClasses: string;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  handleLogout: () => void;
  toggleTheme: () => void;
  toggleCollapse: () => void;
  navigateTo: (page: Page, data?: any) => void;
}

const Layout: React.FC<LayoutProps> = ({
  isSidebarOpen, isMobileView, isLandscape, isAuthenticated, isSuperUser,
  username, avatarUrl, currentTheme, isSidebarCollapsed, showBackToTop,
  mobileHeaderClasses, glassEffectClass, mainContentClasses,
  toggleSidebar, closeSidebar, handleLogout, toggleTheme, toggleCollapse, navigateTo,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isBlogPage = location.pathname === '/blog';
  
  return (
    <>
      <Sidebar
        navigateTo={navigateTo}
        isOpen={isSidebarOpen && isMobileView}
        closeSidebar={closeSidebar}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
        avatarUrl={avatarUrl}
        username={username}
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleCollapse}
        isSuperUser={isSuperUser}
        isLandscape={isLandscape}
      />
      <header className={`${mobileHeaderClasses} ${glassEffectClass}`}>
          <div className="container mx-auto px-6 h-full flex justify-end items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 -mr-2"
              aria-label={t('sidebar.toggleNavigation')}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
      </header>
      <main className={mainContentClasses}>
        <div className="p-6 md:p-12 min-h-screen">
          <Outlet />
        </div>
        {isBlogPage && <Footer navigateTo={navigateTo} />}
      </main>
      <BackToTopButton isVisible={showBackToTop} />
    </>
  );
};

/**
 * 應用程式的主組件。
 * 管理整個應用的狀態，包括主題、身份驗證等，並使用 React Router 處理導航。
 */
const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [isAppLoading, setIsAppLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
        const hasLoaded = sessionStorage.getItem('hasLoaded');
        return !hasLoaded;
    } catch (e) {
        console.error("Could not access sessionStorage for splash screen state.", e);
        return true;
    }
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(getInitialSidebarCollapsed);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: t('sidebar.profileName'),
    email: '',
    avatarUrl: '/images/profile.jpg',
    gender: 'not_specified',
    birthday: '',
    address: '',
    phone: '',
  }); 
  
  const [userAddedPosts, setUserAddedPosts] = useState<BlogPostData[]>([]);
  const [userAddedPortfolioItems, setUserAddedPortfolioItems] = useState<PortfolioItemData[]>([]);
  
  const [allComments, setAllComments] = useState<Comment[]>([]);

  const isSuperUser = isAuthenticated && ((user?.role === 'SUPER_USER') || (user?.role === 'ADMIN') || (user?.username === 'admin'));

  const handleAnimationComplete = () => {
    try {
        sessionStorage.setItem('hasLoaded', 'true');
    } catch(e) {
        console.error("Could not write to sessionStorage", e);
    }
    setIsAppLoading(false);
  };

  useEffect(() => { localStorage.setItem('theme', JSON.stringify(theme)); document.body.classList.remove('theme-light', 'theme-dark'); document.body.classList.add(`theme-${theme}`); }, [theme]);
  useEffect(() => { localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed)); }, [isSidebarCollapsed]);
  
  // Effect for handling window resize events to update view-related states.
  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyMobile = window.innerWidth < 1024;
      setIsMobileView(isCurrentlyMobile);
      setIsLandscape(isCurrentlyMobile && window.matchMedia("(orientation: landscape)").matches);
      if (!isCurrentlyMobile && isSidebarOpen) {
        setIsSidebarOpen(false); // Close mobile sidebar on resize to desktop
      }
    };

    handleResize(); // Initial check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Effect for handling scroll events, throttled for performance.
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Update header visibility based on scroll direction on mobile
      if (isMobileView) {
        const scrollDelta = currentScrollY - lastScrollY.current;
        if (currentScrollY < 50) {
          setIsMobileHeaderVisible(true);
        } else if (scrollDelta > 5) {
          setIsMobileHeaderVisible(false);
        } else if (scrollDelta < -5) {
          setIsMobileHeaderVisible(true);
        }
      } else {
        setIsMobileHeaderVisible(true); // Always visible on desktop
      }

      // Update other scroll-dependent states
      setShowBackToTop(currentScrollY > 400);
      setIsScrolled(currentScrollY > 50);

      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
      ticking = false;
    };
    
    const throttledScrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    // Initial call to set states correctly on mount
    throttledScrollHandler();

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, [isMobileView]); // Re-run this effect only when mobile view changes

  // 以 API 載入作品集與部落格資料（不回退 JSON）
  useEffect(() => {
    (async () => {
      try {
        const [portfolio, posts] = await Promise.all([
          ApiService.request<PortfolioItemData[]>({ url: '/api/portfolio', method: 'GET' }),
          ApiService.request<BlogPostData[]>({ url: '/api/posts', method: 'GET' }),
        ]);
        setUserAddedPortfolioItems(Array.isArray(portfolio) ? portfolio : []);
        setUserAddedPosts(Array.isArray(posts) ? posts : []);
      } catch (e) {
        console.error('載入內容失敗', e);
        setUserAddedPortfolioItems([]);
        setUserAddedPosts([]);
      }
    })();
  }, []);

  // 當前端已載入文章後，載入所有留言（按需載入每篇可在詳情頁呼叫，這裡簡化）
  useEffect(() => {
    (async () => {
      try {
        const results: Comment[] = [];
        for (const p of userAddedPosts) {
          const list = await ApiService.getCommentsByPost(p.id);
          // 映射後端欄位到前端 Comment 介面
          const mapped = (list || []).map((c: any) => ({
            id: c.id,
            postId: c.postId,
            userId: c.userId,
            username: c.username,
            avatarUrl: c.avatarUrl,
            date: c.date,
            text: c.text,
            parentId: c.parentId || null,
          }));
          results.push(...mapped);
        }
        setAllComments(results);
      } catch (e) {
        console.error('載入留言失敗', e);
        setAllComments([]);
      }
    })();
  }, [userAddedPosts]);

  useEffect(() => {
    if (isMobileView && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobileView]);

  // Effect to update document title based on the current route
  useEffect(() => {
    const baseTitle = "Solo - Portfolio";
    let pageTitle = '';

    const { pathname } = location;
    const allNavItems = [...NAVIGATION_ITEMS, ...AUTH_NAVIGATION_ITEMS];
    const staticNavItem = allNavItems.find(item => item.path === pathname);

    if (staticNavItem) {
        pageTitle = t(staticNavItem.label);
    } else {
        const routeConfig: { path: string; title?: string | ((params: any) => string | undefined) }[] = [
            { path: '/blog/:postId', title: (params) => {
                const post = userAddedPosts.find(p => p.id === params.postId);
                return post ? (i18n.language === 'zh-Hant' && post.titleZh ? post.titleZh : (post.title || t('blogPage.untitledPost'))) : t('blogPage.blog');
            }},
            { path: '/blog/category/:categoryKey', title: (params) => {
                if (params.categoryKey === 'all') return t('portfolioPage.filterAll');
                const categoryInfo = blogCategoryDefinitions.find(def => (def.titleKey.split('.').pop() || '') === params.categoryKey);
                return categoryInfo ? t(categoryInfo.titleKey) : t('blogPage.blog');
            }},
            { path: '/blog/edit/:postId', title: t('blogPage.editFormTitle') },
            { path: '/login', title: t('loginPage.title') },
            { path: '/register', title: t('registerPage.title') },
            { path: '/blog/add', title: t('blogPage.addFormTitle') },
            { path: '/manage/photos', title: t('photoManagementPage.title') },
            { path: '/manage/posts', title: t('postManagementPage.title') },
        ];

        for (const route of routeConfig) {
            const match = matchPath(route.path, pathname);
            if (match) {
                if (typeof route.title === 'function') {
                    pageTitle = route.title(match.params) || '';
                } else if (typeof route.title === 'string') {
                    pageTitle = route.title;
                }
                break;
            }
        }
    }

    if (pageTitle) {
      document.title = pageTitle;
    } else {
        document.title = baseTitle;
    }
  }, [location.pathname, t, i18n.language, userAddedPosts]);


  const toggleTheme = useCallback(() => setTheme(p => p === 'light' ? 'dark' : 'light'), []);
  const toggleCollapse = useCallback(() => setIsSidebarCollapsed(p => !p), []);
  
  const navigateTo = useCallback((page: Page, data?: any) => {
      const pathMap: { [key in Page]?: string | ((d: any) => string) } = {
          [Page.Home]: '/',
          [Page.About]: '/about',
          [Page.Resume]: '/resume',
          [Page.Portfolio]: '/portfolio',
          [Page.Blog]: '/blog',
          [Page.Contact]: '/contact',
          [Page.BlogPostDetail]: (d) => `/blog/${d.id}`,
          [Page.EditBlogPost]: (d) => `/blog/edit/${d.id}`,
          [Page.Login]: '/login',
          [Page.Register]: '/register',
          [Page.Account]: '/account',
          [Page.CategoryPage]: (d) => {
              const categoryKey = d.titleKey.split('.').pop() || d.titleKey;
              return `/blog/category/${categoryKey}`;
          },
          [Page.AllPostsArchive]: '/blog/category/all',
          [Page.AddBlogPost]: '/blog/add',
          [Page.PhotoManagement]: '/manage/photos',
          [Page.PostManagement]: '/manage/posts',
      };
      
      const pathEntry = pathMap[page];
      let path: string | undefined;

      if (typeof pathEntry === 'function') {
          path = pathEntry(data);
      } else {
          path = pathEntry;
      }

      if (path) {
          navigate(path, { state: { fromCategory: data } });
          // 確保導向後視窗在頂部，避免看起來像沒跳轉
          window.requestAnimationFrame(() => window.scrollTo(0, 0));
      }

      setIsSidebarOpen(false);
  }, [navigate]);

  useEffect(() => { if (!isAuthenticated) setUserProfile(p => ({...p, username: t('sidebar.profileName')})); }, [t, i18n.language, isAuthenticated]);
  useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        username: user.username ?? prev.username,
        email: user.email ?? '',
        avatarUrl: user.avatarUrl ?? '/images/profile.jpg',
        gender: (user as any).gender ?? 'not_specified',
        birthday: (user as any).birthday ?? '',
        address: (user as any).address ?? '',
        phone: (user as any).phone ?? '',
      }));
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    setUserProfile({
      username: t('sidebar.profileName'),
      email: '',
      avatarUrl: '/images/profile.jpg',
      gender: 'not_specified',
      birthday: '',
      address: '',
      phone: '',
    });
    navigate('/');
  }, [navigate, t]);
  const handleUpdateUserProfile = useCallback((d: Partial<UserProfile>) => { if (!isAuthenticated) return; setUserProfile(p => ({...p, ...d})); }, [isAuthenticated]);
  const handleUpdateAvatar = useCallback((url: string) => { if (!isAuthenticated) return; setUserProfile(p => ({...p, avatarUrl: url})); }, [isAuthenticated]);
  const handleSaveBlogPost = useCallback((postData: BlogPostData) => { if (!isSuperUser) return; setUserAddedPosts(p => { const i = p.findIndex(item => item.id === postData.id); if (i > -1) { const n = [...p]; n[i] = postData; return n; } return [postData, ...p]; }); navigate(`/blog/${postData.id}`); }, [isSuperUser, navigate]);
  const handleAddBlogPost = useCallback((postData: BlogPostData) => { if (!isSuperUser) return; setUserAddedPosts(p => [postData, ...p]); }, [isSuperUser]);
  const handleUpdateBlogPost = useCallback((postData: BlogPostData) => { if (!isSuperUser) return; setUserAddedPosts(p => p.map(post => post.id === postData.id ? postData : post)); }, [isSuperUser]);
  const handleDeleteBlogPosts = useCallback(async (ids: string[]) => { 
    if (!isSuperUser) return; 
    
    try {
      // 調用後端 API 刪除文章
      await Promise.all(ids.map(id => ApiService.deletePost(id)));
      
      // 更新本地狀態
      setUserAddedPosts(p => p.filter(post => !ids.includes(post.id)));
    } catch (error) {
      console.error('刪除文章失敗:', error);
      alert('刪除文章失敗，請重試');
    }
  }, [isSuperUser]);
  const handleAddPortfolioItem = useCallback((item: PortfolioItemData) => { if (!isSuperUser) return; setUserAddedPortfolioItems(p => [item, ...p]); }, [isSuperUser]);
  const handleUpdatePortfolioItem = useCallback((item: PortfolioItemData) => { if (!isSuperUser) return; setUserAddedPortfolioItems(p => p.map(i => i.id === item.id ? item : i)); }, [isSuperUser]);
  const handleDeletePortfolioItems = useCallback(async (ids: string[]) => { 
    if (!isSuperUser) return; 
    
    try {
      // 調用後端 API 刪除作品項目
      await Promise.all(ids.map(id => ApiService.deletePortfolioItem(id)));
      
      // 更新本地狀態
      setUserAddedPortfolioItems(p => p.filter(i => !ids.includes(i.id)));
    } catch (error) {
      console.error('刪除作品項目失敗:', error);
      alert('刪除作品項目失敗，請重試');
    }
  }, [isSuperUser]);   

  const handleAddComment = useCallback(async (postId: string, text: string, parentId: string | null = null) => {
    if (!isAuthenticated) return;
    try {
      const created = await ApiService.addComment({ postId, text, parentId });
      const mapped: Comment = {
        id: created.id,
        postId: created.postId,
        userId: created.userId,
        username: created.username,
        avatarUrl: created.avatarUrl,
        date: created.date,
        text: created.text,
        parentId: created.parentId || null,
      };
      setAllComments(p => [...p, mapped]);
    } catch (e) {
      console.error('新增留言失敗', e);
      alert('新增留言失敗，請稍後再試');
    }
  }, [isAuthenticated]);

  const handleDeleteComment = useCallback(async (id: string) => {
    if (!isSuperUser) return; 
    try {
      await ApiService.deleteComment(id);
      setAllComments(p => {
        const toDelete = new Set<string>([id]);
        const findChildren = (parentId: string) => {
          p.filter(c => c.parentId === parentId).forEach(c => { toDelete.add(c.id); findChildren(c.id); });
        };
        findChildren(id);
        return p.filter(c => !toDelete.has(c.id));
      });
    } catch (e) {
      console.error('刪除留言失敗', e);
      alert('刪除留言失敗');
    }
  }, [isSuperUser]);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(p => !p), []);

  const mainContentClasses = useMemo(() => `
    transition-all duration-300 ease-in-out
    ${isMobileView ? '' : (isSidebarCollapsed ? 'pl-20' : 'pl-80')}
  `, [isMobileView, isSidebarCollapsed]);
  
  const mobileHeaderClasses = `
    lg:hidden fixed top-0 left-0 right-0 z-50 h-16
    transition-transform duration-300 ease-in-out
    ${isMobileHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
  `;
  const glassEffectClass = isScrolled ? 'bg-glass border-b border-theme-primary' : '';
  
  return (
      <div className="bg-theme-primary text-theme-primary">
        <AnimatePresence>
          {isAppLoading && <SplashScreen onAnimationComplete={handleAnimationComplete} />}
        </AnimatePresence>
        {!isAppLoading && (
            <Routes>
                <Route path="/" element={
                    <Layout
                        isSidebarOpen={isSidebarOpen}
                        isMobileView={isMobileView}
                        isLandscape={isLandscape}
                        isAuthenticated={isAuthenticated}
                        isSuperUser={isSuperUser}
                        username={userProfile.username}
                        avatarUrl={userProfile.avatarUrl}
                        currentTheme={theme}
                        isSidebarCollapsed={isSidebarCollapsed}
                        showBackToTop={showBackToTop}
                        mobileHeaderClasses={mobileHeaderClasses}
                        glassEffectClass={glassEffectClass}
                        mainContentClasses={mainContentClasses}
                        toggleSidebar={toggleSidebar}
                        closeSidebar={() => setIsSidebarOpen(false)}
                        handleLogout={handleLogout}
                        toggleTheme={toggleTheme}
                        toggleCollapse={toggleCollapse}
                        navigateTo={navigateTo}
                    />
                }>
                    <Route index element={<HomePage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="resume" element={<ResumePage />} />
                    <Route path="portfolio" element={
                        <PortfolioPageWrapper
                            userAddedPortfolioItems={userAddedPortfolioItems}
                            onAddPortfolioItem={handleAddPortfolioItem}
                            onDeletePortfolioItems={handleDeletePortfolioItems}
                            isAuthenticated={isAuthenticated}
                            isSuperUser={isSuperUser}
                            navigateToLogin={() => navigateTo(Page.Login)}
                        />
                    } />
                    <Route path="blog" element={
                        <BlogPageWrapper
                            navigateTo={navigateTo}
                            allPosts={userAddedPosts}
                            onDeletePosts={handleDeleteBlogPosts}
                            isSuperUser={isSuperUser}
                            navigateToLogin={() => navigateTo(Page.Login)}
                        />
                    } />
                    <Route path="blog/:postId" element={
                        <BlogPostDetailWrapper
                            userAddedPosts={userAddedPosts}
                            navigateTo={navigateTo}
                            isAuthenticated={isAuthenticated}
                            allComments={allComments}
                            onAddComment={handleAddComment}
                            onDeleteComment={handleDeleteComment}
                            isSuperUser={isSuperUser}
                            currentUserProfile={userProfile}
                        />
                    } />
                    <Route path="blog/category/:categoryKey" element={
                        <CategoryArchiveWrapper
                            allPosts={userAddedPosts}
                            navigateTo={navigateTo}
                            onDeletePosts={handleDeleteBlogPosts}
                            isAuthenticated={isAuthenticated}
                            isSuperUser={isSuperUser}
                            navigateToLogin={() => navigateTo(Page.Login)}
                        />
                    } />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="login" element={<LoginPageWrapper />} />
                    <Route path="register" element={<RegisterPageWrapper />} />
                    <Route path="account" element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <AccountPageWrapper
                                userProfile={userProfile}
                                onUpdateProfile={handleUpdateUserProfile}
                                onUpdateAvatar={handleUpdateAvatar}
                                isAuthenticated={isAuthenticated}
                            />
                        </ProtectedRoute>
                    } />
                    <Route path="blog/add" element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <SuperUserRoute isSuperUser={isSuperUser}>
                                <AddBlogPostPageWrapper
                                    navigateTo={navigateTo}
                                    onSave={handleSaveBlogPost}
                                    isAuthenticated={isAuthenticated}
                                    isSuperUser={isSuperUser}
                                    navigateToLogin={() => navigateTo(Page.Login)}
                                />
                            </SuperUserRoute>
                        </ProtectedRoute>
                    } />
                    <Route path="blog/edit/:postId" element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <SuperUserRoute isSuperUser={isSuperUser}>
                                <EditBlogPostWrapper
                                    userAddedPosts={userAddedPosts}
                                    navigateTo={navigateTo}
                                    onSave={handleSaveBlogPost}
                                    isAuthenticated={isAuthenticated}
                                    isSuperUser={isSuperUser}
                                    navigateToLogin={() => navigateTo(Page.Login)}
                                />
                            </SuperUserRoute>
                        </ProtectedRoute>
                    } />
                    <Route path="manage/photos" element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <SuperUserRoute isSuperUser={isSuperUser}>
                                <PhotoManagementPageWrapper
                                    portfolioItems={userAddedPortfolioItems}
                                    onDelete={handleDeletePortfolioItems}
                                    onAdd={handleAddPortfolioItem}
                                    onUpdate={handleUpdatePortfolioItem}
                                    navigateTo={navigateTo}
                                />
                            </SuperUserRoute>
                        </ProtectedRoute>
                    } />
                    <Route path="manage/posts" element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <SuperUserRoute isSuperUser={isSuperUser}>
                                <PostManagementPageWrapper
                                    posts={userAddedPosts}
                                    onDelete={handleDeleteBlogPosts}
                                    onAdd={handleAddBlogPost}
                                    onUpdate={handleUpdateBlogPost}
                                    navigateTo={navigateTo}
                                />
                            </SuperUserRoute>
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        )}
      </div>
  );
};

export default App;
