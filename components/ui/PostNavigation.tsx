// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 React Router 的 Link 組件
import { Link } from 'react-router-dom';
// 引入類型定義
import { BlogPostData } from '../../types';
// 引入圖標組件
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

// 組件屬性介面
interface PostNavigationProps {
  currentPost: BlogPostData; // 當前正在閱讀的文章
  allPosts: BlogPostData[]; // 所有文章的列表
}

/**
 * 文章導航組件。
 * 用於在文章詳情頁底部顯示指向上/下一篇文章的連結。
 */
const PostNavigation: React.FC<PostNavigationProps> = ({ currentPost, allPosts }) => {
  const { t, i18n } = useTranslation();

  // 使用 useMemo 進行性能優化，只有在 allPosts 改變時才重新排序
  // 根據日期對所有文章進行降序排序，以建立一個清晰的時間順序
  const sortedPosts = React.useMemo(() => 
    [...allPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
  [allPosts]);

  // 找到當前文章在排序後列表中的索引
  const currentIndex = sortedPosts.findIndex(p => p.id === currentPost.id);

  // 根據索引確定上一篇和下一篇文章
  // 因為是降序排列，所以“上一篇”（時間上更早）的文章索引會更大，“下一篇”（時間上更新）的文章索引會更小。
  const previousPost = currentIndex > -1 && currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;

  // 輔助函數：根據語言獲取文章標題
  const getDisplayTitle = (post: BlogPostData | null) => {
    if (!post) return '';
    return i18n.language === 'zh-Hant' && post.titleZh ? post.titleZh : (post.title || t('blogPage.untitledPost'));
  };

  return (
    <div className="post-navigation flex justify-between items-start gap-4 sm:gap-8 py-8">
      {/* 上一篇文章連結 */}
      <div className="w-1/2 text-left">
        {previousPost && (
          <Link
            to={`/blog/${previousPost.id}`}
            state={{ fromCategory: null }} // 清除來源分類信息，避免返回按鈕行為混亂
            className="group inline-block p-2 -ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-md"
            aria-label={`${t('pagination.previous')}: ${getDisplayTitle(previousPost)}`}
          >
            <div className="flex items-center text-sm text-theme-secondary transition-colors mb-1">
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              <span>{t('pagination.previous')}</span>
            </div>
            <p className="font-semibold text-theme-primary transition-colors line-clamp-2 pr-2">
              {getDisplayTitle(previousPost)}
            </p>
          </Link>
        )}
      </div>
      {/* 下一篇文章連結 */}
      <div className="w-1/2 text-right">
        {nextPost && (
          <Link
            to={`/blog/${nextPost.id}`}
            state={{ fromCategory: null }}
            className="group inline-block p-2 -mr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-md"
            aria-label={`${t('pagination.next')}: ${getDisplayTitle(nextPost)}`}
          >
            <div className="flex items-center justify-end text-sm text-theme-secondary transition-colors mb-1">
              <span>{t('pagination.next')}</span>
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </div>
            <p className="font-semibold text-theme-primary transition-colors line-clamp-2 pl-2 text-right">
              {getDisplayTitle(nextPost)}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PostNavigation;
