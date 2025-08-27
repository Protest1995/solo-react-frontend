// 引入 React 相關鉤子和組件
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫相關鉤子
import { motion as motionTyped, useMotionValue, useTransform, useSpring } from 'framer-motion';
// 引入類型定義
import { PortfolioItemData } from '../../types'; 
// 引入常數和圖標
import { ACCENT_COLOR, ACCENT_FOCUS_VISIBLE_RING_CLASS } from '../../constants';
import EyeIcon from '../icons/EyeIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 懸停遮罩層的動畫變體
const overlayHoverVariants = {
  rest: { opacity: 0 }, // 靜止狀態：透明
  hover: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' as const } }, // 懸停狀態：不透明
};

// 遮罩層內容的動畫變體，使用 stagger 效果，使子元素依序出現
const overlayContentVariants = {
    rest: { transition: { staggerChildren: 0.05, staggerDirection: -1, } },
    hover: { transition: { staggerChildren: 0.1, delayChildren: 0.1, } },
};

// 遮罩層中單個項目的動畫變體
const overlayItemVariants = {
    rest: { y: 20, opacity: 0 }, // 靜止狀態：在下方20px處，透明
    hover: { y: 0, opacity: 1 }, // 懸停狀態：移動到原位，不透明
};

// 卡片本身的懸停動畫變體
const cardMotionVariants = {
  rest: { scale: 1, boxShadow: "0px 5px 10px rgba(0,0,0,0.1)" },
  hover: { scale: 1.05, boxShadow: "0px 20px 40px -10px rgba(0,0,0,0.3)" },
};

/**
 * 作品集卡片組件。
 * 具有 3D 懸停效果，並能響應刪除模式。
 */
const PortfolioCard: React.FC<PortfolioItemData & { onClick: () => void; isDeleteModeActive?: boolean; isSelectedForDeletion?: boolean; onToggleSelectionForDeletion?: (itemId: string) => void; isCardDisabled?: boolean; }> = (props) => {
  const { id, imageUrl, onClick, title, titleZh, isDeleteModeActive, isSelectedForDeletion, onToggleSelectionForDeletion, isCardDisabled } = props;
  const { t, i18n } = useTranslation();

  // --- 3D 懸停效果的 Framer Motion 邏輯 ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCardDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  const displayTitle = (i18n.language === 'zh-Hant' && titleZh) ? titleZh : (title || '');

  const handleCardInteraction = () => {
    if (isCardDisabled) return;
    if (isDeleteModeActive && onToggleSelectionForDeletion) {
        onToggleSelectionForDeletion(id);
    } else if (!isDeleteModeActive) {
        onClick(); 
    }
  };
  
  const cardOuterClass = `
    relative bg-theme-secondary rounded-lg overflow-hidden flex flex-col
    ${isCardDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    border-2 ${isDeleteModeActive && isSelectedForDeletion ? 'border-custom-cyan' : 'border-transparent'}
    focus:outline-none ${!isCardDisabled ? ACCENT_FOCUS_VISIBLE_RING_CLASS : ''} 
    focus-visible:ring-offset-theme-primary
  `;
  
  return (
    <motion.div 
      className={cardOuterClass}
      onClick={handleCardInteraction}
      onKeyDown={(e) => { 
        if (isCardDisabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); 
          handleCardInteraction();
        }
      }}
      role={isDeleteModeActive ? "checkbox" : "button"}
      aria-checked={isDeleteModeActive ? isSelectedForDeletion : undefined}
      tabIndex={isCardDisabled ? -1 : 0}
      aria-label={isDeleteModeActive 
        ? t('portfolioPage.deleteCheckboxLabel', { title: displayTitle })
        : t('portfolioPage.viewProject', { title: displayTitle })}
      variants={cardMotionVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative overflow-hidden w-full h-full rounded-lg bg-theme-secondary" style={{ transform: "translateZ(20px)"}}>
        <img src={imageUrl} alt={displayTitle} className="w-full h-auto object-cover" />
        
        {!isDeleteModeActive && (
            // Desktop hover overlay
            <motion.div className="absolute inset-0 bg-black bg-opacity-60 hidden md:flex flex-col items-center justify-center p-4" variants={overlayHoverVariants}>
              <motion.div variants={overlayContentVariants} className="flex flex-col items-center justify-center text-center">
                  <motion.div variants={overlayItemVariants}>
                      <EyeIcon className={`w-10 h-10 ${ACCENT_COLOR} mb-2`} />
                  </motion.div>
                  <motion.h4 variants={overlayItemVariants} className={`text-xl font-semibold ${ACCENT_COLOR} text-center`}>
                      {displayTitle}
                  </motion.h4>
              </motion.div>
            </motion.div>
        )}

        {isDeleteModeActive && (
          <div className="absolute top-3 right-3 bg-theme-secondary/50 p-1 rounded-md pointer-events-none backdrop-blur-sm">
            <input type="checkbox" readOnly checked={isSelectedForDeletion} className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan focus:ring-offset-0 pointer-events-none" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PortfolioCard;
