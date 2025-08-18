
import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { i18n } from './i18n'; // 初始化 i18next 並導入實例
import ScrollToTop from './components/ui/ScrollToTop';
import { AuthProvider } from './src/contexts/AuthContext';

// Dynamically create and set a circular favicon from the existing square icon.
// This is done via JavaScript/Canvas because SVG favicons can't load external images.
const setCircularFavicon = () => {
  const faviconUrl = '/images/icon/icon.jpg';
  const img = new Image();
  img.src = faviconUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    // Use a decent resolution for the favicon for high-DPI screens
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Draw the image into the clipped area
      ctx.drawImage(img, 0, 0, size, size);
      
      // Find the existing favicon link tag or create one if it doesn't exist
      let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      // Update the favicon with the canvas data URL
      link.href = canvas.toDataURL('image/png');
    }
  };
  // Handle potential loading errors for the image
  img.onerror = () => {
    console.error('Failed to load the favicon image for processing.');
  };
};

// Execute the function to set the favicon
setCircularFavicon();
// 獲取根 DOM 元素
const rootElement = document.getElementById('root');
if (!rootElement) {
  // 如果找不到根元素，拋出錯誤
  throw new Error("Could not find root element to mount to");
}

// 使用 ReactDOM.createRoot 創建一個 React 根
const root = ReactDOM.createRoot(rootElement);

// 渲染應用程式
root.render(
  <React.Suspense fallback="Loading...">
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  </React.Suspense>
);
