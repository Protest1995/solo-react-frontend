
import React from 'react';

/**
 * 向右箭頭圖標組件 (ChevronRightIcon)。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export default ChevronRightIcon;
