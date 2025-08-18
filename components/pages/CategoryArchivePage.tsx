
import React, { useMemo, useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { BlogPostData, Page, CategoryInfo } from '../../types';
import SectionTitle from '../ui/SectionTitle';
import Pagination from '../ui/Pagination';
import { staggerContainerVariants, fadeInUpItemVariants, sectionDelayShow } from '../../animationVariants';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import BlogCard from '../ui/BlogCardMasonry';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CategorySidebar from '../ui/CategorySidebar';
import SearchIcon from '../icons/SearchIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 定義每頁顯示的文章數量
const ITEMS_PER_PAGE = 8;
// 定義排序順序的類型
type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'views-desc' | 'views-asc';

// 定義 CategoryArchivePage 組件的屬性介面
interface CategoryArchivePageProps {
  categoryInfo: CategoryInfo; // 當前分類的資訊 (例如，標題翻譯鍵、包含的子分類鍵等)
  allPosts: BlogPostData[]; // 所有文章列表
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  onDeletePosts: (postIds: string[]) => void; // 刪除文章的回調函數
  isAuthenticated: boolean; // 用戶是否登入
  isSuperUser: boolean; // 用戶是否為超級管理員
  navigateToLogin: () => void; // 導航到登入頁的函數
}

/**
 * 分類封存頁面組件 (CategoryArchivePage)。
 * 此組件負責顯示特定分類下的所有文章，並提供分頁、排序、搜尋和管理功能。
 * 狀態（如當前頁碼、排序方式）是通過 URL 查詢參數管理的，這使得頁面狀態可以被分享和收藏。
 */
const CategoryArchivePage: React.FC<CategoryArchivePageProps> = ({
  categoryInfo,
  allPosts,
  navigateTo,
  onDeletePosts,
  isAuthenticated,
  isSuperUser,
  navigateToLogin,
}) => {
  // --- 鉤子 (Hooks) ---
  const { t, i18n } = useTranslation();
  
  // `useSearchParams` 用於讀取和寫入 URL 的查詢參數 (例如 "?page=2&sort=date-desc")
  const [searchParams, setSearchParams] = useSearchParams();
  // 從 URL 參數讀取狀態，如果不存在則使用預設值
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const sortOrder = (searchParams.get('sort') as SortOrder) || 'date-desc';
  const [searchTerm, setSearchTerm] = useState('');

  // --- UI 狀態 ---
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false); // 是否處於刪除模式
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]); // 存儲被選中待刪除的文章 ID

  // --- 回調函數 (useCallback & Handlers) ---

  // 處理排序變更的回調。使用 useCallback 以避免不必要的重新創建。
  const handleSortChange = useCallback((newSortOrder: SortOrder) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSortOrder);
    newParams.set('page', '1'); // 變更排序後總是重置到第一頁
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);
  
  // 處理分頁變更的回調。
  const handlePageChange = useCallback((newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', String(newPage));
      setSearchParams(newParams);
      window.scrollTo(0, 0); // 換頁後滾動到頁面頂部
  }, [searchParams, setSearchParams]);

  // --- 計算屬性 (useMemo) ---
  
  // `sortedPosts` 是一個經過過濾和排序的文章列表。
  // 使用 useMemo 進行性能優化，只有在依賴項改變時才重新計算。
  const sortedPosts = useMemo(() => {
    let filtered;

    // 步驟 1: 根據分類進行過濾
    if (categoryInfo.titleKey === 'portfolioPage.filterAll') {
      // 如果是 "所有文章" 分類，則不過濾
      filtered = allPosts;
    } else {
      // 否則，篩選出 categoryKey 存在於當前分類定義中的文章
      filtered = allPosts.filter(p => p.categoryKey && categoryInfo.categoryKeys.includes(p.categoryKey));
    }

    // 步驟 2: 根據搜尋關鍵字進行過濾
    if (searchTerm.trim() !== '') {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(post => {
            // 在多個字段中進行不分大小寫的搜尋
            const title = (post.title || '').toLowerCase();
            const titleZh = (post.titleZh || '').toLowerCase();
            const content = (post.content || '').toLowerCase();
            const contentZh = (post.contentZh || '').toLowerCase();
            const excerpt = (post.excerpt || '').toLowerCase();
            const excerptZh = (post.excerptZh || '').toLowerCase();
            
            return title.includes(lowercasedTerm) ||
                   titleZh.includes(lowercasedTerm) ||
                   content.includes(lowercasedTerm) ||
                   contentZh.includes(lowercasedTerm) ||
                   excerpt.includes(lowercasedTerm) ||
                   excerptZh.includes(lowercasedTerm);
        });
    }
    
    // 步驟 3: 根據 `sortOrder` 進行排序
    return filtered.sort((a, b) => {
      const titleA = (i18n.language === 'zh-Hant' && a.titleZh) ? a.titleZh : (a.title || '');
      const titleB = (i18n.language === 'zh-Hant' && b.titleZh) ? b.titleZh : (b.title || '');
      switch (sortOrder) {
        case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title-asc': return titleA.localeCompare(titleB);
        case 'title-desc': return titleB.localeCompare(titleA);
        case 'views-desc': return (b.views || 0) - (a.views || 0);
        case 'views-asc': return (a.views || 0) - (b.views || 0);
        case 'date-desc': default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [allPosts, categoryInfo, sortOrder, i18n.language, searchTerm]);

  // 計算總頁數
  const totalPages = Math.ceil(sortedPosts.length / ITEMS_PER_PAGE);
  
  // 根據當前頁碼從已排序的列表中提取要顯示的文章
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedPosts.slice(startIndex, endIndex);
  }, [sortedPosts, currentPage]);

  // --- 權限與管理功能 ---
  
  // 判斷用戶是否具有管理此分類內容的權限
  const canManageContent = categoryInfo.isEditable && isSuperUser;

  // 處理新增文章按鈕點擊事件
  const handleShowAddForm = () => {
    if (!canManageContent) { navigateToLogin(); return; }
    navigateTo(Page.AddBlogPost);
  };
  
  // 切換刪除模式
  const handleToggleDeleteMode = () => {
    if (!canManageContent) { navigateToLogin(); return; }
    setIsDeleteModeActive(prev => !prev);
    setSelectedIdsForDeletion([]); // 進入或退出刪除模式時清空已選項
  };
  
  // 確認刪除所選文章
  const handleDeleteConfirmed = () => {
    onDeletePosts(selectedIdsForDeletion);
    setSelectedIdsForDeletion([]);
    setIsDeleteModeActive(false);
  };

  // 切換單個文章的選中狀態
  const handleToggleSelectionForDeletion = (id: string) => {
    setSelectedIdsForDeletion(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // 全選/取消全選
  const handleSelectAllForDeletion = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allDeletableIds = paginatedPosts.map(item => item.id);
      setSelectedIdsForDeletion(allDeletableIds);
    } else {
      setSelectedIdsForDeletion([]);
    }
  };

  // 計算當前頁可刪除項目的數量
  const deletableItemsCount = useMemo(() => paginatedPosts.length, [paginatedPosts]);

  // --- 渲染 (JSX) ---
  return (
    <div className="space-y-12">
      <motion.div {...sectionDelayShow(0)}>
          <SectionTitle titleKey={categoryInfo.titleKey} />
      </motion.div>
      
      <motion.div {...sectionDelayShow(0.2)} className="flex justify-between items-center">
          {/* 返回部落格按鈕 */}
          <button onClick={() => navigateTo(Page.Blog)} className="button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all flex items-center">
              <ArrowLeftIcon className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">{t('categoryPage.backToBlog')}</span>
          </button>
          {/* 排序下拉選單 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
              <label htmlFor="sortOrder" className="text-sm font-medium text-theme-primary whitespace-nowrap">{t('blogPage.sortByLabel')}:</label>
              <div className="relative">
                  <select id="sortOrder" value={sortOrder} onChange={(e) => handleSortChange(e.target.value as SortOrder)} className={`bg-theme-tertiary border border-theme-primary text-theme-primary text-sm font-medium rounded-md p-2.5 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer`} aria-label={t('blogPage.sortByLabel')}>
                      <option value="date-desc">{t('blogPage.sortDateDesc')}</option>
                      <option value="date-asc">{t('blogPage.sortDateAsc')}</option>
                      <option value="title-asc">{t('blogPage.sortTitleAsc')}</option>
                      <option value="title-desc">{t('blogPage.sortTitleDesc')}</option>
                      <option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option>
                      <option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary"><ChevronDownIcon className="w-5 h-5" /></div>
              </div>
          </div>
      </motion.div>

      {/* 主要內容網格 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          {paginatedPosts.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
              {/* 渲染分頁後的文章卡片 */}
              {paginatedPosts.map(post => (
                <motion.div key={post.id} variants={fadeInUpItemVariants}>
                  <BlogCard post={post} onClick={() => navigateTo(Page.BlogPostDetail, post)} isDeleteModeActive={isDeleteModeActive} isSelectedForDeletion={selectedIdsForDeletion.includes(post.id)} onToggleSelectionForDeletion={handleToggleSelectionForDeletion} isCardDisabled={isDeleteModeActive && !!post.isStatic} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p className="text-center text-theme-secondary py-10" initial={{ opacity: 0 }} animate={{ opacity: 1}}> {t('blogPage.noPostsFound')} </motion.p>
          )}
        </div>
        
        {/* 側邊欄 */}
        <div className="lg:col-span-1">
          <CategorySidebar allPosts={allPosts} navigateTo={navigateTo} currentCategoryInfo={categoryInfo} searchTerm={searchTerm} onSearchChange={(term) => { setSearchTerm(term); handlePageChange(1); }} />
        </div>
      </div>
      
      {/* 分頁組件 */}
      {paginatedPosts.length > 0 && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
};

export default CategoryArchivePage;
