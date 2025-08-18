
import React from 'react';

/**
 * 鉛筆與方塊圖標組件 (PencilSquareIcon)，常用於編輯。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const PencilSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125M12 15v5.25A2.25 2.25 0 0014.25 22.5h5.25A2.25 2.25 0 0021.75 20.25V15m-9 .01H4.875c-.621 0-1.125.504-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125h3.375c.621 0 1.125-.504 1.125-1.125V16.135c0-.621-.504-1.125-1.125-1.125z" />
  </svg>
);

export default PencilSquareIcon;
