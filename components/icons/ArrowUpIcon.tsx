
import React from 'react';

/**
 * 向上箭頭圖標組件 (ArrowUpIcon)。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
  </svg>
);

export default ArrowUpIcon;
