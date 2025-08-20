// 引入 React 相關鉤子
import React, { useState, useEffect } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData } from '../../types';
// 引入 Framer Motion 動畫庫
import { motion } from 'framer-motion';
// 引入工具函數，用於移除 Markdown 格式
import { stripMarkdown } from '../../utils';

// 定義卡片圖片的動畫變體
const imageVariants = {
  rest: { scale: 1 }, // 靜止狀態：正常大小
  hover: { scale: 1.1, transition: { duration: 0.5, ease: "easeOut" as const } }, // 懸停狀態：放大
};

// 定義卡片標題的動畫變體
const titleVariants = {
  rest: { color: 'var(--text-primary)' }, // 靜止狀態：使用主題的主要文字顏色
  hover: { color: 'var(--accent-cyan)', transition: { duration: 0.3, ease: "easeOut" as const } }, // 懸停狀態：變為強調色
};


// 定義組件的屬性介面
interface BlogCardProps {
  post: BlogPostData; // 文章數據
  onClick: () => void; // 點擊事件的回調函數
  isDeleteModeActive?: boolean; // 是否處於刪除模式，預設為 false
  isSelectedForDeletion?: boolean; // 是否被選中以待刪除，預設為 false
  onToggleSelectionForDeletion?: (id: string) => void; // 切換選中狀態的回調
  isCardDisabled?: boolean; // 卡片是否被禁用（例如，在刪除模式下，靜態文章不可刪除）
}

/**
 * 用於瀑布流（Masonry）佈局的部落格卡片組件。
 * 能夠顯示文章摘要資訊，並處理刪除模式下的交互。
 */
const BlogCard: React.FC<BlogCardProps> = ({ 
  post, 
  onClick, 
  isDeleteModeActive = false,
  isSelectedForDeletion = false,
  onToggleSelectionForDeletion = () => {},
  isCardDisabled = false,
}) => {
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

  // 使用 useMemo 緩存計算後的值，以避免在每次渲染時都進行不必要的重算
  const { displayTitle, displayExcerpt, formattedDate, categoryText } = React.useMemo(() => {
    // 根據當前語言選擇顯示的標題
    const title = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    
    // 根據當前語言選擇內容，並使用 stripMarkdown 清除格式以生成純文字摘要
    const rawContent = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || '');
    const excerpt = stripMarkdown(rawContent);
        
    // 格式化日期
    let date = null;
    if (post.date) {
        const d = new Date(post.date);
        // 根據語言環境格式化日期
        date = i18n.language === 'zh-Hant'
        ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    // 獲取分類的翻譯文本
    const catText = post.categoryKey ? t(post.categoryKey) : '';

    return { displayTitle: title, displayExcerpt: excerpt, formattedDate: date, categoryText: catText };
  }, [post, t, i18n.language]);

  // 處理卡片點擊事件
  const handleCardClick = () => {
    if (isCardDisabled) return; // 如果卡片被禁用，則不執行任何操作
    if (isDeleteModeActive) {
      // 在刪除模式下，點擊用於選中/取消選中
      if (onToggleSelectionForDeletion && post.id) {
        onToggleSelectionForDeletion(post.id);
      }
    } else {
      // 正常模式下，觸發父組件傳入的 onClick 回調（例如，導航到文章詳情頁）
      onClick();
    }
  };
  
  // 根據狀態動態生成卡片的 CSS class
  const cardWrapperClasses = `
    relative bg-theme-secondary rounded-lg h-full transition-shadow duration-300 shadow-lg hover:shadow-2xl flex flex-col
    ${isCardDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    border-2 ${isSelectedForDeletion ? 'border-custom-cyan' : 'border-transparent'}
  `;
  
  return (
    <motion.div
      onClick={handleCardClick}
      className={cardWrapperClasses}
      role="button" // 語義化為按鈕
      tabIndex={0} // 使其可通過鍵盤聚焦
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }} // 允許使用 Enter 鍵觸發
      aria-label={`Read more about ${displayTitle}`} // 為輔助技術提供清晰的標籤
      initial="rest"
      animate={!isMobile ? "rest" : undefined}
      whileHover={!isMobile ? "hover" : undefined}
      whileInView={isMobile ? "hover" : undefined}
      viewport={{ amount: 1 }}
    >
      {/* 圖片容器 */}
      <div className="relative rounded-t-lg overflow-hidden">
        <motion.img
          src={post.imageUrl}
          alt={displayTitle}
          className="w-full h-48 object-cover"
          variants={imageVariants} // 應用圖片懸停動畫
        />
        {/* 在刪除模式下顯示的勾選框 */}
        {isDeleteModeActive && (
          <div className="absolute top-3 right-3 bg-theme-secondary/50 p-1 rounded-md pointer-events-none backdrop-blur-sm">
            <input
              type="checkbox"
              readOnly
              checked={isSelectedForDeletion}
              className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan focus:ring-offset-0 pointer-events-none"
            />
          </div>
        )}
      </div>
      {/* 內容容器 */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between text-xs text-theme-secondary mb-2">
          <span className="font-semibold text-custom-cyan uppercase">{categoryText}</span>
          {formattedDate && <span>{formattedDate}</span>}
        </div>
        <motion.h3
          className="text-lg font-bold font-playfair mb-2 leading-tight text-theme-primary"
          variants={titleVariants} // 應用標題懸停動畫
        >
            {displayTitle}
        </motion.h3>
        {displayExcerpt &&
            <p className="text-theme-secondary text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
              {displayExcerpt}
            </p>
        }
        <div className="flex-shrink-0 mt-auto pt-3 border-t border-theme-primary flex justify-between items-center text-xs text-theme-muted">
          {post.date ? (
            <p className="flex items-center">
                <span>{t('blogPage.writtenBy')} <span className="font-semibold text-custom-cyan">Solo</span></span>
            </p>
          ) : <div />}
          <span className="font-semibold text-custom-cyan group-hover:underline">
            {t('blogPage.readMoreLink')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogCard;
