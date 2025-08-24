import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  // 根據模式選擇後端 API 目標
  const target = 'https://solo-springboot-backend-production.up.railway.app'; // 統一使用部署版本的後端

  return {
    base: '/',
    server: {
      port: 5173,
      host: true, // 允許通過IP訪問
      cors: true, // 啟用 CORS
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        },
        // 對於 OAuth 流程，changeOrigin 必須為 false。
        // 這會保留原始的 Host header (localhost:5173)，
        // 讓後端（Spring Boot）能夠生成與 Google Cloud Console 中設定相符的正確 redirect_uri。
        // 將此設為 true 是導致 redirect_uri_mismatch 錯誤的原因。
        '/auth': {
          target,
          changeOrigin: false, // 從 true 修正
          secure: false,
        },
        '/login': {
          target,
          changeOrigin: false, // 從 true 修正
          secure: false,
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(
          path.dirname(new URL(import.meta.url).pathname),
          '.'
        ),
      }
    }
  };
});