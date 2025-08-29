import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
import { BlogPostData, Page } from '../../types';
import { sectionDelayShow, fadeInUpItemVariants, staggerContainerVariants } from '../../animationVariants';
import BlogHeroCard from '../ui/BlogHeroCard';
import { blogCategoryDefinitions } from '../data/blogData';
import PostcardCarousel from '../ui/PostcardCarousel';
import BlogTabs from '../ui/BlogTabs';
import BlogCard from '../ui/BlogCardMasonry';
import SectionTitle from '../ui/SectionTitle';
import TopicCard from '../ui/TopicCard';
import SectionDivider from '../ui/SectionDivider';
import PlusIcon from '../icons/PlusIcon';


// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 定義 BlogPage 組件的屬性介面
export const BlogPage: React.FC<{
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  allPosts: BlogPostData[]; // 從 App 組件傳入的所有部落格文章數據
  onDeletePosts: (postIds: string[]) => void; // 刪除文章的回調函數
  isSuperUser: boolean; // 用戶是否為超級管理員
  navigateToLogin: () => void; // 導航到登入頁的函數
  isMobileView: boolean;
}> = ({ navigateTo, allPosts, onDeletePosts, isSuperUser, navigateToLogin, isMobileView }) => {
  // 使用 useTranslation 鉤子來獲取翻譯函數 t
  const { t } = useTranslation();
  
  // --- 狀態管理 (useState) ---
  
  // `activeTabKey` 用於追蹤當前選中的分類標籤頁。預設為第一個分類。
  const [activeTabKey, setActiveTabKey] = useState(blogCategoryDefinitions[0].titleKey);

  // --- 計算屬性 (useMemo) ---

  // `sortedPosts` 使用 useMemo 進行性能優化，只有在 `allPosts` 改變時才重新排序。
  // 所有文章按創建時間戳 (`createdAt`) 降序排列，最新的文章會排在最前面。
  const sortedPosts = useMemo(() => 
    [...allPosts].sort((a, b) => b.createdAt - a.createdAt),
  [allPosts]);

  // `heroPosts` 選取最新排序後的前 6 篇文章，用於頁面頂部的英雄區塊輪播。
  const heroPosts = sortedPosts.slice(0, 6);
  
  // `postcardPosts` 選取英雄區塊之後的 12 篇文章，用於明信片風格的輪播。
  const postcardPosts = useMemo(() => sortedPosts.slice(6, 18), [sortedPosts]);
  
  // `tabs` 從 `blogCategoryDefinitions` 中生成標籤頁所需的數據結構。
  const tabs = useMemo(() => 
    blogCategoryDefinitions.map(def => ({ key: def.titleKey, titleKey: def.titleKey })), 
  []);

  // `topicsData` 為“相關話題”區塊生成數據，將分類定義與對應的圖片路徑結合。
  const topicsData = [
    {
      ...blogCategoryDefinitions[0], // 攝影
      image: '/images/photography.jpg',
    },
    {
      ...blogCategoryDefinitions[1], // Solo學習日記
      image: '/images/diary.jpg',
    },
    {
      ...blogCategoryDefinitions[2], // 工具分享
      image: '/images/tools.jpg',
    },   
  ];
  
  const topicsContainerRef = useRef<HTMLDivElement>(null);
  const [centeredTopicKey, setCenteredTopicKey] = useState<string | null>(null);
  // Refs for mobile swipe in Latest Posts area
  const latestPostsRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchHandledRef = useRef(false);

  useEffect(() => {
    const container = topicsContainerRef.current;
    if (!isMobileView || !container) {
      setCenteredTopicKey(null);
      return;
    }

    let timeoutId: number;

    const findCenterCard = () => {
      const viewportCenter = window.innerWidth / 2;
      let closestChild: { element: HTMLElement, distance: number } | null = null;

      for (const child of container.children) {
        const childEl = child as HTMLElement;
        const childRect = childEl.getBoundingClientRect();
        if (childRect.right < 0 || childRect.left > window.innerWidth) continue;
        
        const childCenter = childRect.left + (childRect.width / 2);
        const distance = Math.abs(viewportCenter - childCenter);

        if (!closestChild || distance < closestChild.distance) {
          closestChild = { element: childEl, distance };
        }
      }

      if (closestChild) {
        const key = closestChild.element.dataset.key;
        if (key && key !== centeredTopicKey) {
          setCenteredTopicKey(key);
        }
      }
    };

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(findCenterCard, 100);
    };

    findCenterCard();
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [isMobileView, centeredTopicKey]);


  // `postsForActiveTab` 根據當前活動的標籤 (`activeTabKey`) 過濾出對應分類的文章。
  // 它會查找當前標籤的分類定義，然後從所有已排序的文章中篩選出屬於該分類的文章，並只取前 4 篇。
  const postsForActiveTab = useMemo(() => {
    const activeCategoryDef = blogCategoryDefinitions.find(def => def.titleKey === activeTabKey);
    if (!activeCategoryDef) return [];
    
    return sortedPosts
      .filter(post => post.categoryKey && activeCategoryDef.categoryKeys.includes(post.categoryKey))
      .slice(0, 4); // 只取前4篇
  }, [activeTabKey, sortedPosts]);

  // Add mobile-only swipe support for the Latest Posts section (three tabs)
  useEffect(() => {
    const el = latestPostsRef.current;
    if (!el || !isMobileView) return;

    const HORIZONTAL_THRESHOLD = 60;

    const onTouchStart = (ev: TouchEvent) => {
      const t = ev.touches[0];
      touchStartXRef.current = t.clientX;
      touchStartYRef.current = t.clientY;
      touchHandledRef.current = false;
    };

    const onTouchEnd = (ev: TouchEvent) => {
      if (touchHandledRef.current) return;
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      if (startX === null || startY === null) return;

      const t = ev.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (Math.abs(dx) < HORIZONTAL_THRESHOLD || Math.abs(dx) <= Math.abs(dy) * 1.5) return;

      const currentIndex = tabs.findIndex(t => t.key === activeTabKey);
      if (dx < 0) {
        // swipe left -> next
        const nextIndex = Math.min(tabs.length - 1, currentIndex + 1);
        if (nextIndex !== currentIndex) setActiveTabKey(tabs[nextIndex].key);
      } else {
        // swipe right -> prev
        const prevIndex = Math.max(0, currentIndex - 1);
        if (prevIndex !== currentIndex) setActiveTabKey(tabs[prevIndex].key);
      }

      touchHandledRef.current = true;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchend', onTouchEnd as any);
    };
  }, [isMobileView, activeTabKey, tabs]);

  // --- 渲染 (JSX) ---
  return (
    <div className="space-y-8">
      {/* 英雄區塊：只有在有文章時才渲染 */}
      {heroPosts.length > 0 && (
        <motion.div 
          // 負邊距用於抵消父容器的 padding，使英雄區塊能夠全寬顯示
          className="-m-6 md:-m-12"
          // 使用 Framer Motion 實現延遲載入動畫
          variants={sectionDelayShow(0)} 
          initial="initial" 
          animate="animate"
        >
          <BlogHeroCard posts={heroPosts} navigateTo={navigateTo} isMobileView={isMobileView} />
        </motion.div>
      )}

      {/* 明信片風格的輪播區塊 */}
      {postcardPosts.length > 0 && (
        <motion.section
          className="pt-8 md:pt-0"
          variants={fadeInUpItemVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionDivider title={t('blogPage.trendingNow')} />
          <PostcardCarousel posts={postcardPosts} navigateTo={navigateTo} />
        </motion.section>
      )}

      {/* 話題/分類區塊 */}
      <motion.section {...sectionDelayShow(0.2)}>
        <SectionDivider title={t('blogPage.relatedTopics')} />
        <motion.div
          ref={topicsContainerRef}
          className="flex flex-nowrap overflow-x-auto space-x-6 py-4 -mx-6 px-6 snap-x snap-mandatory hide-scrollbar lg:grid lg:grid-cols-3 lg:gap-6 lg:space-x-0 lg:p-0 lg:m-0"
          variants={staggerContainerVariants(0.1, 0.3)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          {topicsData.map((topic) => (
            <motion.div 
              key={topic.titleKey} 
              variants={fadeInUpItemVariants}
              data-key={topic.titleKey}
              className="w-4/5 flex-shrink-0 snap-center sm:w-2/3 md:w-1/2 lg:w-auto"
            >
              <TopicCard
                titleKey={topic.titleKey}
                image={topic.image}
                onClick={() => navigateTo(Page.CategoryPage, topic)}
                isCentered={isMobileView && centeredTopicKey === topic.titleKey}
                isMobileView={isMobileView}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* 分類標籤頁與文章列表 */}
      <section className="max-w-7xl mx-auto">
        <motion.div 
            className="flex justify-between items-center pt-0 md:pt-8 pb-8"
            variants={staggerContainerVariants(0.1, 0.2)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
          >
          <motion.h3 className="text-2xl font-semibold text-theme-primary" variants={fadeInUpItemVariants}>
            {t('blogPage.latestPosts')}
          </motion.h3>
          {isSuperUser && (
            <motion.button 
              onClick={() => navigateTo(Page.AddBlogPost)}
              className="button-theme-accent font-semibold py-2 px-4 rounded-md flex items-center transition-all whitespace-nowrap"
              variants={fadeInUpItemVariants}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              <span>{t('blogPage.addButton')}</span>
            </motion.button>
          )}
        </motion.div>
        <motion.div
          ref={latestPostsRef}
          variants={staggerContainerVariants(0.1, 0.2)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={fadeInUpItemVariants}>
            <BlogTabs 
              tabs={tabs}
              activeTabKey={activeTabKey}
              onTabClick={setActiveTabKey}
            />
          </motion.div>
          {/* AnimatePresence 用於處理切換標籤時文章列表的進入和退出動畫 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabKey} // key 的改變會觸發 AnimatePresence 的動畫
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }}
            >
              {postsForActiveTab.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {postsForActiveTab.map(post => (
                    <BlogCard 
                      key={post.id}
                      post={post}
                      onClick={() => navigateTo(Page.BlogPostDetail, post)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-theme-secondary py-10">{t('blogPage.noPostsFound')}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 如果沒有任何文章，顯示提示信息 */}
      {allPosts.length === 0 && (
        <p className="text-center text-theme-secondary py-10">{t('blogPage.noPostsFound')}</p>
      )}      
      <hr className="my-12 border-theme-primary" />      
    </div>
  );
};