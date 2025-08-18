// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';

// 組件屬性介面
interface FeaturedPostSecondaryProps {
  post: BlogPostData; // 文章數據
  navigateTo: (page: Page, data?: any) => void; // 導航函數
}

/**
 * 次要的特色文章卡片組件。
 * 風格與主要特色文章卡片類似，但通常用於尺寸較小或重要性次之的場景。
 * 這裡的設計較為簡潔，只在中間顯示標題，營造一種焦點感。
 * 其樣式主要由 `index.html` 中的 `.postcard` 相關 class 定義。
 */
const FeaturedPostSecondary: React.FC<FeaturedPostSecondaryProps> = ({ post, navigateTo }) => {
  const { t, i18n } = useTranslation();

  // 使用 useMemo 來緩存顯示的標題，避免不必要的重算
  const displayTitle = React.useMemo(() => {
    // 根據語言選擇顯示的標題
    return ((i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : post.title || t('blogPage.untitledPost'));
  }, [post, t, i18n.language]);

  // 處理卡片點擊事件
  const handleCardClick = () => navigateTo(Page.BlogPostDetail, post);
  
  return (
    // 使用 'postcard' class 來應用明信片風格的樣式
    <div className="postcard h-full min-h-[30rem]" onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}>
      {/* 背景圖片 */}
      <img src={post.imageUrl} alt={displayTitle} className="postcard-image" />
      {/* 漸變遮罩層 */}
      <div className="postcard-overlay" />
      {/* 內容區域，使用 my-auto 使其在垂直方向上居中 */}
      <div className="postcard-content my-auto">
        <h3 className="postcard-title text-center mb-0">{displayTitle}</h3>
      </div>
    </div>
  );
};

export default FeaturedPostSecondary;
