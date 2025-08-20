// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入圖標組件
import GoogleIcon from '../icons/GoogleIcon';
import FacebookIcon from '../icons/FacebookIcon';
import GithubIcon from '../icons/GithubIcon';
// 引入類型定義
import { SocialLoginProvider } from '../../types';

// 組件屬性介面
interface SocialLoginButtonProps {
  provider: SocialLoginProvider; // 社交媒體提供商 ('google' | 'facebook' | 'github')
  onClick: () => void; // 點擊事件的回調
  textKey: string; // 用於按鈕文本的翻譯鍵
}

/**
 * 社交媒體登入按鈕組件。
 * 根據傳入的 `provider` 屬性，渲染對應的 Google 或 Facebook 登入按鈕樣式。
 * 其樣式主要由 `index.html` 中的 `.btn-google` 和 `.btn-facebook` class 定義。
 */
const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onClick, textKey }) => {
  const { t } = useTranslation();

  // 共享的基礎 CSS class
  const baseClasses = `w-full flex items-center justify-center py-2.5 px-4 rounded-md transition-colors duration-200 ease-in-out text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-secondary focus:ring-custom-cyan`;

  if (provider === 'facebook') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} btn-facebook`}
        aria-label={t(textKey)}
      >
        <FacebookIcon className="w-5 h-5 mr-3" />
        {t(textKey)}
      </button>
    );
  }

  if (provider === 'github') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} btn-github`}
        aria-label={t(textKey)}
      >
        <GithubIcon className="w-5 h-5 mr-3" />
        {t(textKey)}
      </button>
    );
  }

  // 默認為 Google 按鈕
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} btn-google`}
      aria-label={t(textKey)}
    >
      <GoogleIcon className="w-5 h-5 mr-3" />
      {t(textKey)}
    </button>
  );
};

export default SocialLoginButton;
