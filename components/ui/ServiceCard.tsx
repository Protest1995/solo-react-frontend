// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { ServiceItem } from '../../types';

/**
 * 服務卡片組件。
 * 用於在 "關於我" 頁面展示單個服務項目或興趣愛好。
 * 卡片具有一個在懸停時會旋轉的動畫邊框效果。
 * 其樣式主要由 `index.html` 中的 `.service-card-wrapper` 和 `.service-card-inner` class 定義。
 */
const ServiceCard: React.FC<ServiceItem> = ({ icon, titleKey, descriptionKey }) => {
  const { t } = useTranslation();

  return (
    // 'service-card-wrapper' class 應用了在 index.html 中定義的動畫邊框樣式
    <div className="service-card-wrapper h-full shadow-lg">
      <div className="service-card-inner p-6 text-center flex flex-col items-center">
        {icon}
        <h4 className="text-xl font-semibold text-theme-primary mb-2">{t(titleKey)}</h4>
        <p className="text-theme-secondary text-sm leading-relaxed">{t(descriptionKey)}</p>
      </div>
    </div>
  );
};

export default ServiceCard;
