// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入圖標組件
import ChevronRightIcon from '../icons/ChevronRightIcon';
// 引入工具函數
import { stripMarkdown } from '../../utils';

/**
 * 根據分類鍵獲取對應的 CSS class。
 * 這使得不同分類的文章可以有不同的顏色標籤。
 * @param {string | undefined} categoryKey - 分類鍵。
 * @returns {string} - 對應的背景色 CSS class。
 */
const getCategoryClass = (categoryKey?: string): string => {
  if (!categoryKey) return 'bg-gray-500'; // 預設顏色
  // 從翻譯鍵中提取分類名稱
  const categoryName = categoryKey.split('.').pop()?.replace('category', '').toLowerCase() || 'default';
  // 映射到 CSS class 名稱
  const categoryMap: { [key: string]: string } = {
      fashion: 'fashion',
      lifestyle: 'lifestyle',
      music: 'music',
      nature: 'nature',
      portraits: 'portraits',
      studio: 'studio',
      hot: 'hot',
      adventure: 'adventure',
      travel: 'travel',
      sports: 'sports',
  };
  const finalCategory = categoryMap[categoryName] || 'lifestyle';
  return `bg-category-${finalCategory}`;
};

// 組件屬性介面
interface RecentPostItemProps {
  post: BlogPostData; // 文章數據
  onClick: () => void; // 點擊事件的回調
}

/**
 * 最近文章項目組件。
 * 用於在側邊欄、跑馬燈或其他列表中顯示文章的簡潔摘要。
 */
const RecentPostItem: React.FC<RecentPostItemProps> = ({ post, onClick }) => {
  const { t, i18n } = useTranslation();

  // 使用 useMemo 來緩存計算後的值，避免不必要的重算
  const { displayTitle, displayExcerpt, displayDate, categoryText, categoryClass } = React.useMemo(() => {
    // 根據語言選擇顯示的標題
    const title = (i18n.language === 'zh-Hant' && post.titleZh ? post.titleZh : post.title || t('blogPage.untitledPost'));
    // 根據語言選擇內容，並移除 Markdown 格式以生成純文字摘要
    const rawContent = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || '');
    const excerpt = stripMarkdown(rawContent);
    
    // 格式化日期
    const date = new Date(post.date).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // 獲取分類文本和對應的 class
    const catText = post.categoryKey ? t(post.categoryKey) : '';
    const catClass = getCategoryClass(post.categoryKey);

    return { displayTitle: title, displayExcerpt: excerpt, displayDate: date, categoryText: catText, categoryClass: catClass };
  }, [post, t, i18n.language]);

  return (
    <div className="group h-full">
      <div className="bg-theme-secondary rounded-lg h-full transition-all duration-300 ease-in-out shadow-lg group-hover:shadow-2xl border border-theme-primary flex flex-col group-hover:-translate-y-1 transform-preserve-3d">
        <div
          className="relative h-40 rounded-t-lg overflow-hidden cursor-pointer"
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
          aria-label={`Read more about ${displayTitle}`}
        >
          {/* 背景圖片，帶懸停放大效果 */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-300 transform-gpu group-hover:scale-105"
            style={{ backgroundImage: `url(${post.imageUrl})` }}
          ></div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-center space-x-4 mb-2">
            <p className="text-xs text-theme-secondary font-medium">{displayDate}</p>
            {categoryText && (
              <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded-full ${categoryClass}`}>
                {categoryText}
              </span>
            )}
          </div>
          <h3 
            className="text-lg font-bold text-theme-primary mb-1.5 leading-snug hover:text-link-accent transition-colors cursor-pointer"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
          >
            {displayTitle}
          </h3>
          <p className="text-sm text-theme-secondary flex-grow mb-3 line-clamp-2">
            {displayExcerpt}
          </p>
          <div className="mt-auto pt-2">
            {/* "閱讀更多" 按鈕 */}
            <button
              onClick={onClick}
              className={`inline-flex items-center font-semibold text-xs text-link-accent group-hover:underline`}
            >
              {t('blogPage.readMoreLink')}
              <ChevronRightIcon className="w-3.5 h-3.5 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentPostItem;
