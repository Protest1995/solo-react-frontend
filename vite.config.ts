import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  // 根據模式選擇後端 API 目標：開發時代理到本地 Spring Boot，其他模式代理到部署後端
  const target = mode === 'local' || mode === 'development' ? 'http://localhost:8080' : 'https://api.soloproject.site';

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
        // Proxy the OAuth2 endpoints so a redirect to `${window.origin}/oauth2/authorization/...`
        // will be forwarded to the backend. Keep changeOrigin=false so the Host
        // header remains the dev server origin (required to construct matching
        // redirect_uri values during the OAuth flow).
        '/oauth2': {
          target,
          changeOrigin: false,
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