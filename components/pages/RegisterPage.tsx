
import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SectionTitle from '../ui/SectionTitle';
import { Page } from '../../types';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS, ACCENT_COLOR } from '../../constants';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import UserPlusIcon from '../icons/UserPlusIcon';
import { useAuth } from '../../src/contexts/AuthContext';
import { ApiError } from '../../src/services/http';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import RainEffect from '../ui/RainEffect';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 定義主題的類型
type Theme = 'light' | 'dark';

// 定義 RegisterPage 組件的屬性介面
interface RegisterPageProps {}

/**
 * 註冊頁面組件 (RegisterPage)。
 * 負責處理新用戶的註冊流程。
 * - 使用 `useAuth` 上下文來觸發註冊操作。
 * - 提供用戶名、Email、密碼和確認密碼的輸入欄位。
 * - 包含客戶端驗證，如密碼匹配和用戶名長度。
 * - 能夠處理並顯示來自後端的特定錯誤（例如，用戶名或 Email 已存在）。
 */
const RegisterPage: React.FC<RegisterPageProps> = () => {
  // --- 鉤子 (Hooks) ---
  const { t } = useTranslation();
  // 從 AuthContext 中獲取註冊函數、錯誤訊息和錯誤清理函數
  const { register, error: authError, clearError } = useAuth();
  
  // --- 狀態管理 (useState) ---
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 控制密碼是否可見
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 控制確認密碼是否可見
  const [error, setError] = useState<string | null>(null); // 通用錯誤消息
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // 註冊成功消息
  const [isSubmitting, setIsSubmitting] = useState(false); // 標記表單是否正在提交中
  const [usernameError, setUsernameError] = useState<string | null>(null); // 用戶名相關的特定錯誤
  const [emailError, setEmailError] = useState<string | null>(null); // Email 相關的特定錯誤
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

  // 組件掛載時，清空可能從其他頁面遺留的錯誤狀態
  useEffect(() => {
    setError(null);
    setUsernameError(null);
    setEmailError(null);
    setSuccessMessage(null);
    // 返回一個清理函數，在組件卸載時調用
    return () => {
      clearError();
    };
  }, [clearError]);

  // 當從 AuthContext 來的 `authError` 改變時，將其分類並更新到對應的錯誤狀態。
  // 這使得我們可以將後端返回的錯誤訊息顯示在對應的輸入框下方。
  useEffect(() => {
    if (!authError) return;
    const msg = authError;
    if (/用戶名.*已存在|Username already exists/i.test(msg)) {
      setUsernameError(msg);
      setEmailError(null);
      setError(null);
      return;
    }
    if (/郵箱.*已被使用|郵箱已存在|Email already exists/i.test(msg)) {
      setEmailError(msg);
      setUsernameError(null);
      setError(null);
      return;
    }
    setError(msg); // 如果是其他類型的錯誤，則設為通用錯誤
  }, [authError]);

  // --- 處理函數 ---

  /**
   * 處理表單提交事件。
   * @param {FormEvent<HTMLFormElement>} event - 表單提交事件對象。
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 阻止頁面刷新
    // 每次提交前重置所有錯誤和成功消息
    setError(null);
    setUsernameError(null);
    setEmailError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    // 客戶端驗證
    if (username.length < 3) {
      setUsernameError('使用者名稱至少需要3個字元');
      setIsSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setError(t('registerPage.passwordsDoNotMatchError'));
      setIsSubmitting(false);
      return;
    }

    try {
      // 調用 AuthContext 中的 `register` 函數
      const ok = await register({
        username,
        email,
        password,
        confirmPassword,
      });
      if (ok) {
        setSuccessMessage(t('registerPage.registrationSuccessMessage'));
        // 註冊成功後，通常後端會自動登入。這裡直接刷新頁面到首頁，
        // 確保整個應用程式狀態（包括側邊欄）都得到正確更新。
        window.location.href = '/';
      } else if (authError) {
        // 如果 `register` 返回 false，則顯示來自 Context 的錯誤
        setError(authError);
      }
    } catch (err: unknown) {
      // 處理 API 或其他異常錯誤
      if (err instanceof ApiError) {
        const m = err.message || '';
        // 再次檢查錯誤訊息以進行特定欄位的錯誤提示
        if (/用戶名.*已存在|Username already exists/i.test(m)) {
          setUsernameError(m);
        } else if (/郵箱.*已被使用|郵箱已存在|Email already exists/i.test(m)) {
          setEmailError(m);
        } else {
          setError(m);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('註冊失敗');
      }
    } finally {
        setIsSubmitting(false); // 確保提交狀態被重置
    }
  };

  // --- 渲染 (JSX) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden -m-6 md:-m-12">
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: "url('/images/home-bg.jpg')", 
          zIndex: 0,
          filter: currentTheme === 'light' ? 'grayscale(100%) brightness(1.5)' : 'none',
          opacity: currentTheme === 'light' ? 0.2 : 0.1,
        }} 
      />
      <div 
        className={`absolute inset-0 bg-theme-primary`} 
        style={{ 
          zIndex: 0, 
          opacity: currentTheme === 'light' ? 0.3 : 0.7 
        }} 
      />
      <RainEffect />

      <div className="relative z-10 w-full max-w-md mx-auto space-y-8 p-4">
        <motion.div {...sectionDelayShow(0)}>
          <SectionTitle titleKey="registerPage.title" subtitleKey="registerPage.subtitle" />
        </motion.div>

        <motion.div className="bg-glass border border-theme-primary p-8 rounded-lg shadow-xl" {...sectionDelayShow(0.2)}>
          <motion.form onSubmit={handleSubmit} className="space-y-6" variants={staggerContainerVariants(0.07)} initial="initial" animate="animate">
            {/* 用戶名輸入 */}
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="reg-username" className="block text-sm font-medium text-theme-secondary mb-1">{t('registerPage.usernameLabel')}</label>
              <input type="text" id="reg-username" value={username} onChange={(e) => { setUsername(e.target.value); if (usernameError) setUsernameError(null); }} required minLength={3} className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('registerPage.usernamePlaceholder')} autoComplete="username" />
              {usernameError && ( <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-1 flex items-center" role="alert"> <span className="mr-1">⚠️</span> {usernameError} </motion.p> )}
            </motion.div>

            {/* Email 輸入 */}
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="reg-email" className="block text-sm font-medium text-theme-secondary mb-1">{t('registerPage.emailLabel')}</label>
              <input type="email" id="reg-email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('registerPage.emailPlaceholder')} autoComplete="email" />
              {emailError && ( <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-1 flex items-center" role="alert"> <span className="mr-1">⚠️</span> {emailError} </motion.p> )}
            </motion.div>

            {/* 密碼輸入 */}
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="reg-password" className="block text-sm font-medium text-theme-secondary mb-1">{t('registerPage.passwordLabel')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} required minLength={6} className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('registerPage.passwordPlaceholder')} autoComplete="new-password" />
                <AnimatePresence>
                  {(isPasswordFocused || password) && ( <motion.button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label={showPassword ? 'Hide password' : 'Show password'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}> {showPassword ? (<EyeSlashIcon className="h-5 w-5 text-custom-cyan" />) : (<EyeIcon className="h-5 w-5 text-custom-cyan" />)} </motion.button> )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 確認密碼輸入 */}
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-theme-secondary mb-1">{t('registerPage.confirmPasswordLabel')}</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} id="reg-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setIsConfirmPasswordFocused(true)} onBlur={() => setIsConfirmPasswordFocused(false)} required minLength={6} className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('registerPage.confirmPasswordPlaceholder')} autoComplete="new-password" />
                <AnimatePresence>
                  {(isConfirmPasswordFocused || confirmPassword) && ( <motion.button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}> {showConfirmPassword ? (<EyeSlashIcon className="h-5 w-5 text-custom-cyan" />) : (<EyeIcon className="h-5 w-5 text-custom-cyan" />)} </motion.button> )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 通用錯誤訊息顯示 */}
            {(!usernameError && !emailError && (error || authError)) && ( <motion.p variants={fadeInUpItemVariants} className="text-red-400 text-sm text-center flex items-center justify-center" role="alert"> <span className="mr-1">⚠️</span> {error ?? authError} </motion.p> )}
            {/* 成功訊息顯示 */}
            {successMessage && ( <motion.p variants={fadeInUpItemVariants} className="text-green-400 text-sm text-center" role="alert"> {successMessage} </motion.p> )}

            {/* 提交按鈕 */}
            <motion.div variants={fadeInUpItemVariants}>
              <button type="submit" disabled={isSubmitting} className={`w-full btn-login-neon font-semibold py-3 px-6 rounded-full flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed`}>
                <UserPlusIcon className="w-5 h-5 mr-2" />
                {isSubmitting ? t('registerPage.registeringButton') : t('registerPage.registerButton')}
              </button>
            </motion.div>
          </motion.form>

          {/* 導航到登入頁面的連結 */}
          <motion.div className="mt-6 text-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
            <Link to="/login" className={`text-sm text-custom-cyan hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-secondary focus:ring-custom-cyan rounded`}>
              {t('registerPage.alreadyHaveAccountLink')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
