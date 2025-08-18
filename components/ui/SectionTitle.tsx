// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入樣式常數
import { ACCENT_SOLID_BG_COLOR } from '../../constants';

// 組件屬性介面
interface SectionTitleProps {
  titleKey: string; // 標題的翻譯鍵
  subtitleKey?: string; // 副標題的翻譯鍵 (可選)
}

/**
 * 區塊標題組件。
 * 用於在頁面中創建一個標準化的、帶有裝飾性下劃線的標題。
 * 這有助於保持整個應用程式視覺風格的一致性。
 */
const SectionTitle: React.FC<SectionTitleProps> = ({ titleKey, subtitleKey }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center md:text-left">
      <h2 className="text-3xl md:text-4xl font-bold text-theme-primary relative inline-block">
        {t(titleKey)}
        {/* 裝飾性下劃線 */}
        <span className={`absolute -bottom-2 left-0 w-16 h-1 ${ACCENT_SOLID_BG_COLOR}`}></span>
      </h2>
      {/* 如果提供了副標題鍵，則渲染副標題 */}
      {subtitleKey && <p className="mt-3 text-theme-secondary text-lg">{t(subtitleKey)}</p>}
    </div>
  );
};

export default SectionTitle;
