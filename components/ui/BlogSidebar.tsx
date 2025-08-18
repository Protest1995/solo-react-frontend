// 引入 React 相關鉤子
import React, { useMemo } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入 UI 組件
import RecentPostItem from './RecentPostItem';

// 側邊欄區塊標題的內部組件
const SidebarSectionTitle: React.FC<{ titleKey: string }> = ({ titleKey }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-theme-primary relative">
        {t(titleKey)}
        {/* 裝飾性下劃線 */}
        <span className="absolute -bottom-1.5 left-0 w-8 h-0.5 bg-custom-cyan"></span>
      </h3>
    </div>
  );
};

// "焦點" 文章卡片的內部組件
const BreakingPostCard: React.FC<{ post: BlogPostData; onClick: () => void }> = ({ post, onClick }) => {
    const { t, i18n } = useTranslation();
    // 根據語言選擇顯示的標題
    const displayTitle = post.isStatic ? t(post.titleKey || '') : (i18n.language === 'zh-Hant' && post.titleZh ? post.titleZh : post.title || '');
    // 格式化日期
    const formattedDate = new Date(post.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div 
            className="rounded-lg overflow-hidden relative group cursor-pointer shadow-lg"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if(e.key === 'Enter') onClick(); }}
        >
            <img src={post.imageUrl} alt={displayTitle} className="w-full h-48 object-cover transition-all duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white">
                <div className="flex items-center space-x-2 mb-1">
                    <span className="bg-red-600 text-white text-xs font-bold uppercase px-2 py-0.5 rounded-md">{t('blogSidebar.breaking')}</span>
                    {post.categoryKey && <span className="text-xs font-semibold uppercase">{t(post.categoryKey)}</span>}
                </div>
                <h4 className="font-bold leading-tight transition-colors group-hover:text-custom-cyan">{displayTitle}</h4>
                <p className="text-xs text-gray-300 mt-1">{formattedDate}</p>
            </div>
        </div>
    );
};

// BlogSidebar 組件的屬性介面
interface BlogSidebarProps {
  allPosts: BlogPostData[]; // 所有文章列表
  navigateTo: (page: Page, data?: BlogPostData) => void; // 導航函數
}

/**
 * 部落格頁面的側邊欄組件。
 * 顯示焦點文章（最熱門）和熱門文章列表。
 */
const BlogSidebar: React.FC<BlogSidebarProps> = ({ allPosts, navigateTo }) => {

  // 使用 useMemo 進行性能優化，只有在 allPosts 改變時才重新排序
  // 根據點讚數 (`likes`) 對文章進行降序排列，以找出熱門文章
  const popularPosts = useMemo(() => {
    return [...allPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [allPosts]);

  // 最熱門的文章（排序後的第一篇）作為焦點文章
  const breakingPost = popularPosts[0];
  // 接下來的 4 篇熱門文章
  const otherPopularPosts = popularPosts.slice(1, 5);

  return (
    <aside className="space-y-12 bg-theme-secondary p-6 rounded-lg shadow-xl">
      {/* 焦點文章區塊 */}
      {breakingPost && (
        <section>
          <BreakingPostCard post={breakingPost} onClick={() => navigateTo(Page.BlogPostDetail, breakingPost)} />
        </section>
      )}

      {/* 熱門文章列表區塊 */}
      {otherPopularPosts.length > 0 && (
        <section>
          <SidebarSectionTitle titleKey="blogSidebar.popularPosts" />
          <div className="space-y-5">
            {otherPopularPosts.map(post => (
              <RecentPostItem 
                key={post.id} 
                post={post} 
                onClick={() => navigateTo(Page.BlogPostDetail, post)}
              />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
};

export default BlogSidebar;
