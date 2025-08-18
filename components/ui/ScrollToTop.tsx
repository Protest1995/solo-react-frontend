// 引入 React 相關鉤子
import { useEffect } from 'react';
// 引入 React Router 的 useLocation 鉤子
import { useLocation } from 'react-router-dom';

/**
 * 在每次路由變化時將窗口滾動到頂部的組件。
 * 它還會手動控制瀏覽器的滾動恢復行為，以防止導航時出現“跳躍”現象。
 * 這個組件應該被放置在 Router 組件的內部。
 */
function ScrollToTop() {
  const { pathname } = useLocation(); // 獲取當前的 URL 路徑

  useEffect(() => {
    // 這是解決“雙重刷新”或“跳轉”問題的關鍵。
    // 在每次導航時，我們首先命令瀏覽器不要自動處理滾動恢復。
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
    // 然後，我們手動將頁面滾動到頂部。
    // 這可以防止瀏覽器在我們的代碼來得及反應之前，先“跳轉”到舊的滾動位置。
    window.scrollTo(0, 0);
  }, [pathname]); // 依賴項是 pathname，所以每次 URL 路徑改變時，這個 effect 都會重新運行

  return null; // 這個組件本身不渲染任何 DOM 元素
}

export default ScrollToTop;
