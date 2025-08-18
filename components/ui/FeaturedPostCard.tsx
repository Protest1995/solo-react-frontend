// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion } from 'framer-motion';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入圖標組件
import ChevronRightIcon from '../icons/ChevronRightIcon';

// 組件屬性介面
interface FeaturedPostCardProps {
  post: BlogPostData; // 文章數據
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  index: number; // 文章在列表中的索引，用於交替佈局
}

/**
 * 特色文章卡片組件。
 * 用於展示一篇重點文章，佈局會根據文章索引的奇偶性交替（圖片在左或在右）。
 */
const FeaturedPostCard: React.FC<FeaturedPostCardProps> = ({ post, navigateTo, index }) => {
  const { t, i18n } = useTranslation();

  // 使用 useMemo 來緩存計算後的值，以避免不必要的重算
  const { displayTitle, displayExcerpt, categoryText } = React.useMemo(() => {
    // 根據語言選擇顯示的標題和摘要
    const title = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    const excerpt = (i18n.language === 'zh-Hant' && post.excerptZh) ? post.excerptZh : (post.excerpt || t('blogPage.noExcerpt'));
    const cleanExcerpt = excerpt.replace(/<[^>]*>?/gm, ''); // 移除 HTML 標籤
    const category = post.categoryKey ? t(post.categoryKey) : '';
    return { displayTitle: title, displayExcerpt: cleanExcerpt, categoryText: category };
  }, [post, t, i18n.language]);

  // 處理卡片點擊事件
  const handleCardClick = () => {
    navigateTo(Page.BlogPostDetail, post);
  };

  // 根據索引的奇偶性判斷圖片是否在左側
  const isImageLeft = index % 2 === 0;

  return (
    <motion.div
      className={`group bg-theme-secondary rounded-lg overflow-hidden shadow-xl transition-shadow duration-300 hover:shadow-2xl flex flex-col md:h-96 ${isImageLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
      aria-label={`${t('blogPage.readMore')}: ${displayTitle}`}
      whileHover={{ y: -5 }} // 懸停時向上移動
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* 圖片區塊 */}
      <div className="md:w-1/2 w-full h-56 md:h-full relative overflow-hidden cursor-pointer">
        <img
          src={post.imageUrl}
          alt={displayTitle}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105" // 懸停時圖片放大
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
      </div>

      {/* 文字內容區塊 */}
      <div className="md:w-1/2 w-full flex flex-col justify-center p-8 lg:p-12">
        {categoryText && (
          <span className="text-custom-cyan uppercase text-xs font-bold tracking-widest mb-3">
            {categoryText}
          </span>
        )}
        <h3 className="font-playfair text-2xl lg:text-3xl font-bold mb-4 text-theme-primary transition-colors duration-300 group-hover:text-custom-cyan cursor-pointer">
          {displayTitle}
        </h3>
        <p className="text-theme-secondary mb-6 line-clamp-3 md:line-clamp-4 leading-relaxed">
          {displayExcerpt}
        </p>
        <div className="mt-auto">
            <div className="inline-flex items-center font-semibold text-sm text-theme-primary group-hover:text-custom-cyan transition-colors duration-300 cursor-pointer">
                {t('blogPage.readMore')}
                <ChevronRightIcon className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturedPostCard;
