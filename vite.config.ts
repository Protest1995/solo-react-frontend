import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  // 根據模式選擇後端 API 目標
  const target =
    mode === 'development'
      ? 'http://localhost:8080' // 本地開發
      : 'https://solo-springboot-backend-production.up.railway.app'; // 部署後

  return {
    base: '/',
    server: {
      port: 5173, 
      proxy: {
        '/api': {
          target,
          changeOrigin: true, // 對於常規 API 呼叫，這有助於處理 CORS
          secure: false,
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