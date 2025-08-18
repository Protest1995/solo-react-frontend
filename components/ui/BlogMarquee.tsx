// 引入 React
import React from 'react';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入 UI 組件
import RecentPostItem from './RecentPostItem';

// 組件屬性介面
interface BlogMarqueeProps {
  posts: BlogPostData[]; // 要顯示的文章列表
  navigateTo: (page: Page, data?: BlogPostData) => void; // 導航函數
  direction?: 'left' | 'right'; // 滾動方向，預設為 'left'
}

/**
 * 部落格文章跑馬燈（Marquee）組件。
 * 創建一個無限循環滾動的文章列表。
 * CSS 樣式定義在 `index.html` 中。
 */
const BlogMarquee: React.FC<BlogMarqueeProps> = ({ posts, navigateTo, direction = 'left' }) => {
  // 如果沒有文章，則不渲染任何內容
  if (!posts || posts.length === 0) {
    return null;
  }

  // 為了實現無縫循環滾動效果，我們將文章列表複製一份並連接起來。
  // 當第一份列表滾動完畢時，第二份列表會無縫銜接上，然後動畫會重置。
  const marqueePosts = [...posts, ...posts];

  // 根據文章數量動態調整動畫時長，以保持滾動速度大致恆定。
  // 這樣無論有多少篇文章，用戶感受到的滾動速度都是相似的。
  const animationDuration = posts.length * 8; // 假設每張卡片大約需要 8 秒的滾動時間

  // 根據滾動方向選擇對應的 CSS 動畫 class
  const animationClass = direction === 'right' ? 'marquee-content-reverse' : 'marquee-content';

  return (
    // 'marquee-container' 提供了左右兩側的淡出遮罩，使滾動看起來更自然
    <div className="marquee-container w-full overflow-hidden relative group">
      <div 
        className={`${animationClass} flex space-x-8 py-4`}
        style={{ animationDuration: `${animationDuration}s` }}
      >
        {marqueePosts.map((post, index) => (
          // 使用唯一的 key，結合 post.id 和 index
          <div key={`${post.id}-${index}`} className="w-80 flex-shrink-0">
            <RecentPostItem
              post={post}
              onClick={() => navigateTo(Page.BlogPostDetail, post)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogMarquee;
