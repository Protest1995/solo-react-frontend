// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入樣式常數
import { ACCENT_SOLID_BG_COLOR } from '../../constants';

// 組件屬性介面
interface SectionTitleProps {
  titleKey: string; // 標題的翻譯鍵
  subtitleKey?: string; // 副標題的翻譯鍵 (可選), 用於靜態文字
  subtitle?: string; // 直接傳入副標題文字 (可選), 用於動態文字
  titleColorClass?: string;
  subtitleColorClass?: string;
}

/**
 * 區塊標題組件。
 * 用於在頁面中創建一個標準化的、帶有裝飾性下劃線的標題。
 * 這有助於保持整個應用程式視覺風格的一致性。
 * 現在支持通過 `subtitleKey` (用於翻譯) 或 `subtitle` (直接傳入字符串) 兩種方式提供副標題。
 */
const SectionTitle: React.FC<SectionTitleProps> = ({ titleKey, subtitleKey, subtitle, titleColorClass, subtitleColorClass }) => {
  const { t } = useTranslation();
  
  // 決定最終要顯示的副標題。優先使用直接傳入的 `subtitle` 字符串。
  const finalSubtitle = subtitle || (subtitleKey ? t(subtitleKey) : undefined);

  return (
    <div className="text-center md:text-left">
      <h2 className={`text-3xl md:text-4xl font-bold relative inline-block ${titleColorClass || 'text-theme-primary'}`}>
        {t(titleKey)}
        {/* 裝飾性下劃線 */}
        <span className={`absolute -bottom-2 left-0 w-16 h-1 ${ACCENT_SOLID_BG_COLOR}`}></span>
      </h2>
      {/* 如果提供了副標題，則渲染副標題 */}
      {finalSubtitle && <p className={`mt-3 text-lg ${subtitleColorClass || 'text-theme-secondary'}`}>{finalSubtitle}</p>}
    </div>
  );
};

export default SectionTitle;