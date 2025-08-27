// 引入 React
import React from 'react';
// 引入 Swiper 相關組件
import { Swiper, SwiperSlide } from 'swiper/react';
// 引入 Swiper 的 Autoplay 模塊
import { Autoplay } from 'swiper/modules';
// 引入類型定義和子組件
import { BlogPostData, Page } from '../../types';
import Postcard from './Postcard';

// 組件屬性介面
interface PostcardCarouselProps {
  posts: BlogPostData[]; // 要顯示的文章列表
  navigateTo: (page: Page, data?: any) => void; // 導航函數
}

/**
 * 明信片風格文章輪播組件。
 * 使用 Swiper 庫來創建一個響應式的、自動播放的文章輪播。
 * 在移動端，它會顯示一個居中的、較大的卡片，兩側露出部分相鄰卡片。
 * 其樣式主要由 `index.html` 中的 `.postcard-carousel` 相關 class 定義。
 */
const PostcardCarousel: React.FC<PostcardCarouselProps> = ({ posts, navigateTo }) => {
  // 如果沒有文章，則不渲染任何內容
  if (!posts || posts.length === 0) return null;

  return (
    <div className="postcard-carousel">
      <Swiper
        // Swiper 模塊
        modules={[Autoplay]}
        // Swiper 選項
        loop={true} // 啟用無限循環
        centeredSlides={true} // 在移動端居中活動的 slide
        slidesPerView={'auto'} // 自動計算每頁顯示的 slide 數量，用於實現 "peek" 效果
        spaceBetween={15} // slide 之間的間距（移動端）
        autoplay={{
          delay: 3000, // 自動播放延遲 3 秒
          disableOnInteraction: false, // 用戶交互後不停止自動播放
        }}
        // 響應式斷點設置，根據螢幕寬度調整每頁顯示的 slide 數量
        breakpoints={{
          // 螢幕寬度 >= 1024px (桌面)
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
            centeredSlides: false, // 在桌面上取消居中
          },
        }}
      >
        {posts.map((post) => (
          <SwiperSlide key={post.id}>
            {/* 在每個 slide 中渲染一個 Postcard 組件 */}
            <Postcard post={post} navigateTo={navigateTo} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PostcardCarousel;