
import React from 'react';

/**
 * 垃圾桶圖標組件 (TrashIcon)。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export default TrashIcon;
