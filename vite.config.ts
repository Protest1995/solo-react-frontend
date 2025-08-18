
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// 導出 Vite 配置函數
export default defineConfig(({ mode }) => {
    // 加載環境變數
    // mode: 'development' 或 'production'
    // '.': 環境變數文件所在的根目錄
    // '': 加載所有環境變數，不加前綴
    const env = loadEnv(mode, '.', '');
    return {
      // 專為 GitHub Pages 部署設定基礎路徑
      base: '/',
      // define 選項用於定義全局變數，在客戶端代碼中可以直接訪問
      define: {
        // 將 process.env.API_KEY 定義為 GEMINI_API_KEY 的值
        // 這允許在代碼中使用 process.env.API_KEY 來訪問 API 金鑰
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.CLOUDINARY_CLOUD_NAME': JSON.stringify(env.CLOUDINARY_CLOUD_NAME),
        'process.env.CLOUDINARY_UPLOAD_PRESET': JSON.stringify(env.CLOUDINARY_UPLOAD_PRESET),
        'process.env.EMAILJS_PUBLIC_Key': JSON.stringify(env.EMAILJS_PUBLIC_Key),
        'process.env.EMAILJS_SERVICE_ID': JSON.stringify(env.EMAILJS_SERVICE_ID),
        'process.env.EMAILJS_TEMPLATE_ID': JSON.stringify(env.EMAILJS_TEMPLATE_ID)
      },
      // 開發伺服器設定（解決跨域，使用 /api 代理到後端）
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, '/api')
          }
        }
      },
      // resolve 選項用於配置模塊解析
      resolve: {
        // alias 用於設置路徑別名
        alias: {
          // 將 '@' 別名設置為項目根目錄
          // 這允許使用例如 `import Component from '@/components/Component.tsx'` 的方式導入模塊
          '@': path.resolve(path.dirname(new URL(import.meta.url).pathname), '.'),
        }
      }
    };
});