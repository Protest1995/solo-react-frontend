
import React from 'react';

/**
 * 用戶圖標組件 (UserIcon)。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A18.732 18.732 0 0112 22.5c-2.786 0-5.433-.608-7.499-1.632z" />
  </svg>
);

export default UserIcon;
