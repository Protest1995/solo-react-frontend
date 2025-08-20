// 引入 React
import React, { useState, useEffect } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped } from 'framer-motion';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 組件屬性介面
interface TopicCardProps {
  titleKey: string; // 標題的翻譯鍵
  image: string; // 背景圖片 URL
  onClick: () => void; // 點擊事件的回調
}

// 圖片懸停動畫變體
const imageHoverVariants = {
  rest: { scale: 1, filter: 'grayscale(100%)' }, // 靜止狀態：正常大小，灰度
  hover: { scale: 1.1, filter: 'grayscale(0%)' }, // 懸停狀態：放大，彩色
};

// 遮罩層懸停動畫變體
const overlayVariants = {
    rest: { backgroundColor: 'rgba(0,0,0,0.3)' }, // 靜止狀態
    hover: { backgroundColor: 'rgba(0,0,0,0.2)' }  // 懸停狀態
};

// 標題懸停動畫變體
const titleHoverVariants = {
  rest: { y: 0 }, // 靜止狀態
  hover: { color: 'var(--accent-cyan)', y: -5 }, // 懸停狀態：變為強調色並向上移動
};

/**
 * 主題卡片組件。
 * 用於在部落格主頁展示不同的主題或分類，帶有豐富的懸停動畫效果。
 */
const TopicCard: React.FC<TopicCardProps> = ({ titleKey, image, onClick }) => {
  const { t } = useTranslation();
  const title = t(titleKey);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <motion.div
      onClick={onClick}
      className="relative bg-theme-secondary rounded-lg h-56 transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer flex flex-col overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      aria-label={title}
      initial="rest" // 設置初始動畫狀態
      animate={!isMobile ? "rest" : undefined} // 桌面端：除非懸停，否則保持 rest 狀態。行動端：讓 whileInView 控制狀態。
      whileHover={!isMobile ? "hover" : undefined} // 桌面端：懸停時觸發 "hover" 狀態。
      whileInView={isMobile ? "hover" : undefined} // 行動端：進入視圖時觸發 "hover" 狀態。
      viewport={{ amount: 0.5 }} // 動畫在元素 50% 可見時觸發，且可重複觸發。
    >
        <motion.img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          variants={imageHoverVariants}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        />
        <motion.div
          className="absolute inset-0"
          variants={overlayVariants}
          transition={{ duration: 0.3 }}
        />
        <div className="relative flex-grow flex items-center justify-center p-4 text-center">
            <motion.h3
              className="text-2xl font-bold font-playfair text-white"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }} // 添加文字陰影以提高可讀性
              variants={titleHoverVariants}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.h3>
        </div>
    </motion.div>
  );
};

export default TopicCard;