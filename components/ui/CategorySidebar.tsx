// 引入 React 相關鉤子和組件
import React, { useMemo, useState, useRef, useEffect } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion, AnimatePresence } from 'framer-motion';
// 引入類型定義和數據
import { BlogPostData, Page, CategoryInfo } from '../../types';
import { blogCategoryDefinitions } from '../data/blogData';
// 引入動畫變體
import { staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
// 引入圖標和樣式常數
import SearchIcon from '../icons/SearchIcon';
import FilterIcon from '../icons/FilterIcon';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
// 引入工具函數
import { stripMarkdown } from '../../utils';

// 定義排序順序的類型
type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'views-desc' | 'views-asc';

// 側邊欄區塊標題的內部組件
const SidebarSectionTitle: React.FC<{ titleKey: string }> = ({ titleKey }) => {
  const { t, i18n } = useTranslation();
  let title = t(titleKey);
  // 如果翻譯查找失敗（例如，鍵名錯誤），為一個特定的鍵提供後備方案
  if (title === 'blogSidebar.otherCategoryPosts') {
    title = i18n.language === 'zh-Hant' ? '其他分類文章' : 'Other Category Posts';
  }
  return (
    <div className="mb-6">
      <h3 className="text-xl font-playfair font-bold text-theme-primary relative pb-2">
        {title}
        {/* 裝飾性下劃線 */}
        <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-theme-primary/20"></span>
      </h3>
    </div>
  );
};

// CategorySidebar 組件的屬性介面
interface CategorySidebarProps {
  allPosts: BlogPostData[]; // 所有文章列表
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  currentCategoryInfo?: CategoryInfo; // 當前分類資訊，可選
  searchTerm: string; // 當前搜尋關鍵字
  onSearchChange: (term: string) => void; // 搜尋關鍵字改變時的回調
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

/**
 * 分類頁面的側邊欄組件。
 * 顯示一個搜尋框、所有分類及其文章數量，以及一個上下文相關的文章列表（熱門文章或最新文章）。
 */
const CategorySidebar: React.FC<CategorySidebarProps> = ({ allPosts, navigateTo, currentCategoryInfo, searchTerm, onSearchChange, sortOrder, onSortChange }) => {
  const { t, i18n } = useTranslation();
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 使用 useMemo 計算每個大分類下的文章數量，以優化性能
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    blogCategoryDefinitions.forEach(def => {
      const allCategoryKeys = def.categoryKeys;
      // 過濾出屬於該大分類的所有文章並計數
      const count = allPosts.filter(p => p.categoryKey && allCategoryKeys.includes(p.categoryKey)).length;
      counts[def.titleKey] = count;
    });
    return counts;
  }, [allPosts]);

  // 根據是否存在 `currentCategoryInfo`，動態決定顯示熱門文章還是其他分類的最新文章
  const { titleKey, postsToList } = useMemo(() => {
    if (currentCategoryInfo) {
      // 如果用戶正在瀏覽一個特定分類，則顯示“其他分類文章”
      const currentKeys = new Set(currentCategoryInfo.categoryKeys);
      // 過濾掉當前分類的文章，對其餘文章按日期排序，取前3篇
      const latestPostsFromOthers = allPosts
        .filter(p => !p.categoryKey || !currentKeys.has(p.categoryKey))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      return { titleKey: 'blogSidebar.otherCategoryPosts', postsToList: latestPostsFromOthers };
    } else {
      // 預設行為（例如在部落格主頁的側邊欄），顯示最受歡迎的文章
      // 根據瀏覽量 (`views`) 對文章進行降序排序，取前5篇
      const popularPosts = [...allPosts]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);
      return { titleKey: 'blogSidebar.popularPosts', postsToList: popularPosts };
    }
  }, [allPosts, currentCategoryInfo]);

  const sortOptions: { value: SortOrder; labelKey: string }[] = [
    { value: 'date-desc', labelKey: 'blogPage.sortDateDesc' },
    { value: 'date-asc', labelKey: 'blogPage.sortDateAsc' },
    { value: 'title-asc', labelKey: 'blogPage.sortTitleAsc' },
    { value: 'title-desc', labelKey: 'blogPage.sortTitleDesc' },
    { value: 'views-desc', labelKey: 'postManagementPage.sortByViewsDesc' },
    { value: 'views-asc', labelKey: 'postManagementPage.sortByViewsAsc' },
  ];

  return (
    <motion.aside
      className="space-y-12 bg-theme-secondary p-6 rounded-lg shadow-xl sticky top-24"
      variants={staggerContainerVariants(0.2, 0.4)}
      initial="initial"
      animate="animate"
    >
      {/* 搜尋框與排序按鈕區塊 */}
      <motion.section variants={fadeInUpItemVariants}>
        <div className="flex items-center space-x-2">
            <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-theme-secondary" />
                </span>
                <input
                    type="search"
                    placeholder={t('categoryPage.searchPlaceholder', '在此分類中搜尋...')}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={`w-full bg-theme-tertiary border border-theme-primary text-theme-primary rounded-md py-2.5 pl-10 pr-4 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                />
            </div>
            <div ref={sortMenuRef} className="relative flex-shrink-0">
              <button
                onClick={() => setIsSortMenuOpen(prev => !prev)}
                className={`p-2.5 rounded-md transition-colors duration-200 ${isSortMenuOpen ? 'bg-theme-hover text-custom-cyan' : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-hover hover:text-custom-cyan'}`}
                aria-label={t('blogPage.sortByLabel')}
              >
                <FilterIcon className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {isSortMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-48 bg-theme-secondary border border-theme-primary rounded-md shadow-lg z-20"
                  >
                    <ul className="p-1">
                      {sortOptions.map(option => (
                        <li key={option.value}>
                          <button
                            onClick={() => {
                              onSortChange(option.value);
                              setIsSortMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${sortOrder === option.value ? 'font-semibold text-custom-cyan bg-theme-hover' : 'text-theme-primary hover:bg-theme-hover'}`}
                          >
                            {t(option.labelKey)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>
      </motion.section>
      
      {/* 分類列表區塊 */}
      <motion.section variants={fadeInUpItemVariants}>
        <SidebarSectionTitle titleKey="blogPage.categoryLabel" />
        <ul className="space-y-1">
          {/* "所有文章" 選項 */}
          <li>
            <button
              onClick={() => navigateTo(Page.AllPostsArchive)}
              className={`w-full flex justify-between items-center hover:text-custom-cyan transition-colors py-2 border-b border-theme-primary/30 ${
                currentCategoryInfo?.titleKey === 'portfolioPage.filterAll' ? 'text-custom-cyan' : 'text-theme-secondary'
              }`}
            >
              <span className="font-medium">{t('portfolioPage.filterAll')}</span>
              <span className="bg-theme-tertiary text-theme-muted text-xs font-semibold px-2 py-0.5 rounded-md">
                {allPosts.length}
              </span>
            </button>
          </li>
          {/* 遍歷所有分類定義並顯示 */}
          {blogCategoryDefinitions.map(cat => (
            <li key={cat.titleKey}>
              <button
                onClick={() => navigateTo(Page.CategoryPage, cat)}
                className={`w-full flex justify-between items-center hover:text-custom-cyan transition-colors py-2 border-b border-theme-primary/30 ${currentCategoryInfo?.titleKey === cat.titleKey ? 'text-custom-cyan' : 'text-theme-secondary'}`}
              >
                <span className="font-medium">{t(cat.titleKey)}</span>
                <span className="bg-theme-tertiary text-theme-muted text-xs font-semibold px-2 py-0.5 rounded-md">
                  {categoryCounts[cat.titleKey] || 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* 最新/熱門文章列表區塊 */}
      {postsToList.length > 0 && (
        <motion.section variants={fadeInUpItemVariants}>
          <SidebarSectionTitle titleKey={titleKey} />
          <ul className="space-y-5">
            {postsToList.map(post => {
              const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || '');
              const excerptText = (i18n.language === 'zh-Hant' ? (post.excerptZh || post.contentZh) : (post.excerpt || post.content)) || '';
              const cleanExcerpt = stripMarkdown(excerptText);

              return (
                <li key={post.id} className="popular-post-item flex items-start space-x-4 cursor-pointer" onClick={() => navigateTo(Page.BlogPostDetail, post)}>
                  <img src={post.imageUrl} alt={displayTitle || ''} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <h4 className="popular-post-title font-semibold text-sm text-theme-primary transition-colors leading-tight line-clamp-2">
                      {displayTitle}
                    </h4>
                    <p className="text-xs text-theme-secondary mt-1.5 line-clamp-2">
                      {cleanExcerpt}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}
    </motion.aside>
  );
};

export default CategorySidebar;