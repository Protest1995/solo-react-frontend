import React, { useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { Routes, Route, Outlet, useLocation, useNavigate, useParams, Navigate, matchPath, Link } from 'react-router-dom';
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
import Footer from './components/ui/Footer';
import { blogCategoryDefinitions } from './components/data/blogData';
import { NAVIGATION_ITEMS, AUTH_NAVIGATION_ITEMS } from './constants';
// AuthProvider 由 index.tsx 包裹，避免重複包裹導致重新掛載

// 引入靜態數據
import { ApiService } from './src/services/api';
import { useAuth } from './src/contexts/AuthContext';

// --- 新增 RightSidebar 所需的圖標 ---
import LinkedInIcon from './components/icons/LinkedInIcon';
import GithubIcon from './components/icons/GithubIcon';
import InstagramIcon from './components/icons/InstagramIcon';
import SettingsIcon from './components/icons/SettingsIcon';
import LoginIcon from './components/icons/LoginIcon';
import LogoutIcon from './components/icons/LogoutIcon';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';
import CloseIcon from './components/icons/CloseIcon';
import SuperUserIcon from './components/icons/SuperUserIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';
import PhotoIcon from './components/icons/PhotoIcon';
import DocumentTextIcon from './components/icons/DocumentTextIcon';
import UserIcon from './components/icons/UserIcon';
import LanguageIcon from './components/icons/LanguageIcon';

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

const PortfolioPageWrapper: React.FC<{
    navigateTo: (page: Page, data?: any) => void;
    isAuthenticated: boolean;
    isSuperUser: boolean;
    portfolioItems: PortfolioItemData[];
    onAddPortfolioItem: (item: PortfolioItemData) => void;
    onDeletePortfolioItems: (ids: string[]) => void;
    isLandscape: boolean;
}> = ({ navigateTo, isAuthenticated, isSuperUser, portfolioItems, onAddPortfolioItem, onDeletePortfolioItems, isLandscape }) => {
    return <PortfolioPage userAddedPortfolioItems={portfolioItems} onAddPortfolioItem={onAddPortfolioItem} onDeletePortfolioItems={onDeletePortfolioItems} isAuthenticated={isAuthenticated} isSuperUser={isSuperUser} navigateToLogin={() => navigateTo(Page.Login)} isLandscape={isLandscape} />;
};

const BlogPageWrapper: React.FC<{ 
    navigateTo: (page: Page, data?: any) => void; 
    isSuperUser: boolean; 
    allPosts: BlogPostData[];
    onDeletePosts: (ids: string[]) => void;
    isMobileView: boolean;
}> = ({ navigateTo, isSuperUser, allPosts, onDeletePosts, isMobileView }) => {
    return <BlogPage navigateTo={navigateTo} allPosts={allPosts} onDeletePosts={onDeletePosts} isSuperUser={isSuperUser} navigateToLogin={() => navigateTo(Page.Login)} isMobileView={isMobileView} />;
};

const BlogPostDetailWrapper: React.FC<{ 
    navigateTo: (page: Page, data?: any) => void; 
    isAuthenticated: boolean; 
    isSuperUser: boolean; 
    currentUserProfile: UserProfile; 
    allPosts: BlogPostData[];
    postDetailCache: { [key: string]: { post: BlogPostData; comments: Comment[] } };
    onUpdateCache: (postId: string, data: { post: BlogPostData; comments: Comment[] }) => void;
    isMobileView: boolean;
}> = ({ navigateTo, isAuthenticated, isSuperUser, currentUserProfile, allPosts, postDetailCache, onUpdateCache, isMobileView }) => {
    const { postId } = useParams();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    
    const [post, setPost] = useState<BlogPostData | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) return;

        // Check cache first
        if (postDetailCache[postId]) {
            const cachedData = postDetailCache[postId];
            setPost(cachedData.post);
            setComments(cachedData.comments);
            setLoading(false);
            return;
        }
        
        setLoading(true);
        (async () => {
            try {
                const [postData, commentsData] = await Promise.all([
                    ApiService.getPost(postId),
                    ApiService.getCommentsByPost(postId)
                ]);
                const validComments = Array.isArray(commentsData) ? commentsData : [];
                setPost(postData);
                setComments(validComments);
                onUpdateCache(postId, { post: postData, comments: validComments });
            } catch (e) {
                console.error("Failed to load post details", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [postId, postDetailCache, onUpdateCache]);
    
    useEffect(() => {
        if (post) {
            const title = i18n.language === 'zh-Hant' && post.titleZh ? post.titleZh : (post.title || t('blogPage.untitledPost'));
            document.title = title;
        }
    }, [post, i18n.language, t]);

    const handleAddComment = useCallback(async (postId: string, text: string, parentId: string | null = null) => {
        if (!isAuthenticated || !post) return;
        try {
            const created = await ApiService.addComment({ postId, text, parentId });
            const newComment: Comment = {
                id: created.id,
                postId: created.postId,
                userId: created.userId,
                username: created.username,
                avatarUrl: created.avatarUrl,
                date: created.date,
                text: created.text,
                parentId: created.parentId || null,
            };
            
            const newComments = [...comments, newComment];
            setComments(newComments);

            const updatedPost = {
                ...post,
                commentsCount: (post.commentsCount || 0) + 1,
            };
            setPost(updatedPost);

            onUpdateCache(postId, { post: updatedPost, comments: newComments });
        } catch (e) {
            console.error('Failed to add comment', e);
            alert('Failed to add comment, please try again.');
        }
    }, [isAuthenticated, post, comments, onUpdateCache]);

    const handleDeleteComment = useCallback(async (id: string) => {
        if (!isSuperUser || !post) return;
        try {
            await ApiService.deleteComment(id);
            
            const toDelete = new Set<string>([id]);
            const findChildren = (parentId: string) => {
                comments.filter(c => c.parentId === parentId).forEach(c => {
                    toDelete.add(c.id);
                    findChildren(c.id);
                });
            };
            findChildren(id);
            
            const remainingComments = comments.filter(c => !toDelete.has(c.id));
            setComments(remainingComments);

            const updatedPost = {
                ...post,
                commentsCount: Math.max(0, (post.commentsCount || 0) - toDelete.size),
            };
            setPost(updatedPost);

            onUpdateCache(post.id, { post: updatedPost, comments: remainingComments });
        } catch (e) {
            console.error('Failed to delete comment', e);
            alert('Failed to delete comment.');
        }
    }, [isSuperUser, post, comments, onUpdateCache]);

    if (loading) return null;
    if (!post) return <Navigate to="/blog" replace />;

    const originCategoryInfo = location.state?.fromCategory as CategoryInfo | null;

    return <BlogPostDetailPage post={post} allPosts={allPosts} comments={comments} navigateTo={navigateTo} isAuthenticated={isAuthenticated} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} isSuperUser={isSuperUser} currentUserProfile={currentUserProfile} originCategoryInfo={originCategoryInfo} isMobileView={isMobileView} />;
};


const CategoryArchiveWrapper: React.FC<{ 
    navigateTo: (page: Page, data?: any) => void; 
    isAuthenticated: boolean; 
    isSuperUser: boolean;
    allPosts: BlogPostData[];
    onDeletePosts: (ids: string[]) => void;
}> = ({ navigateTo, isAuthenticated, isSuperUser, allPosts, onDeletePosts }) => {
    const { categoryKey } = useParams();
    
    const categoryInfo = useMemo(() => {
        if (categoryKey === 'all') return { titleKey: 'portfolioPage.filterAll', categoryKeys: [], isEditable: true };
        return blogCategoryDefinitions.find(def => (def.titleKey.split('.').pop() || '') === categoryKey) || null;
    }, [categoryKey]);

    if (!categoryInfo) return <Navigate to="/blog" replace />;

    return <CategoryArchivePage categoryInfo={categoryInfo} allPosts={allPosts} navigateTo={navigateTo} onDeletePosts={onDeletePosts} isAuthenticated={isAuthenticated} isSuperUser={isSuperUser} navigateToLogin={() => navigateTo(Page.Login)} />;
};

const AccountPageWrapper: React.FC<any> = (props) => <AccountPage {...props} />;
const AddBlogPostPageWrapper: React.FC<any> = (props) => <AddBlogPostPage {...props} />;
const EditBlogPostWrapper: React.FC<any> = (props) => {
    const { postId } = useParams();
    const [postToEdit, setPostToEdit] = useState<BlogPostData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) return;
        (async () => {
            try {
                const post = await ApiService.getPost(postId);
                setPostToEdit(post);
            } catch (e) {
                console.error('Failed to load post for editing', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [postId]);

    if (loading) return null;
    if (!postToEdit) return <Navigate to="/blog" replace />;
    
    return <EditBlogPostPage postToEdit={postToEdit} {...props} />;
};
const PhotoManagementPageWrapper: React.FC<{
    navigateTo: (page: Page, data?: any) => void;
    portfolioItems: PortfolioItemData[];
    onAdd: (item: PortfolioItemData) => void;
    onUpdate: (item: PortfolioItemData) => void;
    onDelete: (ids: string[]) => void;
    isLandscape: boolean;
}> = (props) => {
    return <PhotoManagementPage {...props} />;
};
const PostManagementPageWrapper: React.FC<{
    navigateTo: (page: Page, data?: any) => void;
    posts: BlogPostData[];
    onAdd: (post: BlogPostData) => void;
    onUpdate: (post: BlogPostData) => void;
    onDelete: (ids: string[]) => void;
}> = (props) => {
    return <PostManagementPage {...props} />;
};


// 定義主題類型
type Theme = 'light' | 'dark';

// --- 新增：RightSidebar 組件 ---
interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigateTo: (page: Page, data?: any) => void;
  isAuthenticated: boolean;
  isSuperUser: boolean;
  handleLogout: () => void;
  currentTheme: Theme;
  toggleTheme: () => void;
  authLogout: () => Promise<void>;
  avatarUrl: string;
  username: string;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onClose,
  navigateTo,
  isAuthenticated,
  isSuperUser,
  handleLogout,
  currentTheme,
  toggleTheme,
  authLogout,
  avatarUrl,
  username
}) => {
  const { t, i18n } = useTranslation();
  const navItemTextColor = currentTheme === 'light' ? 'text-zinc-800' : 'text-theme-secondary';

  const handleNavigation = (page: Page) => {
    navigateTo(page);
    onClose();
  };
  
  const handleLogoutClick = async () => {
    try {
      await authLogout();
    } finally {
      handleLogout();
      onClose();
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh-Hant' : 'en');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="fixed top-16 right-0 bottom-0 w-80 bg-glass border-l border-theme-primary shadow-lg z-50 p-6 flex flex-col lg:hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            // Use a smooth tween to avoid spring bounce/shake when opening
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
          >
            
            <nav className="flex-grow flex flex-col space-y-2">
              {isAuthenticated && isSuperUser && (
                <>
                  <button
                    onClick={() => handleNavigation(Page.PhotoManagement)}
                    className={`w-full flex items-center py-2 px-3 rounded-md ${navItemTextColor} hover:bg-theme-hover hover:text-custom-cyan transition-colors`}
                  >
                    <PhotoIcon className="w-5 h-5 mr-3" />
                    <span>{t('sidebar.photoManagement')}</span>
                  </button>
                  <button
                    onClick={() => handleNavigation(Page.PostManagement)}
                    className={`w-full flex items-center py-2 px-3 rounded-md ${navItemTextColor} hover:bg-theme-hover hover:text-custom-cyan transition-colors`}
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-3" />
                    <span>{t('sidebar.postManagement')}</span>
                  </button>
                  <div className="border-t border-theme-primary my-2"></div>
                </>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => handleNavigation(Page.Account)}
                  className={`w-full flex items-center py-2 px-3 rounded-md ${navItemTextColor} hover:bg-theme-hover hover:text-custom-cyan transition-colors`}
                >
                  <SettingsIcon className="w-5 h-5 mr-3" />
                  <span>{t('sidebar.account')}</span>
                </button>
              )}
              
              {isAuthenticated ? (
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center py-2 px-3 rounded-md text-red-500 hover:bg-theme-hover hover:text-red-400 transition-colors"
                >
                  <LogoutIcon className="w-5 h-5 mr-3" />
                  <span>{t('sidebar.logout')}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNavigation(Page.Login)}
                  className="w-full flex items-center py-2 px-3 rounded-md text-custom-cyan hover:bg-theme-hover transition-colors"
                >
                  <LoginIcon className="w-5 h-5 mr-3" />
                  <span>{t('sidebar.login')}</span>
                </button>
              )}

              <div className="border-t border-theme-primary my-2"></div>

              <button
                  onClick={toggleLanguage}
                  className={`w-full flex items-center py-2 px-3 rounded-md ${navItemTextColor} hover:bg-theme-hover hover:text-custom-cyan transition-colors`}
              >
                  <LanguageIcon className="w-5 h-5 mr-3" />
                  <span>{i18n.language === 'en' ? '繁體中文' : 'English'}</span>
              </button>
              <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center py-2 px-3 rounded-md ${navItemTextColor} hover:bg-theme-hover hover:text-custom-cyan transition-colors`}
              >
                  {currentTheme === 'light' ? 
                    <MoonIcon className="w-5 h-5 mr-3" /> : 
                    <SunIcon className="w-5 h-5 mr-3" />
                  }
                  <span>{currentTheme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')}</span>
              </button>
            </nav>
            <div className="mt-auto pt-6 border-t border-theme-primary text-center">
                <div className="flex justify-center space-x-4 mb-4">
                    <a href="https://www.linkedin.com/in/jason-huang-831802164/" target="_blank" rel="noopener noreferrer" aria-label={t('sidebar.profileName') + " LinkedIn"} className="text-theme-primary transition-colors hover:text-custom-cyan"> <LinkedInIcon className="w-5 h-5" /> </a>
                    <a href="https://github.com/Protest1995" target="_blank" rel="noopener noreferrer" aria-label={t('sidebar.profileName') + " GitHub"} className="text-theme-primary transition-colors hover:text-custom-cyan"> <GithubIcon className="w-5 h-5" /> </a>
                    <a href="https://www.instagram.com/tatw800722519/" target="_blank" rel="noopener noreferrer" aria-label={t('sidebar.instagramAriaLabel')} className="text-theme-primary transition-colors hover:text-custom-cyan"> <InstagramIcon className="w-5 h-5" /> </a>
                </div>
                <p className={`text-xs whitespace-nowrap ${currentTheme === 'light' ? 'text-zinc-800' : 'text-theme-muted'}`}>
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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
  isAuthenticated: boolean;
  isSuperUser: boolean;
  username: string;
  email: string;
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
  toggleRightSidebar: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  isSidebarOpen, isMobileView, isAuthenticated, isSuperUser,
  username, email, avatarUrl, currentTheme, isSidebarCollapsed, showBackToTop,
  mobileHeaderClasses, glassEffectClass, mainContentClasses,
  toggleSidebar, closeSidebar, handleLogout, toggleTheme, toggleCollapse, navigateTo,
  toggleRightSidebar,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isBlogPage = location.pathname === '/blog';
  const [avatarImageError, setAvatarImageError] = useState(false);

  useEffect(() => {
    setAvatarImageError(false);
  }, [avatarUrl]);
  
  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && isMobileView && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <Sidebar
        navigateTo={navigateTo}
        isOpen={isSidebarOpen && isMobileView}
        closeSidebar={closeSidebar}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
        avatarUrl={avatarUrl}
        username={username}
        email={email}
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleCollapse}
        isSuperUser={isSuperUser}
        isMobileView={isMobileView}
      />
      <header className={`${mobileHeaderClasses} ${glassEffectClass}`}>
          <div className="container mx-auto px-6 h-full flex justify-between items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-2"
              aria-label={t('sidebar.toggleNavigation')}
            >
              <MenuIcon className={`w-6 h-6 ${currentTheme === 'light' ? 'text-theme-primary' : 'text-theme-secondary'}`} />
            </button>
            {isMobileView && (
                <button
                    onClick={toggleRightSidebar}
                    className="flex items-center"
                    aria-label={t('sidebar.openUserMenu', 'Open user menu')}
                >
                    <div className="profile-image-wrapper w-10 h-10">
                      <div className="profile-image-inner flex items-center justify-center">
                          {isAuthenticated && avatarUrl && !avatarImageError ? (
                              <img 
                                  src={avatarUrl} 
                                  alt={username} 
                                  className="w-full h-full object-cover rounded-full"
                                  onError={() => setAvatarImageError(true)}
                              />
                          ) : (
                              <UserIcon className="w-7 h-7 text-theme-secondary" />
                          )}
                      </div>
                    </div>
                </button>
            )}
          </div>
      </header>
      <main className={mainContentClasses}>
        <div className="p-6 md:p-12 min-h-screen flex flex-col">
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
  const { isAuthenticated, user, logout: authLogout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(getInitialSidebarCollapsed);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  const [appDataLoading, setAppDataLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<BlogPostData[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemData[]>([]);
  const [postDetailCache, setPostDetailCache] = useState<{ [key: string]: { post: BlogPostData; comments: Comment[] } }>({});

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: t('sidebar.profileName'),
    email: '',
    avatarUrl: '/images/profile.jpg',
    gender: 'NOT_SPECIFIED',
    birthday: '',
    address: '',
    phone: '',
  }); 
  
  const isSuperUser = isAuthenticated && ((user?.role === 'SUPER_USER') || (user?.role === 'ADMIN') || (user?.username === 'admin'));

  useEffect(() => {
      (async () => {
          try {
              const [postsData, portfolioData] = await Promise.all([
                  ApiService.request<BlogPostData[]>({ url: '/api/posts', method: 'GET' }),
                  ApiService.request<PortfolioItemData[]>({ url: '/api/portfolio', method: 'GET' })
              ]);
              setAllPosts(Array.isArray(postsData) ? postsData : []);
              setPortfolioItems(Array.isArray(portfolioData) ? portfolioData : []);
          } catch (e) {
              console.error('Failed to load initial app data', e);
          } finally {
              setAppDataLoading(false);
          }
      })();
  }, []);

  useEffect(() => { localStorage.setItem('theme', JSON.stringify(theme)); document.body.classList.remove('theme-light', 'theme-dark'); document.body.classList.add(`theme-${theme}`); }, [theme]);
  useEffect(() => { localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed)); }, [isSidebarCollapsed]);
  
  // Effect for handling window resize events to update view-related states.
  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyMobile = window.innerWidth < 1024;
      setIsMobileView(isCurrentlyMobile);
      setIsLandscape(isCurrentlyMobile && window.innerHeight < window.innerWidth);
      if (!isCurrentlyMobile && isSidebarOpen) {
        setIsSidebarOpen(false); // Close mobile sidebar on resize to desktop
      }
    };

    handleResize(); // Initial check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Effect for handling scroll events, throttled for performance.
  // Purpose: hide mobile header on scroll down, show on scroll up or when near top.
  useEffect(() => {
    let ticking = false;
  const THRESHOLD = 3; // minimum px change to consider as meaningful scroll (reduced for better sensitivity)

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!isMobileView) {
        // Desktop: always keep header visible
        setIsMobileHeaderVisible(true);
      } else {
        // Mobile: determine direction with a small threshold to avoid jitter
        const scrollDelta = currentScrollY - lastScrollY.current;

        if (currentScrollY < 50) {
          // Near top: always show
          setIsMobileHeaderVisible(true);
        } else if (scrollDelta > THRESHOLD) {
          // Scrolling down: hide
          setIsMobileHeaderVisible(false);
        } else if (scrollDelta < -THRESHOLD) {
          // Scrolling up: show
          setIsMobileHeaderVisible(true);
        }
      }

      // Update other scroll-dependent states
      setShowBackToTop(currentScrollY > 400);
      setIsScrolled(currentScrollY > 50);

      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial call to set states correctly on mount
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [isMobileView]); // Re-run this effect only when mobile view changes

  useEffect(() => {
    // Lock body scroll when either left or right sidebar is open on mobile
    if (isMobileView && (isSidebarOpen || isRightSidebarOpen)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isRightSidebarOpen, isMobileView]);

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
            { path: '/blog/category/:categoryKey', title: (params) => {
                if (params.categoryKey === 'all') return t('portfolioPage.filterAll');
                const categoryInfo = blogCategoryDefinitions.find(def => (def.titleKey.split('.').pop() || '') === params.categoryKey);
                return categoryInfo ? t(categoryInfo.titleKey) : t('blogPage.blog');
            }},
            { path: '/blog/edit/:postId', title: t('blogPage.editFormTitle') },
            { path: '/login', title: t('loginPage.title') },
            { path: '/register', title: t('registerPage.title') },
            { path: '/account', title: t('sidebar.account') },
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
  }, [location.pathname, t, i18n.language]);


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

  useEffect(() => { if (!isAuthenticated) setUserProfile(p => ({...p, username: t('sidebar.profileName'), email: ''})); }, [t, i18n.language, isAuthenticated]);
  useEffect(() => {
    if (user) {
      const mapGenderFromApi = (g?: 1 | 2): UserProfile['gender'] => {
        if (g === 1) return 'MALE';
        if (g === 2) return 'FEMALE';
        return 'NOT_SPECIFIED';
      };

      setUserProfile(prev => ({
        ...prev,
        username: user.username ?? prev.username,
        email: user.email ?? '',
        avatarUrl: user.avatarUrl ?? '/images/profile.jpg',
        gender: mapGenderFromApi(user.gender),
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
      gender: 'NOT_SPECIFIED',
      birthday: '',
      address: '',
      phone: '',
    });
    navigate('/');
  }, [navigate, t]);
  
  const handleUpdateUserProfile = useCallback((d: Partial<UserProfile>) => { if (!isAuthenticated) return; setUserProfile(p => ({...p, ...d})); }, [isAuthenticated]);
  const handleUpdateAvatar = useCallback((url: string) => { if (!isAuthenticated) return; setUserProfile(p => ({...p, avatarUrl: url})); }, [isAuthenticated]);
  
  const handleSaveBlogPost = useCallback((postData: BlogPostData) => {
    const isEditing = allPosts.some(p => p.id === postData.id);
    if (isEditing) {
        setAllPosts(prev => prev.map(p => p.id === postData.id ? postData : p));
    } else {
        setAllPosts(prev => [postData, ...prev]);
    }
    
    // 當文章被編輯後，我們需要清除其在詳情頁的快取，
    // 因為相關數據（特別是留言）可能已經過時。
    // 這樣做可以強制 BlogPostDetailPage 在下次訪問時從伺服器重新獲取最新數據。
    setPostDetailCache(prev => {
      const newCache = { ...prev };
      delete newCache[postData.id]; // 移除此文章的快取
      return newCache;
    });
  }, [allPosts]);

  const handleCancelEditBlogPost = useCallback((postData: BlogPostData) => {
    // 當取消編輯時，也清除詳情頁的快取。
    // 這很重要，因為用戶可能在詳情頁新增了留言，然後導航到編輯頁，最後又取消。
    // 如果不清除快取，返回詳情頁時會顯示沒有新留言的舊版本。
    setPostDetailCache(prev => {
      const newCache = { ...prev };
      delete newCache[postData.id];
      return newCache;
    });
    navigateTo(Page.BlogPostDetail, postData);
  }, [navigateTo]);


  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(p => {
      const nextState = !p;
      if (nextState) {
        setIsRightSidebarOpen(false);
      }
      return nextState;
    });
  }, []);
  const toggleRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(p => {
      const nextState = !p;
      if (nextState) {
        setIsSidebarOpen(false);
      }
      return nextState;
    });
  }, []);
  const closeRightSidebar = useCallback(() => setIsRightSidebarOpen(false), []);

  const handleDeletePosts = useCallback(async (ids: string[]) => {
    if (!isSuperUser) return;
    try {
        await Promise.all(ids.map(id => ApiService.deletePost(id)));
        setAllPosts(p => p.filter(post => !ids.includes(post.id)));
    } catch (error) {
        console.error('Failed to delete posts:', error);
        alert('Failed to delete posts, please try again.');
    }
  }, [isSuperUser]);
  
  const handleAddPost = useCallback((post: BlogPostData) => {
    if (!isSuperUser) return;
    setAllPosts(prev => [post, ...prev]);
  }, [isSuperUser]);

  const handleUpdatePost = useCallback((updatedPost: BlogPostData) => {
    if (!isSuperUser) return;
    setAllPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post));
  }, [isSuperUser]);

  const handleUpdatePostDetailCache = useCallback((postId: string, data: { post: BlogPostData; comments: Comment[] }) => {
      setPostDetailCache(prev => ({
          ...prev,
          [postId]: data
      }));
  }, []);

  const handleDeletePortfolioItems = useCallback(async (ids: string[]) => {
    if (!isSuperUser) return;
    try {
        await Promise.all(ids.map(id => ApiService.deletePortfolioItem(id)));
        setPortfolioItems(p => p.filter(i => !ids.includes(i.id)));
    } catch (error) {
        console.error('Failed to delete portfolio items:', error);
        alert('Failed to delete items, please try again.');
    }
  }, [isSuperUser]);

  const handleAddPortfolioItem = useCallback((item: PortfolioItemData) => {
    if (!isSuperUser) return;
    setPortfolioItems(prev => [item, ...prev]);
  }, [isSuperUser]);

  const handleUpdatePortfolioItem = useCallback((updatedItem: PortfolioItemData) => {
      if (!isSuperUser) return;
      setPortfolioItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, [isSuperUser]);

  const mainContentClasses = useMemo(() => {
    const isBlogHomepage = location.pathname === '/blog';
    const isBlogPostDetailPage = !!matchPath('/blog/:postId', location.pathname);

    let mobileTopPadding = 'pt-16'; // 手機視圖的預設值

    if (isMobileView) {
      // 決定是否啟用 Navbar 覆蓋效果 (即移除頂部內距)
      // 在部落格首頁：僅在直向模式下覆蓋
      // 在文章詳情頁：在所有方向下都覆蓋
      const hasOverlay = (isBlogHomepage && !isLandscape) || isBlogPostDetailPage;
      mobileTopPadding = hasOverlay ? '' : 'pt-16';
    }
    
    return `
      transition-all duration-300 ease-in-out
      ${isMobileView ? mobileTopPadding : (isSidebarCollapsed ? 'pl-20' : 'pl-80')}
    `;
  }, [isMobileView, isSidebarCollapsed, location.pathname, isLandscape]);
  
  const mobileHeaderClasses = `
    lg:hidden fixed top-0 left-0 right-0 z-50 h-16
  transform transition-transform duration-300 ease-in-out
    ${isMobileHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
  `;
  const glassEffectClass = (isScrolled || isMobileView) ? 'bg-glass border-b border-theme-primary' : '';
  
  if (appDataLoading) {
      return null;
  }

  return (
      <div className="bg-theme-primary text-theme-primary">
        <RightSidebar
            isOpen={isRightSidebarOpen}
            onClose={closeRightSidebar}
            navigateTo={navigateTo}
            isAuthenticated={isAuthenticated}
            isSuperUser={isSuperUser}
            handleLogout={handleLogout}
            currentTheme={theme}
            toggleTheme={toggleTheme}
            authLogout={authLogout}
            avatarUrl={userProfile.avatarUrl}
            username={userProfile.username}
        />
        <Routes>
            <Route path="/" element={
                <Layout
                    isSidebarOpen={isSidebarOpen}
                    isMobileView={isMobileView}
                    isAuthenticated={isAuthenticated}
                    isSuperUser={isSuperUser}
                    username={userProfile.username}
                    email={userProfile.email}
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
                    toggleRightSidebar={toggleRightSidebar}
                />
            }>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="resume" element={<ResumePage />} />
                <Route path="portfolio" element={
                    <PortfolioPageWrapper
                        navigateTo={navigateTo}
                        isAuthenticated={isAuthenticated}
                        isSuperUser={isSuperUser}
                        portfolioItems={portfolioItems}
                        onAddPortfolioItem={handleAddPortfolioItem}
                        onDeletePortfolioItems={handleDeletePortfolioItems}
                        isLandscape={isLandscape}
                    />
                } />
                <Route path="blog" element={
                    <BlogPageWrapper
                        navigateTo={navigateTo}
                        isSuperUser={isSuperUser}
                        allPosts={allPosts}
                        onDeletePosts={handleDeletePosts}
                        isMobileView={isMobileView}
                    />
                } />
                <Route path="blog/:postId" element={
                    <BlogPostDetailWrapper
                        navigateTo={navigateTo}
                        isAuthenticated={isAuthenticated}
                        isSuperUser={isSuperUser}
                        currentUserProfile={userProfile}
                        allPosts={allPosts}
                        postDetailCache={postDetailCache}
                        onUpdateCache={handleUpdatePostDetailCache}
                        isMobileView={isMobileView}
                    />
                } />
                <Route path="blog/category/:categoryKey" element={
                    <CategoryArchiveWrapper
                        navigateTo={navigateTo}
                        isAuthenticated={isAuthenticated}
                        isSuperUser={isSuperUser}
                        allPosts={allPosts}
                        onDeletePosts={handleDeletePosts}
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
                                navigateTo={navigateTo}
                                onSave={handleSaveBlogPost}
                                onCancel={handleCancelEditBlogPost}
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
                                navigateTo={navigateTo}
                                portfolioItems={portfolioItems}
                                onAdd={handleAddPortfolioItem}
                                onUpdate={handleUpdatePortfolioItem}
                                onDelete={handleDeletePortfolioItems}
                                isLandscape={isLandscape}
                             />
                        </SuperUserRoute>
                    </ProtectedRoute>
                } />
                <Route path="manage/posts" element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <SuperUserRoute isSuperUser={isSuperUser}>
                            <PostManagementPageWrapper 
                                navigateTo={navigateTo}
                                posts={allPosts}
                                onAdd={handleAddPost}
                                onUpdate={handleUpdatePost}
                                onDelete={handleDeletePosts}
                            />
                        </SuperUserRoute>
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
      </div>
  );
};

export default App;