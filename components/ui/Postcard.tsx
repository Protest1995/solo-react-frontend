// 引入 React
import React, { useState, useEffect } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入圖標組件
import { ChevronRightIcon } from 'lucide-react';
// 引入工具函數
import { stripMarkdown } from '../../utils';
// 引入 Framer Motion 動畫庫
import { motion } from 'framer-motion';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // 使用 useMemo 來緩存計算後的值，避免不必要的重算
  const { displayTitle, displayExcerpt } = React.useMemo(() => {
    // 根據語言選擇顯示的標題
    const title = ((i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : post.title || t('blogPage.untitledPost'));
    // 根據語言選擇內容，並移除 Markdown 格式以生成純文字摘要
    const rawContent = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || '');
    const excerpt = stripMarkdown(rawContent);
    return { displayTitle: title, displayExcerpt: excerpt };
  }, [post, t, i18n.language]);

  // 處理卡片點擊事件
  const handleCardClick = () => navigateTo(Page.BlogPostDetail, post);
  
  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  const titleVariants = {
    rest: {
      color: 'var(--text-on-dark-buttons)',
      textShadow: 'none',
    },
    hover: {
      color: 'var(--accent-cyan)',
      textShadow: '0 0 8px var(--accent-shadow-color), 0 0 20px var(--accent-shadow-color)',
      transition: { duration: 0.3, ease: "easeOut" as const }
    }
  };

  const readMoreVariants = {
    rest: { x: 0 },
    hover: { x: 4, transition: { duration: 0.3, ease: "easeOut" as const } }
  };

  return (
    <motion.div
      className="postcard"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      initial="rest"
      animate={!isMobile ? "rest" : undefined}
      whileHover={!isMobile ? "hover" : undefined}
      whileInView={isMobile ? "hover" : undefined}
      viewport={{ once: true, amount: 0.8 }}
    >
      <motion.img
        src={post.imageUrl}
        alt={displayTitle}
        className="postcard-image"
        variants={imageVariants}
      />
      <div className="postcard-overlay" />
      <div className="postcard-content">
        <motion.h3
          className="postcard-title font-playfair"
          variants={titleVariants}
        >
          {displayTitle}
        </motion.h3>
        <p className="postcard-excerpt">
          {displayExcerpt}
        </p>
        <motion.div
          className="postcard-read-more"
          variants={readMoreVariants}
        >
          {t('blogPage.readMore')}
          <ChevronRightIcon className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Postcard;