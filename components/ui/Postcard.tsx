// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入圖標組件
import { ChevronRightIcon } from 'lucide-react';
// 引入工具函數
import { stripMarkdown } from '../../utils';

// 組件屬性介面
interface PostcardProps {
  post: BlogPostData; // 文章數據
  navigateTo: (page: Page, data?: any) => void; // 導航函數
}

/**
 * 明信片風格的文章卡片組件。
 * 用於在輪播或其他佈局中以引人注目的方式展示文章。
 * 其樣式主要由 `index.html` 中的 `.postcard` 相關 class 定義。
 */
const Postcard: React.FC<PostcardProps> = ({ post, navigateTo }) => {
  const { t, i18n } = useTranslation();
  
  // 使用 useMemo 來緩存計算後的值，避免不必要的重算
  const { displayTitle, displayExcerpt } = React.useMemo(() => {
    // 根據語言選擇顯示的標題
    const title = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    // 根據語言選擇內容，並移除 Markdown 格式以生成純文字摘要
    const rawContent = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || '');
    const excerpt = stripMarkdown(rawContent);
    return { displayTitle: title, displayExcerpt: excerpt };
  }, [post, t, i18n.language]);

  // 處理卡片點擊事件
  const handleCardClick = () => navigateTo(Page.BlogPostDetail, post);
  
  return (
    // 使用 'postcard' class 來應用明信片風格的樣式
    <div className="postcard" onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}>
      {/* 背景圖片 */}
      <img src={post.imageUrl} alt={displayTitle} className="postcard-image" />
      {/* 漸變遮罩層 */}
      <div className="postcard-overlay" />
      {/* 內容區域 */}
      <div className="postcard-content">
        <h3 className="postcard-title">{displayTitle}</h3>
        <p className="postcard-excerpt">
          {displayExcerpt}
        </p>
        <div className="postcard-read-more">
          {t('blogPage.readMore')}
          <ChevronRightIcon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default Postcard;
