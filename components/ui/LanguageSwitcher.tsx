// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入樣式常數
import { ACCENT_FOCUS_VISIBLE_RING_CLASS } from '../../constants';

// 組件屬性介面
interface LanguageSwitcherProps {
  isCollapsed?: boolean; // 側邊欄是否處於收合狀態
}

/**
 * 語言切換器組件。
 * 提供一個按鈕，用於在中英文之間切換應用程式的語言。
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isCollapsed }) => {
  // 使用翻譯鉤子
  const { i18n, t } = useTranslation();

  // 切換語言的函數
  const toggleLanguage = () => {
    // 判斷當前語言並切換到另一種語言
    const newLang = i18n.language === 'en' ? 'zh-Hant' : 'en';
    i18n.changeLanguage(newLang);
  };

  // 根據當前語言決定按鈕上顯示的文本
  const buttonText = i18n.language === 'en' ? t('switchToChinese') : t('switchToEnglish');

  return (
    <button
      onClick={toggleLanguage}
      className={`flex-1 px-3 py-1.5 text-sm button-theme-neutral rounded-full transition-all duration-300 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-center'}`}
      aria-label={buttonText}
      // 在收合模式下，使用 title 屬性提供完整的提示，當用戶懸停時顯示
      title={isCollapsed ? buttonText : undefined}
    >
      {/* 可以在此處添加圖標，例如一個地球圖標 */}
      
      {/* 
        在收合模式下，只顯示一個字符（中/E）或圖標。
        在展開模式下，顯示完整的按鈕文本。
        這裡的實現是只在展開模式下顯示文本。
      */}
      <span className={`${isCollapsed ? 'lg:hidden' : ''}`}>{buttonText}</span>
    </button>
  );
};

export default LanguageSwitcher;
