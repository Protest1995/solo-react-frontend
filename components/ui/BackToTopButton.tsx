// 引入 React 相關鉤子
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
// 引入圖標和常數
import ArrowUpIcon from '../icons/ArrowUpIcon';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_FOCUS_VISIBLE_RING_CLASS } from '../../constants';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 定義按鈕的屬性介面
interface BackToTopButtonProps {
  isVisible: boolean; // 控制按鈕是否可見
}

/**
 * "回到頂部" 按鈕組件。
 * 當頁面滾動超過一定距離時顯示，點擊後平滑滾動到頁面頂部。
 */
const BackToTopButton: React.FC<BackToTopButtonProps> = ({ isVisible }) => {
  // 使用翻譯鉤子
  const { t } = useTranslation();

  // 平滑滾動到頁面頂部的函數
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    // AnimatePresence 用於處理組件的進入和離開動畫
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-50 w-10 h-10 rounded-full items-center justify-center shadow-lg
                      hidden lg:flex
                      ${ACCENT_BG_COLOR} ${ACCENT_BG_HOVER_COLOR} text-zinc-900 
                      focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`}
          // 定義進入和離開的動畫效果
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          aria-label={t('backToTop.label', 'Go to top')}
        >
          <ArrowUpIcon className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTopButton;
