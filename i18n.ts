

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // 使用 i18next-http-backend 從伺服器加載翻譯文件
  .use(HttpBackend)
  // 啟用語言偵測器，會自動記住用戶語言
  .use(LanguageDetector)
  // 將 i18n 實例傳遞給 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    // lng: 'zh-Hant', // 移除這行，讓偵測器生效
    fallbackLng: 'zh-Hant', // 第一次預設繁中
    debug: false, // 設為 true 可在開發時啟用調試模式
    ns: ['translation'], // 命名空間
    defaultNS: 'translation', // 預設命名空間

    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },

    backend: {
      // 使用 Vite 的環境變數來構建絕對路徑，確保在任何部署環境下都能正確加載
      loadPath: `${(import.meta as any).env.BASE_URL}locales/{{lng}}/{{ns}}.json`,
    },

    interpolation: {
      escapeValue: false, // React 已有 XSS 保護，無需轉義
    },
    
    react: {
      useSuspense: true, // 推薦在 React 中使用 Suspense
    }
  });

// 導出配置好的 i18n 實例
export { i18n };