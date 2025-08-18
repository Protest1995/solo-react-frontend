
import React from 'react';

/**
 * 槓鈴/重量圖標組件 (WeightIcon)，常用於健身。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const WeightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M7 12h-3"/>
    <path d="M12 7V4"/>
    <path d="M17 12h3"/>
    <path d="M12 17v3"/>
  </svg>
);

export default WeightIcon;
