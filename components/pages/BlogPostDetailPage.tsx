import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Page, BlogPostData, Comment, UserProfile, CategoryInfo } from '../../types';
import { ACCENT_FOCUS_VISIBLE_RING_CLASS } from '../../constants';
import PencilIcon from '../icons/PencilIcon';
import CommentSection from '../ui/CommentSection'; 
import PenPaperIcon from '../icons/PenPaperIcon';
import { getCategoryInfoFromKey } from '../data/blogData';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import PostNavigation from '../ui/PostNavigation';
import { getOptimizedImageUrl } from '../../utils';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 自訂的 rehype-sanitize schema，用於允許在 Markdown 內容中使用 iframe (例如嵌入 YouTube 影片)
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    iframe: [
      'src',
      'width',
      'height',
      'frameborder',
      'allow',
      'allowfullscreen',
      'allowFullScreen', 
      'title',
      'referrerpolicy',
    ],
  },
};

// 定義 BlogPostDetailPage 組件的屬性介面
interface BlogPostDetailPageProps {
  post: BlogPostData; // 當前要顯示的文章數據
  allPosts: BlogPostData[]; // 所有文章列表，用於前後文導航
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  isAuthenticated: boolean; // 用戶是否登入
  comments: Comment[]; // 與此文章相關的留言列表
  onAddComment: (postId: string, text: string, parentId?: string | null) => void; // 新增留言的回調
  onDeleteComment: (commentId: string) => void; // 刪除留言的回調
  isSuperUser: boolean; // 是否為超級管理員
  currentUserProfile: UserProfile; // 當前登入用戶的資料
  originCategoryInfo: CategoryInfo | null; // 用戶是從哪個分類頁面導航過來的，若無則為 null
}

/**
 * 部落格文章詳情頁組件 (BlogPostDetailPage)。
 * 此組件負責渲染單一篇文章的完整內容，包括：
 * - 全螢幕的英雄區塊，顯示封面圖片和標題。
 * - 一個固定的導航欄，包含返回按鈕和麵包屑導航。
 * - 使用 Markdown 渲染器顯示文章正文。
 * - 文章前後導航，方便閱讀。
 * - 一個完整的留言區塊。
 */
const BlogPostDetailPage: React.FC<BlogPostDetailPageProps> = ({ 
  post, 
  allPosts,
  navigateTo, 
  isAuthenticated,
  comments,
  onAddComment,
  onDeleteComment,
  isSuperUser,
  currentUserProfile,
  originCategoryInfo // 雖然接收了此 prop，但在當前實現中未使用，保留供未來擴展
}) => {
  // 使用翻譯和導航鉤子
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // 狀態：Markdown 編輯器的主題模式
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // --- 副作用 (useEffect) ---
  
  // 當文章 ID 改變時（即導航到一篇新文章），自動將頁面滾動到頂部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [post.id]); 

  // 監聽應用程式的主題變化，以同步更新 Markdown 渲染器的顏色模式
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      setColorMode(newMode);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const initialMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    setColorMode(initialMode);
    return () => observer.disconnect();
  }, []);

  // 新增：監聽滾動事件以觸發毛玻璃效果
  useEffect(() => {
    const handleScroll = () => {
      // 如果滾動距離大於 50px，則設定 isScrolled 為 true
      setIsScrolled(window.scrollY > 50);
    };

    // 添加滾動事件監聽器
    window.addEventListener('scroll', handleScroll, { passive: true });
    // 初始加載時檢查一次，以處理頁面刷新時已經滾動的情況
    handleScroll();

    // 組件卸載時移除監聽器，避免內存洩漏
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // --- 計算屬性 (useMemo) ---

  // 根據文章的 categoryKey 獲取完整的分類資訊
  const categoryInfo = useMemo(() => getCategoryInfoFromKey(post.categoryKey), [post.categoryKey]);

  // 根據當前語言設置，計算要顯示的標題、內容和分類名稱
  const { displayTitle, displayContent, postCategory } = useMemo(() => {
    let title: string, content: string, category: string;

    // 如果是繁體中文環境且中文標題存在，則使用中文標題，否則使用英文標題或後備文本
    title = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    content = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || t('blogPage.noContent'));
    // 獲取分類的翻譯文本
    category = categoryInfo ? t(categoryInfo.titleKey) : (post.categoryKey ? t(post.categoryKey) : 'Uncategorized');

    return { 
        displayTitle: title, 
        displayContent: content, 
        postCategory: category
    };
  }, [post, t, i18n.language, categoryInfo]);

  // --- 動畫變體 (Animation Variants) ---
  const heroContentContainerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.2, // 子元素之間的動畫延遲
        delayChildren: 0.4,   // 第一個子元素開始前的延遲
      }
    }
  };

  const heroContentItemVariants = {
    initial: { opacity: 0, scale: 0.8, y: 10 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1] as const, // 使用平滑的 ease-out 曲線
      }
    }
  };


  // --- 渲染 (JSX) ---
  return (
    // 使用負邊距抵消父容器的 padding，使英雄區塊能夠全寬顯示
    <div className="-m-6 md:-m-12">
        {/* 英雄區塊 */}
        <div className="relative h-screen min-h-[500px] text-white flex items-center justify-center">
            {/* 背景圖片 */}
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${getOptimizedImageUrl(post.imageUrl, 1920)})` }}
            />
            {/* 黑色遮罩層，增強文字可讀性 */}
            <div className="absolute inset-0 bg-black opacity-60" />
            {/* 內容容器 */}
            <motion.div 
                className="relative z-10 text-center max-w-4xl p-8"
                variants={heroContentContainerVariants}
                initial="initial"
                animate="animate"
            >
                <motion.h1 
                    className="text-4xl md:text-6xl font-extrabold leading-tight mb-4"
                    variants={heroContentItemVariants}
                >
                    {displayTitle}
                </motion.h1>
                <motion.div 
                    className={`text-sm font-medium uppercase tracking-wider text-custom-cyan`}
                    variants={heroContentItemVariants}
                >
                    <span>{new Date(post.date).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="mx-2">/</span>
                    <span>{postCategory}</span>
                    <span className="mx-2">/</span>
                    <span>{t('blogPage.writtenBy')} {t('sidebar.profileName')}</span>
                </motion.div>
            </motion.div>
        </div>

        {/* 固定的導航/操作欄 */}
        <div className={`py-3 sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-glass border-b border-theme-primary' : 'bg-transparent'}`}>
             <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-4">
                {/* 左側：麵包屑導航 */}
                <div className="min-w-0">
                    <div className="text-sm text-theme-secondary flex flex-wrap items-center space-x-2 pl-[calc(1rem+0.375rem)]">
                        <Link to="/blog" className="flex items-center hover:text-custom-cyan transition-colors flex-shrink-0 ml-[calc(-1rem-0.375rem)]">
                            <PenPaperIcon className="w-4 h-4 mr-1.5" />
                            <span>{t('blogPage.viewAll')}</span>
                        </Link>
                        {categoryInfo && (
                            <>
                                <span className="flex-shrink-0">&gt;</span>
                                <Link to={`/blog/category/${categoryInfo.titleKey.split('.').pop()}`} className="hover:text-custom-cyan transition-colors truncate">
                                    <span>{postCategory}</span>
                                </Link>
                            </>
                        )}
                        <span className="flex-shrink-0">&gt;</span>
                        <span className="text-theme-primary truncate">{displayTitle}</span>
                    </div>
                </div>
                {/* 右側：編輯按鈕 (僅對超級管理員顯示) */}
                <div className="flex justify-end flex-shrink-0">
                    {isSuperUser && (
                      <button
                        onClick={() => navigateTo(Page.EditBlogPost, post)}
                        className={`inline-flex items-center justify-center p-2 rounded-full text-theme-primary hover:text-custom-cyan transition-colors duration-200 focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`}
                        aria-label={t('blogPage.editButton')}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    )}
                </div>
            </div>
        </div>

        {/* 主要文章內容 */}
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
            <div className="w-full lg:w-4/5 mx-auto">
                <article className="space-y-8">
                    {/* 使用 Markdown 渲染器顯示文章正文 */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} data-color-mode={colorMode}>
                         <MDEditor.Markdown 
                            source={displayContent}
                            rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                            style={{ backgroundColor: 'transparent' }}
                            // prose-custom-styles 應用在 index.html 中定義的自訂文章樣式
                            className="prose prose-lg lg:prose-xl max-w-none prose-custom-styles"
                         />
                    </motion.div>

                    {/* 上一篇/下一篇文章導航 */}
                    <div className="border-t border-theme-primary">
                        <PostNavigation currentPost={post} allPosts={allPosts} />
                    </div>
                    
                    {/* 留言區塊 */}
                    <CommentSection
                        postId={post.id}
                        comments={comments}
                        isAuthenticated={isAuthenticated}
                        currentUserProfile={currentUserProfile}
                        onAddComment={onAddComment}
                        onDeleteComment={onDeleteComment}
                        isSuperUser={isSuperUser}
                        onLoginClick={() => navigateTo(Page.Login)}
                    />
                </article>
            </div>
        </div>
    </div>
  );
};

export default BlogPostDetailPage;