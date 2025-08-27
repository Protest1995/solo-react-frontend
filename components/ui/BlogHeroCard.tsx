// 引入 React 相關鉤子
import React, { useState, useCallback, useEffect } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion, AnimatePresence } from 'framer-motion';
// 引入 Swiper 相關組件和模塊
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperCore } from 'swiper';
import { EffectFade, Navigation, Autoplay } from 'swiper/modules';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入動畫變體
import { fadeInUpItemVariants } from '../../animationVariants';
// 引入圖標組件
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
// 引入工具函數，用於移除 Markdown 格式
import { stripMarkdown, getOptimizedImageUrl } from '../../utils';

// 輪播卡片屬性介面
interface BlogHeroCarouselProps {
  posts: BlogPostData[]; // 文章列表
  navigateTo: (page: Page, data?: BlogPostData) => void; // 導航函數
  isMobileView: boolean;
}

// 單個輪播頁的內部組件
const SingleSlide: React.FC<{ post: BlogPostData; isActive: boolean; onClick: () => void; isMobileView: boolean; }> = ({ post, isActive, onClick, isMobileView }) => {
  const { t, i18n } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    // 僅在行動裝置視圖且當前投影片為活動狀態時應用此效果
    if (isMobileView && isActive) {
      // 延遲 1 秒後，激活懸停效果
      timeoutId = setTimeout(() => {
        setIsHovered(true);
      }, 1000);
    } else {
      // 如果投影片變為非活動狀態或不是行動裝置視圖，則重置懸停效果
      setIsHovered(false);
    }

    // 清理函數，用於清除計時器，防止在組件卸載或依賴項變化時觸發
    return () => clearTimeout(timeoutId);
  }, [isActive, isMobileView]);

  // 根據語言選擇顯示的標題和摘要
  const { displayTitle, displayExcerpt } = React.useMemo(() => {
    const title = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    const rawContent = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || '');
    const excerpt = stripMarkdown(rawContent);
    return { displayTitle: title, displayExcerpt: excerpt };
  }, [post, t, i18n.language]);

  // 定義內容和圖片的動畫變體
  const contentVariants = {
    inactive: {}, // No opacity, just a container for stagger
    active: { transition: { staggerChildren: 0.2, delayChildren: 0.4, ease: "easeOut" as const } },
  };
  
  // 標題和摘要的動畫變體
  const textItemVariants = {
    inactive: { opacity: 0, y: 20 },
    active: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  // 按鈕的動畫變體，起始位置稍微高一些
  const buttonVariants = {
    inactive: { opacity: 0, y: 10 },
    active: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  const imageVariants = {
    inactive: { scale: 1.15, transition: { duration: 8, ease: 'linear' as const } },
    active: { scale: 1, transition: { duration: 8, ease: 'linear' as const } }
  };

  return (
    <div className={`w-full h-full relative overflow-hidden group ${(isHovered || isButtonHovered) ? 'force-hover' : ''}`}>
        {/* 背景圖片，帶有緩慢的縮放動畫（Ken Burns 效果）*/}
        <motion.img
          key={post.id + "-img"}
          src={getOptimizedImageUrl(post.imageUrl, 1920)}
          alt={displayTitle}
          className="absolute inset-0 w-full h-full max-w-full max-h-full object-cover"
          variants={imageVariants}
          initial="inactive"
          animate={isActive ? "active" : "inactive"}
        />
        {/* 遮罩層，增強文字可讀性 */}
        <div className="absolute inset-0 bg-black opacity-40" />
        {/* 內容區域 */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-8">
            <motion.div
              className="hero-content-container max-w-3xl w-full text-center flex flex-col items-center"
              variants={contentVariants}
              initial="inactive"
              animate={isActive ? "active" : "inactive"}
            >
                <motion.h2 className="hero-title font-playfair text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight" variants={textItemVariants}>
                    {displayTitle}
                </motion.h2>
                <motion.p className="text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto line-clamp-3 mb-8" variants={textItemVariants}>
                      {displayExcerpt}
                </motion.p>
                <motion.button
                    onClick={onClick}
                    className="btn-hero-neon px-8 py-3 text-lg font-semibold rounded-full transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:ring-custom-cyan transform-gpu"
                    variants={buttonVariants}
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                >
                  {t('blogPage.startReading')}
                </motion.button>
            </motion.div>
        </div>
    </div>
  );
};

/**
 * 部落格英雄區塊輪播組件。
 * 使用 Swiper 庫來實現文章的淡入淡出輪播效果，並帶有自訂的導航按鈕。
 */
const BlogHeroCard: React.FC<BlogHeroCarouselProps> = ({ posts, navigateTo, isMobileView }) => {
  // 狀態：追蹤當前活動的文章數據（當前實現中未使用，但保留供未來擴展）
  const [activePost, setActivePost] = useState<BlogPostData | null>(posts[0] || null);

  // 當輪播切換時，更新活動的文章
  const handleSlideChange = useCallback((swiper: SwiperCore) => {
    if (posts.length > 0) {
      setActivePost(posts[swiper.realIndex]);
    }
  }, [posts]);

  // 如果沒有文章，則不渲染任何內容
  if (!posts || posts.length === 0) {
    return null;
  }
  
  return (
    <motion.div className="relative blog-hero-swiper group" variants={fadeInUpItemVariants}>
      <Swiper
        // 啟用所需模塊
        modules={[EffectFade, Navigation, Autoplay]}
        // Swiper 選項
        effect="fade" // 使用淡入淡出效果
        fadeEffect={{ crossFade: true }} // 啟用交叉淡入淡出
        loop={true} // 啟用無限循環
        autoplay={{ 
          delay: 8000, // 自動播放延遲 8 秒
          disableOnInteraction: false, // 用戶交互後不停止自動播放
        }}
        // 將導航按鈕綁定到自訂的 DOM 元素
        navigation={{ 
          nextEl: '.swiper-button-next-custom', 
          prevEl: '.swiper-button-prev-custom' 
        }}
        className="h-full"
        onSlideChange={handleSlideChange} // slide 切換時的回調
        onSwiper={handleSlideChange} // Swiper 初始化時的回調，用於設置初始 activePost
      >
        {posts.map((post) => (
          <SwiperSlide key={post.id}>
            {({ isActive }) => (
              // 渲染單個 slide，並傳入 isActive 狀態以觸發動畫
              <SingleSlide post={post} isActive={isActive} onClick={() => navigateTo(Page.BlogPostDetail, post)} isMobileView={isMobileView} />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      {/* 自訂導航按鈕：懸停在輪播容器上時顯示 */}
      <AnimatePresence>
        <motion.div className="swiper-button-prev-custom opacity-0 group-hover:opacity-100 transition-opacity duration-300" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{delay: 0.2}}>
          <ChevronLeftIcon className="w-7 h-7" />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        <motion.div className="swiper-button-next-custom opacity-0 group-hover:opacity-100 transition-opacity duration-300" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{delay: 0.2}}>
          <ChevronRightIcon className="w-7 h-7" />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default BlogHeroCard;