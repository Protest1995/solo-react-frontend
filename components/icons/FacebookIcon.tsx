
import React from 'react';

/**
 * Facebook 圖標組件 (FacebookIcon)。
 * 這是一個無狀態的功能組件，用於渲染 SVG 圖標。
 */
const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22,12c0-5.523-4.477-10-10-10S2,6.477,2,12c0,4.99,3.657,9.128,8.438,9.878V14.89h-2.49V12h2.49v-2.078c0-2.467,1.46-3.808,3.669-3.808,1.055,0,2.115.188,2.115.188v2.298h-1.15c-1.207,0-1.588.724-1.588,1.521V12h2.568l-.409,2.89H14.562v6.988C18.343,21.128,22,16.99,22,12z"/>
  </svg>
);

export default FacebookIcon;
