
import React from 'react';

/**
 * 向上箭頭圖標組件 (ChevronUpIcon)。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

export default ChevronUpIcon;
