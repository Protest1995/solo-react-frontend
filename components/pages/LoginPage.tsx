import React, { useState, FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SectionTitle from '../ui/SectionTitle';
import { Page } from '../../types';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import { sectionDelayShow, staggerContainerVariants, fadeInItemVariants } from '../../animationVariants';
import LoginIcon from '../icons/LoginIcon';
import SocialLoginButton from '../ui/SocialLoginButton';
import { ApiService } from '../../src/services/api';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import { useAuth } from '../../src/contexts/AuthContext';
import RainEffect from '../ui/RainEffect';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 定義主題的類型
type Theme = 'light' | 'dark';

/**
 * 登入頁面組件 (LoginPage)。
 * 負責處理用戶的身份驗證流程。
 * - 使用 `useAuth` 上下文來觸發登入操作和管理認證狀態。
 * - 提供用戶名和密碼輸入。
 * - 包含社交媒體登入選項（Google, Facebook）。
 * - 處理並顯示登入過程中的錯誤。
 */
const LoginPage: React.FC = () => {
  // --- 鉤子 (Hooks) ---
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 從 AuthContext 中獲取登入、註冊、錯誤清理、認證狀態和錯誤訊息等函數與狀態
  const { login, clearError, isAuthenticated, error: authError } = useAuth() as any;
  
  // --- 狀態管理 (useState) ---
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false); // 控制密碼是否可見
  const [isPasswordFocused, setIsPasswordFocused] = useState(false); // 控制密碼可見性圖標的顯示
  const [error, setError] = useState<string | null>(null); // 本地錯誤狀態，用於顯示UI反饋
  const [isSubmitting, setIsSubmitting] = useState(false); // 標記表單是否正在提交中
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark'); // 追蹤當前應用的主題（淺色或深色）

  // --- 副作用 (useEffect) ---

  // 監聽 <body> 的 class 變化以同步 `currentTheme` 狀態。
  useEffect(() => {
    const updateThemeFromBody = () => {
      const themeClass = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      setCurrentTheme(themeClass);
    };
    
    updateThemeFromBody(); // 組件掛載時立即檢查一次

    const observer = new MutationObserver(updateThemeFromBody);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // 組件掛載時執行：
  // 1. 清除 AuthContext 中可能殘留的舊錯誤。
  // 2. 如果用戶已經登入，則直接導航到首頁，避免重複登入。
  useEffect(() => {
    clearError();
    setError(null);
    if (isAuthenticated) {
      navigate('/');
    }
    // 組件卸載時再次清除錯誤，確保狀態乾淨
    return () => clearError();
  }, [clearError, isAuthenticated, navigate]);

  // 當從 AuthContext 來的 `authError` 改變時，將其同步到本地的 `error` 狀態。
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // --- 處理函數 ---
  
  /**
   * 處理表單輸入框的變化。
   * @param {React.ChangeEvent<HTMLInputElement>} e - 輸入事件對象。
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
    
    if (error || authError) {
      clearError();
      setError(null);
    }
  };

  /**
   * 處理表單提交事件。
   * @param {FormEvent<HTMLFormElement>} event - 表單提交事件對象。
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 阻止頁面刷新
    setError(null);
    clearError();
    setIsSubmitting(true);
    
    try {
      const ok = await login({
        username: formData.username,
        password: formData.password
      });
      
      if (ok) {
        navigate('/');
      }
    } catch (err) {
      console.error('Unexpected error during login submission:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false); // 確保提交狀態被重置
    }
  };

  // --- 渲染 (JSX) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden -m-6 md:-m-12">
        {/* 背景圖 */}
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ 
            backgroundImage: "url('/images/home-bg.jpg')", 
            zIndex: 0,
            filter: currentTheme === 'light' ? 'grayscale(100%) brightness(1.5)' : 'none',
            opacity: currentTheme === 'light' ? 0.2 : 0.1,
          }} 
        />
        {/* 主題顏色遮罩層 */}
        <div 
          className={`absolute inset-0 bg-theme-primary`} 
          style={{ 
            zIndex: 0, 
            opacity: currentTheme === 'light' ? 0.3 : 0.7 
          }} 
        />
        {/* 下雨效果 */}
        <RainEffect />

        <div className="relative z-10 w-full max-w-md mx-auto space-y-8 p-4">
            <motion.div {...sectionDelayShow(0)}>
                <SectionTitle titleKey="loginPage.title" subtitleKey="loginPage.subtitle" />
            </motion.div>

            <motion.div className="bg-glass border border-theme-primary p-8 rounded-lg shadow-xl" {...sectionDelayShow(0.2)}>
                <motion.form onSubmit={handleSubmit} className="space-y-6" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
                {/* 用戶名輸入 */}
                <motion.div variants={fadeInItemVariants}>
                    <label htmlFor="username" className="block text-sm font-medium text-theme-secondary mb-1">{t('loginPage.usernameLabel')}</label>
                    <input autoFocus type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('loginPage.usernamePlaceholder')} autoComplete="username" />
                </motion.div>

                {/* 密碼輸入 */}
                <motion.div variants={fadeInItemVariants}>
                    <label htmlFor="password_id" className="block text-sm font-medium text-theme-secondary mb-1">{t('loginPage.passwordLabel')}</label>
                    <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} id="password_id" name="password" value={formData.password} onChange={handleInputChange} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('loginPage.passwordPlaceholder')} autoComplete="current-password" />
                    <AnimatePresence>
                        {(isPasswordFocused || formData.password) && (
                        <motion.button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label={showPassword ? 'Hide password' : 'Show password'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            {showPassword ? (<EyeSlashIcon className="h-5 w-5 text-custom-cyan" />) : (<EyeIcon className="h-5 w-5 text-custom-cyan" />)}
                        </motion.button>
                        )}
                    </AnimatePresence>
                    </div>
                </motion.div>

                {/* 錯誤訊息顯示 */}
                {error && (
                    <motion.p variants={fadeInItemVariants} className="text-red-500 text-sm text-center" role="alert">
                    {error}
                    </motion.p>
                )}

                {/* 提交按鈕 */}
                <motion.div variants={fadeInItemVariants}>
                  <button type="submit" disabled={isSubmitting} className={`w-full btn-login-neon font-semibold py-3 px-6 rounded-full flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed`}>
                    <LoginIcon className="w-5 h-5 mr-2" />
                    {isSubmitting ? t('loginPage.loggingInButton') : t('loginPage.loginButton')}
                  </button>
                </motion.div>
                </motion.form>

                {/* 分隔線 */}
                <motion.div className="my-6 flex items-center" variants={fadeInItemVariants} initial="initial" animate="animate">
                <hr className="flex-grow border-t border-theme-primary" />
                <span className="mx-4 text-xs text-theme-muted uppercase font-semibold">{t('loginPage.orDivider')}</span>
                <hr className="flex-grow border-t border-theme-primary" />
                </motion.div>
                
                {/* 社交登入按鈕 */}
                <motion.div className="space-y-3" variants={staggerContainerVariants(0.1, 0.3)} initial="initial" animate="animate">
                <motion.div variants={fadeInItemVariants}>
                    <SocialLoginButton provider="google" onClick={() => {
                      try {
                        const base = ApiService.getAuthBaseUrl();
                        try { console.debug('Prod social redirect base:', base); } catch (e) {}
                        window.location.href = `${base}/oauth2/authorization/google`;
                      } catch (e) {
                        console.error('Failed to start social login (google):', e);
                      }
                    }} textKey="loginPage.signInWithGoogle" />
                </motion.div>
                <motion.div variants={fadeInItemVariants}>
                    <SocialLoginButton provider="facebook" onClick={() => {
                      try {
                        const base = ApiService.getAuthBaseUrl();
                        try { console.debug('Prod social redirect base:', base); } catch (e) {}
                        window.location.href = `${base}/oauth2/authorization/facebook`;
                      } catch (e) {
                        console.error('Failed to start social login (facebook):', e);
                      }
                    }} textKey="loginPage.signInWithFacebook" />
                </motion.div>
                <motion.div variants={fadeInItemVariants}>
                    <SocialLoginButton provider="github" onClick={() => {
                      try {
                        const base = ApiService.getAuthBaseUrl();
                        try { console.debug('Prod social redirect base:', base); } catch (e) {}
                        window.location.href = `${base}/oauth2/authorization/github`;
                      } catch (e) {
                        console.error('Failed to start social login (github):', e);
                      }
                    }} textKey="loginPage.signInWithGithub" />
                </motion.div>
                </motion.div>

                {/* 導航到註冊頁面的連結 */}
                <motion.div className="mt-6 text-center" variants={fadeInItemVariants} initial="initial" animate="animate">
                <Link to="/register" className={`text-sm text-custom-cyan hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-secondary focus:ring-custom-cyan rounded`}>
                    {t('loginPage.dontHaveAccountLink')}
                </Link>
                </motion.div>
            </motion.div>
        </div>
    </div>
  );
};

export default LoginPage;