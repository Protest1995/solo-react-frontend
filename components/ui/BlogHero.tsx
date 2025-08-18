// 引入 React 相關鉤子
import React, { useState } from 'react';
// 引入翻譯鉤子和類型
import { useTranslation } from 'react-i18next';
import { i18n as I18n, TFunction } from 'i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入圖標組件
import NewspaperIcon from '../icons/NewspaperIcon';
// 引入 Framer Motion 動畫庫
import { AnimatePresence, motion } from 'framer-motion';
// 引入 Swiper 相關組件和模塊
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperCore } from 'swiper';

// --- 可重用的內部組件 ---

// BreakingNewsItem 組件屬性介面
interface BreakingNewsItemProps {
  post: BlogPostData; // 文章數據
  navigateTo: (page: Page, data: BlogPostData) => void; // 導航函數
  t: TFunction; // 翻譯函數
  i18n: I18n; // i18n 實例
}

// "最新消息" 列表項組件，用於英雄區塊的側邊欄
const BreakingNewsItem: React.FC<BreakingNewsItemProps> = ({ post, navigateTo, t, i18n }) => {
    // 根據當前語言選擇顯示的標題
    const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    // 格式化日期
    const formattedDate = new Date(post.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div 
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => navigateTo(Page.BlogPostDetail, post)}
        >
            <img src={post.imageUrl} alt={displayTitle} className="w-14 h-10 object-cover rounded flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <h4 className="text-sm font-semibold leading-tight text-white group-hover:text-custom-cyan transition-colors truncate">{displayTitle}</h4>
                <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
            </div>
        </div>
    );
};

// SingleHeroSlide 組件屬性介面
interface SingleHeroSlideProps {
    post: BlogPostData; // 文章數據
    isActive: boolean; // 此 slide 是否為當前活動 slide
    navigateTo: (page: Page, data: BlogPostData) => void; // 導航函數
    t: TFunction; // 翻譯函數
    i18n: I18n; // i18n 實例
}

// 單個輪播頁面組件
const SingleHeroSlide: React.FC<SingleHeroSlideProps> = ({ post, isActive, navigateTo, t, i18n }) => {
    // 定義內容和子項目的進入/退出動畫
    const contentVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const, staggerChildren: 0.2 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" as const } },
    };
    
    const itemVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
    };

    // 輔助函數：根據語言和數據完整性獲取要顯示的值
    const getDisplayValue = (primaryValue: string | null | undefined, secondaryValue: string | null | undefined, fallbackKey: string) => {
        if (primaryValue && primaryValue.trim()) return primaryValue;
        if (secondaryValue && secondaryValue.trim()) return secondaryValue;
        return t(fallbackKey);
    };

    // 獲取多語言標題和摘要
    const featuredTitle = i18n.language === 'zh-Hant'
        ? getDisplayValue(post.titleZh, post.title, 'blogPage.untitledPost')
        : getDisplayValue(post.title, post.titleZh, 'blogPage.untitledPost');

    const featuredExcerpt = (i18n.language === 'zh-Hant'
        ? getDisplayValue(post.excerptZh, post.excerpt, 'blogPage.noExcerpt')
        : getDisplayValue(post.excerpt, post.excerptZh, 'blogPage.noExcerpt')
    ).replace(/<[^>]*>?/gm, ''); // 移除 HTML 標籤
    
    return (
        <div className="w-full h-full">
            {/* 背景圖片，帶有淡入和縮放動畫 */}
            <motion.div
                key={post.id + '-bg'}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.imageUrl})` }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: isActive ? 1 : 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' as const }}
            />
            {/* 漸變遮罩層，增強文字可讀性 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* 內容區域 */}
            <div className="absolute inset-x-0 bottom-12 z-10 px-4">
                 <AnimatePresence>
                    {isActive && (
                        <motion.div 
                            key={post.id + '-content'} 
                            variants={contentVariants} 
                            initial="initial" 
                            animate="animate" 
                            exit="exit"
                            className="max-w-3xl mx-auto text-center flex flex-col items-center"
                        >
                           <motion.span variants={itemVariants} className="bg-category-hot text-white text-xs font-bold uppercase px-3 py-1 rounded-md mb-4 inline-block">{t('blogPage.hotNow')}</motion.span>
                            <motion.h1 variants={itemVariants} className="text-3xl md:text-5xl font-bold leading-tight text-white font-playfair">
                                {featuredTitle}
                            </motion.h1>
                            <motion.p variants={itemVariants} className="mt-4 text-gray-300 text-sm md:text-base hidden sm:block line-clamp-2 max-w-2xl">{featuredExcerpt}</motion.p>
                             <motion.div variants={itemVariants} className="mt-8">
                                <button
                                    onClick={() => navigateTo(Page.BlogPostDetail, post)}
                                    className="px-6 py-3 bg-white text-black dark:bg-black dark:text-white rounded-lg font-semibold transition-opacity hover:opacity-90 shadow-lg"
                                >
                                    {t('blogPage.startReading')}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


// --- 主要的 BlogHero 組件 ---

// 組件屬性介面
interface BlogHeroProps {
    posts: BlogPostData[]; // 文章列表
    navigateTo: (page: Page, data: BlogPostData) => void; // 導航函數
}

/**
 * 部落格頁面的英雄區塊組件。
 * 使用 Swiper.js 實現一個穩定、可靠且具備淡入淡出效果的文章輪播。
 */
const BlogHero: React.FC<BlogHeroProps> = ({ posts, navigateTo }) => {
    // 將 useTranslation 提升到父組件層級，以便傳遞給子組件
    const { t, i18n } = useTranslation();
    const [swiper, setSwiper] = useState<SwiperCore | null>(null); // 存儲 Swiper 實例
    const [realIndex, setRealIndex] = useState(0); // 存儲當前活動 slide 的真實索引

    // 如果沒有文章數據，則不渲染任何內容
    if (!posts || posts.length === 0) {
        return null; 
    }

    // 計算要在側邊欄顯示的“即將發佈”文章列表
    const upcomingPosts = posts.length < 2
        ? []
        : Array.from({ length: Math.min(4, posts.length - 1) }, (_, i) => {
            // 計算下一個文章的索引，並使用取模運算實現循環
            const nextIndex = (realIndex + 1 + i) % posts.length;
            return posts[nextIndex];
        });

    return (
        <div className="relative h-72 md:h-[600px] lg:h-screen bg-black -mx-6 md:-mx-12 -mt-6 md:-mt-12 mb-12">
            <Swiper
                modules={[EffectFade, Autoplay]}
                onSwiper={setSwiper} // Swiper 初始化時保存實例
                onSlideChange={(s) => setRealIndex(s.realIndex)} // slide 切換時更新索引
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop={true}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                className="w-full h-full"
            >
                {posts.map((post) => (
                    <SwiperSlide key={post.id}>
                        {({ isActive }) => (
                            // 將翻譯函數和 i18n 實例作為 props 傳遞下去
                            <SingleHeroSlide 
                                post={post} 
                                isActive={isActive} 
                                navigateTo={navigateTo}
                                t={t}
                                i18n={i18n}
                            />
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>
            
            {/* 右側最新文章列表 (僅在桌面端顯示) */}
            {upcomingPosts.length > 0 && (
                <div className="hidden lg:block absolute top-12 right-12 z-20 w-full max-w-sm p-6 bg-black/30 backdrop-blur-md rounded-lg border border-white/10">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-300 mb-4">
                        <NewspaperIcon className="w-4 h-4" />
                        <span>{t('blogPage.breakingNews')}</span>
                    </div>
                    <div className="space-y-4">
                        {upcomingPosts.map(post => (
                            // 傳遞 props 給子組件
                            <BreakingNewsItem 
                                key={post.id} 
                                post={post} 
                                navigateTo={navigateTo}
                                t={t}
                                i18n={i18n}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 自訂分頁器 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center space-x-3">
                {posts.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => swiper?.slideToLoop(index)} // 點擊跳轉到對應的 slide
                        className="relative w-3 h-3 flex items-center justify-center rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        <div className={`w-2 h-2 rounded-full transition-colors ${realIndex === index ? 'bg-custom-cyan' : 'bg-gray-400 bg-opacity-70 group-hover:bg-white'}`} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BlogHero;
