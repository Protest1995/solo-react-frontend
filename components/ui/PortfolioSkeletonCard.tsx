// 引入 React
import React from 'react';

// 定義一個包含不同高度的 CSS class 數組。
// 這用於在瀑布流（Masonry）佈局中模擬隨機高度的卡片，使骨架屏看起來更自然。
const SKELETON_HEIGHTS = ['h-64', 'h-80', 'h-72', 'h-96', 'h-56', 'h-80', 'h-64', 'h-72', 'h-96'];

// 組件屬性介面
interface PortfolioSkeletonCardProps {
  index: number; // 卡片的索引，用於從高度數組中選擇一個高度
}

/**
 * 作品集骨架屏卡片組件。
 * 在作品集數據加載時顯示，提供一個視覺佔位符，並帶有閃爍動畫。
 * 這有助於改善用戶體驗，避免在數據加載完成前出現空白或佈局跳動。
 */
const PortfolioSkeletonCard: React.FC<PortfolioSkeletonCardProps> = ({ index }) => {
  // 通過索引和取模運算來循環使用高度數組，創建視覺上的多樣性
  const heightClass = SKELETON_HEIGHTS[index % SKELETON_HEIGHTS.length];
  
  return (
    // 'shimmer-bg' class 應用了在 index.html 中定義的閃爍動畫
    <div className={`w-full ${heightClass} bg-theme-tertiary rounded-lg shadow-md shimmer-bg`}>
      {/* 這個組件是一個帶有閃爍效果的乾淨佔位符，內部無需任何內容 */}
    </div>
  );
};

export default PortfolioSkeletonCard;
