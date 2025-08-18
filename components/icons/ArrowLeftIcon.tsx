
import React from 'react';

/**
 * 向左箭頭圖標組件 (ArrowLeftIcon)。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

export default ArrowLeftIcon;
