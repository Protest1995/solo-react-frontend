// 引入 React 相關鉤子
import React, { useRef } from 'react';
// 引入 Framer Motion 動畫庫
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// 組件屬性介面
interface SectionDividerProps {
  title?: string; // 標題文字 (可選)
  titleKey?: string; // 標題的翻譯鍵 (可選), 優先級高於 title
}

/**
 * 區塊分隔線組件。
 * 創建一個帶有動畫效果的水平分隔線，中間可以選擇性地顯示標題。
 * 當組件滾動進入視圖時，動畫會被觸發。
 */
const SectionDivider: React.FC<SectionDividerProps> = ({ title: directTitle, titleKey }) => {
  const { t } = useTranslation();
  const ref = useRef(null); // Ref 用於 Framer Motion 的 in-view 偵測
  
  // 優先使用 titleKey 進行翻譯，如果沒有則使用直接傳入的 title
  const title = titleKey ? t(titleKey) : directTitle;

  // 容器的動畫變體，用於控制子元素的交錯動畫
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // 子元素之間的延遲
        delayChildren: title ? 0 : 0.1, // 如果沒有標題，稍微延遲線條的動畫
      },
    },
  };

  // 線條的動畫變體（從中間向兩側展開）
  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 0.8, ease: 'easeInOut' as const },
    },
  };

  // 標題的動畫變體（淡入並向上移動）
  const titleVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.3 },
    },
  };

  return (
    <motion.div
      ref={ref}
      className="max-w-4xl mx-auto pt-0 md:pt-8 pb-8 flex items-center"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible" // 當組件進入視圖時觸發動畫
      viewport={{ once: true, amount: 0.5 }} // 動畫只觸發一次，當組件 50% 可見時
      aria-hidden="true" // 對輔助技術隱藏，因為它純粹是裝飾性的
    >
      {title ? (
        <div className="flex w-full items-center gap-4 sm:gap-6">
          {/* 左側線條 */}
          <motion.div className="h-0 flex-grow border-t border-theme-primary" style={{ transformOrigin: 'right' }} variants={lineVariants} />
          {/* 標題 */}
          <motion.h3 className="text-xl sm:text-2xl font-semibold uppercase tracking-wider text-theme-primary text-center whitespace-nowrap" variants={titleVariants}>
            {title}
          </motion.h3>
          {/* 右側線條 */}
          <motion.div className="h-0 flex-grow border-t border-theme-primary" style={{ transformOrigin: 'left' }} variants={lineVariants} />
        </div>
      ) : (
        null // 如果沒有提供標題，則不渲染任何內容（也可以選擇渲染一條完整的線）
      )}
    </motion.div>
  );
};

export default SectionDivider;
