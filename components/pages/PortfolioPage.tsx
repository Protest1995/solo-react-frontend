// 引入 React 相關鉤子和組件
import React, { useState, useMemo, useCallback, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
// 引入類型定義
import { PortfolioItemData, Page } from '../../types'; 
// 引入動畫變體
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants'; 
// 引入瀑布流（Masonry）佈局庫
import Masonry from 'react-masonry-css';
// 引入 UI 組件
import PortfolioCard from '../ui/PortfolioCard';
import Lightbox from '../ui/Lightbox';
import PortfolioSkeletonCard from '../ui/PortfolioSkeletonCard';
import PortfolioCarousel from '../ui/PortfolioCarousel';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import SparklesIcon from '../icons/SparklesIcon';
import CameraIcon from '../icons/CameraIcon';
import CloseIcon from '../icons/CloseIcon';
// 引入 Google Gemini AI SDK
import { GoogleGenAI } from '@google/genai';
// 引入樣式常數
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
// 引入 API 服務，用於與後端進行通信
import { ApiService } from '../../src/services/api';
import { getOptimizedImageUrl } from '../../utils';
import SectionDivider from '../ui/SectionDivider';


// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 新增作品時的分類選項
const addProjectCategoryOptions = [
  { value: 'portfolioPage.filterStreet', labelKey: 'portfolioPage.filterStreet' },
  { value: 'portfolioPage.filterPortrait', labelKey: 'portfolioPage.filterPortrait' },
  { value: 'portfolioPage.filterSport', labelKey: 'portfolioPage.filterSport' },
];

// 定義每頁顯示的項目數量、無限滾動加載的數量
const ITEMS_PER_PAGE = 12; // 初始加載的項目數量
const ITEMS_TO_LOAD = 6;  // 每次無限滾動加載的項目數量

// 作品集頁面的屬性介面
interface PortfolioPageProps {
  userAddedPortfolioItems: PortfolioItemData[]; // 從父組件傳入的用戶添加的作品集項目
  onAddPortfolioItem: (item: PortfolioItemData) => void; // 新增項目後的回調
  onDeletePortfolioItems: (itemIds: string[]) => void; // 刪除項目後的回調
  isAuthenticated: boolean; // 用戶是否登入
  isSuperUser: boolean; // 用戶是否為超級管理員
  navigateToLogin: () => void; // 導航到登入頁的函數
  isLandscape: boolean;
}

// 分類篩選器的選項
const filterCategories = ['portfolioPage.filterAll', 'portfolioPage.filterStreet', 'portfolioPage.filterPortrait', 'portfolioPage.filterSport'];

// 使用 React.memo 優化輪播組件，防止不必要的重新渲染
const MemoizedPortfolioCarousel = React.memo(PortfolioCarousel);

/**
 * 作品集頁面組件 (PortfolioPage)。
 * 負責顯示所有作品集項目，並提供豐富的交互功能。
 * 主要功能包括：
 * - 頂部的特色作品輪播。
 * - 按分類篩選作品。
 * - 使用瀑布流（Masonry）佈局展示作品卡片。
 * - 無限滾動加載更多作品。
 * - 點擊圖片可打開全螢幕燈箱進行瀏覽。
 * - 為超級管理員提供新增、刪除作品的管理功能。
 * - 新增作品時集成 Gemini AI 以自動生成標題。
 */
export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  userAddedPortfolioItems,
  onAddPortfolioItem,
  onDeletePortfolioItems,
  isAuthenticated,
  isSuperUser,
  navigateToLogin,
  isLandscape,
}) => {
  // --- 鉤子 (Hooks) ---
  const { t, i18n } = useTranslation();
  // Ref 用於引用無限滾動的加載觸發器元素
  const loaderRef = useRef<HTMLDivElement>(null);
  // Ref to the main page container to lock height during filtering to avoid layout jumps
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref for the swipeable area (filters + grid)
  const swipeableAreaRef = useRef<HTMLDivElement>(null);
  // Ref for the "My Works" section to trigger reveal on scroll
  const myWorksRef = useRef<HTMLDivElement>(null);
  // Touch refs for swipe detection on mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchHandledRef = useRef(false);


  // --- 狀態管理 (useState) ---
  const [activeFilter, setActiveFilter] = useState<string>('portfolioPage.filterAll'); // 當前激活的分類篩選器
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null); // 當前在燈箱中選中的項目
  const [lightboxItemsSource, setLightboxItemsSource] = useState<PortfolioItemData[] | null>(null); // 傳遞給燈箱的項目列表
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE); // 當前已顯示的項目數量（用於無限滾動）
  const [isLoading, setIsLoading] = useState(true); // 是否正在加載（用於顯示骨架屏）
  const [isFiltering, setIsFiltering] = useState(false); // 新增：是否正在篩選，用於顯示骨架屏
  const [activeIndex, setActiveIndex] = useState(0);

  // 管理員功能相關狀態
  const [isAdding, setIsAdding] = useState(false); // 是否顯示新增表單
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false); // 是否處於刪除模式
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]); // 存儲被選中待刪除的項目 ID
  
  // 表單相關狀態
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoTitleZh, setNewPhotoTitleZh] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false); // AI 是否正在生成標題
  // 是否已進入視口，觸發顯示 My Works 下方的篩選按鈕與卡片
  const [showWorks, setShowWorks] = useState(false);

  // --- 數據處理 (useMemo) ---

  const allPortfolioItems = useMemo(() => 
    [...userAddedPortfolioItems], 
  [userAddedPortfolioItems]);

  // 用於頂部輪播的項目，優先顯示精選項目，然後按日期排序，最多取8個
  const carouselItems = useMemo(() => {
    const sortedForCarousel = [...allPortfolioItems].sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
            return a.isFeatured ? -1 : 1;
        }
        return (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0);
    });
    return sortedForCarousel.slice(0, 8);
  }, [allPortfolioItems]);
  
  const activeCarouselItem = useMemo(() => (
    carouselItems.length > 0 ? carouselItems[activeIndex] : null
  ), [carouselItems, activeIndex]);

  const filteredItems = useMemo(() => {
    // 1. 根據 `activeFilter` 篩選項目
    const filtered = activeFilter === 'portfolioPage.filterAll'
      ? allPortfolioItems
      : allPortfolioItems.filter(item => item.categoryKey === activeFilter);
  
    // 2. 默認按日期降序排序
    return [...filtered].sort((a, b) => {
      return (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0);
    });
  }, [activeFilter, allPortfolioItems]);


  // 獲取當前要顯示的項目（用於無限滾動）
  const itemsToDisplay = useMemo(() => filteredItems.slice(0, displayCount), [filteredItems, displayCount]);
  
  // 重置表單狀態
  const resetForm = useCallback(() => { setNewPhotoTitle(''); setNewPhotoTitleZh(''); setNewPhotoCategory(''); setSelectedFile(null); setPreviewUrl(null); setImageUploadError(null); }, []);

  // --- 處理函數 ---
  
  // 處理管理員操作
  const handleShowAddForm = () => { if (!isSuperUser) { navigateToLogin(); return; } setIsAdding(true); setIsDeleteModeActive(false); setSelectedIdsForDeletion([]); };
  const handleCancelForm = () => { setIsAdding(false); resetForm(); };
  const handleToggleDeleteMode = () => { if (!isSuperUser) { navigateToLogin(); return; } setIsDeleteModeActive(prev => !prev); setSelectedIdsForDeletion([]); setIsAdding(false); };
  const handleDeleteConfirmed = () => { onDeletePortfolioItems(selectedIdsForDeletion); setSelectedIdsForDeletion([]); setIsDeleteModeActive(false); };
  const handleToggleSelectionForDeletion = (id: string) => { setSelectedIdsForDeletion(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]); };
  
  // 全選/取消全選
  const handleSelectAllForDeletion = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) { setSelectedIdsForDeletion(filteredItems.filter(item => !item.isStatic).map(item => item.id)); } else { setSelectedIdsForDeletion([]); }
  };
  
  // 計算可刪除項目的數量
  const deletableItemsCount = useMemo(() => filteredItems.filter(item => !item.isStatic).length, [filteredItems]);
  
  const handleFilterChange = useCallback((newCategoryValue: string) => { 
    if (activeFilter === newCategoryValue) return;

    setActiveFilter(newCategoryValue);
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const currentScrollY = (typeof window !== 'undefined') ? window.scrollY : 0;

    const containerEl = containerRef.current;
    let previousHeight: string | null = null;
    if (containerEl) {
      previousHeight = containerEl.style.height || null;
      const rect = containerEl.getBoundingClientRect();
      containerEl.style.height = `${rect.height}px`;
      containerEl.style.overflow = 'hidden';
    }

    setIsFiltering(true);
    setTimeout(() => {
        setSelectedItem(null);
        setDisplayCount(ITEMS_PER_PAGE);
        setIsFiltering(false);

        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              if (containerEl) {
                if (previousHeight !== null) containerEl.style.height = previousHeight; else containerEl.style.height = '';
                containerEl.style.overflow = '';
              }
              window.scrollTo(0, currentScrollY);
            });
          });
        }
    }, 500);
  }, [activeFilter]);

  // --- 副作用 (useEffect) ---

  // 僅在組件首次掛載時顯示加載骨架
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // 切換篩選器時，重置顯示的項目數量
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [activeFilter]);

  // 無限滾動的 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 當觀察的元素（頁底加載器）進入視口，並且不在加載中，且還有更多項目時
        if (entries[0].isIntersecting && !isLoading && !isFiltering && displayCount < filteredItems.length) {
          // 模擬延遲加載以顯示加載指示器
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + ITEMS_TO_LOAD, filteredItems.length));
          }, 300);
        }
      },
      { rootMargin: "200px" } // 在元素進入視口前 200px 就開始觸發
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    // 組件卸載時清理 observer
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [displayCount, filteredItems.length, isLoading, isFiltering]);

  
  // 燈箱相關操作
  const openLightbox = useCallback((itemToOpen: PortfolioItemData, sourceItems: PortfolioItemData[]) => { if (isDeleteModeActive) return; setSelectedItem(itemToOpen); setLightboxItemsSource(sourceItems); }, [isDeleteModeActive]);
  const closeLightbox = useCallback(() => { setSelectedItem(null); setLightboxItemsSource(null); }, []);

  // Enable left/right swipe to change categories on mobile
  useEffect(() => {
    const el = swipeableAreaRef.current;
    if (!el) return;

    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    if (!isMobile) return;

    const HORIZONTAL_THRESHOLD = 60; // px to consider a swipe
    let isHorizontalSwipe = false; // Flag to track swipe direction

    const onTouchStart = (ev: TouchEvent) => {
      if (isLoading || isFiltering) return;
      const t = ev.touches[0];
      // If touch starts inside the top carousel, ignore so carousel handles it
      const startTargetEl = (t.target as HTMLElement) || null;
      if (startTargetEl?.closest?.('.portfolio-swiper-container')) return;

      touchStartXRef.current = t.clientX;
      touchStartYRef.current = t.clientY;
      touchHandledRef.current = false;
      isHorizontalSwipe = false; // Reset direction flag on new touch
    };
    
    const onTouchMove = (ev: TouchEvent) => {
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      // Exit if touch has not started, has already been handled, or is a multi-touch gesture
      if (startX === null || startY === null || touchHandledRef.current || ev.touches.length > 1) return;

      // Only determine swipe direction once per touch gesture
      if (!isHorizontalSwipe && touchStartXRef.current !== null) {
          const t = ev.touches[0];
          const dx = t.clientX - startX;
          const dy = t.clientY - startY;

          // If horizontal movement is dominant, flag as a horizontal swipe
          if (Math.abs(dx) > Math.abs(dy)) {
              isHorizontalSwipe = true;
          } else {
              // It's a vertical scroll, so we stop tracking this touch for swiping
              touchStartXRef.current = null;
              touchStartYRef.current = null;
              return;
          }
      }
      
      // If it's a horizontal swipe, prevent the default browser action (scrolling, zooming)
      if (isHorizontalSwipe) {
          ev.preventDefault();
      }
    };

    const onTouchEnd = (ev: TouchEvent) => {
      // Only proceed if a horizontal swipe was detected and not already handled
      if (isLoading || isFiltering || touchHandledRef.current || !isHorizontalSwipe) return;

      const startX = touchStartXRef.current;
      if (startX === null) return;
      
      const t = ev.changedTouches[0];
      const dx = t.clientX - startX;

      // Ensure the swipe meets the minimum distance threshold
      if (Math.abs(dx) < HORIZONTAL_THRESHOLD) return;

      const startTarget = ev.target as HTMLElement | null;
      // Do not interfere with carousel or horizontal filter bar swipes
      if (startTarget?.closest?.('.overflow-x-auto') || startTarget?.closest?.('.portfolio-swiper-container')) {
        return;
      }

      const currentIndex = filterCategories.indexOf(activeFilter);
      if (dx < 0) { // Swipe left -> next category
          const nextIndex = Math.min(filterCategories.length - 1, currentIndex + 1);
          if (nextIndex !== currentIndex) handleFilterChange(filterCategories[nextIndex]);
      } else { // Swipe right -> previous category
          const prevIndex = Math.max(0, currentIndex - 1);
          if (prevIndex !== currentIndex) handleFilterChange(filterCategories[prevIndex]);
      }

      touchHandledRef.current = true;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };

    const resetTouch = () => {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchHandledRef.current = true; // Mark as handled to prevent touchend firing
    };

    // Attach listeners
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false }); // Must be non-passive to prevent default
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', resetTouch, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
      el.removeEventListener('touchcancel', resetTouch as any);
    };
  }, [activeFilter, isLoading, isFiltering, handleFilterChange]);

  // Observe the My Works section and reveal filters/cards when scrolled into view
  useEffect(() => {
    if (!myWorksRef.current || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        const e = entries[0];
        if (e.isIntersecting) {
          setShowWorks(true);
          // once revealed, stop observing to avoid toggling
          obs.unobserve(e.target);
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );

    observer.observe(myWorksRef.current);

    return () => {
      if (myWorksRef.current) observer.unobserve(myWorksRef.current);
    };
  }, []);
  
  // 處理文件上傳
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
        setSelectedFile(file);
        setImageUploadError(null);
        
        try {
          // 直接上傳到 Cloudinary
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          
          if (!uploadPreset || !cloudName) {
            throw new Error('缺少 Cloudinary 設定');
          }
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);
          
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary 上傳失敗: ${errorData.error?.message || '未知錯誤'}`);
          }
          
          const result = await response.json();
          // 使用 Cloudinary URL 更新預覽
          setPreviewUrl(result.secure_url);
        } catch (error) {
          console.error('Image upload failed:', error);
          setImageUploadError(t('portfolioPage.imageUploadError'));
          setSelectedFile(null);
          setPreviewUrl(null);
        }
    } else {
        setImageUploadError(t('portfolioPage.imageUploadError'));
        setSelectedFile(null);
        setPreviewUrl(null);
    }
  };

  // 使用 AI 生成標題
  const handleGenerateTitle = async () => {
    if (!previewUrl || isGeneratingTitle) return;
    setIsGeneratingTitle(true);
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
      
      // 從 Cloudinary URL 獲取圖片數據並轉為 base64
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          if (base64Data) resolve(base64Data);
          else reject(new Error("Failed to convert image to base64"));
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional photographer providing a title for a portfolio image. Analyze this image. Provide a concise, artistic, and evocative title. Respond with a single JSON object containing two keys: "titleEn" for the English title and "titleZh" for the Traditional Chinese title. Example: { "titleEn": "Urban Solitude", "titleZh": "城市孤影" }`;
      
      const aiResponse = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash', 
        contents: { parts: [imagePart, { text: prompt }] }, 
        config: { responseMimeType: "application/json" } 
      });
      
      let jsonStr = aiResponse.text?.trim() || '';
      if (!jsonStr) throw new Error("AI response is empty");
      
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.titleEn && parsedData.titleZh) { 
        setNewPhotoTitle(parsedData.titleEn); 
        setNewPhotoTitleZh(parsedData.titleZh); 
      } else { 
        throw new Error("AI response did not contain the expected JSON structure for titles."); 
      }
    } catch (e) {
      console.error("Failed to generate AI title:", e);
      alert("AI title generation failed. Please try again or write one manually.");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // 提交表單（新增）
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPhotoTitle.trim() || !newPhotoTitleZh.trim() || !previewUrl || !newPhotoCategory) { 
      alert(t('portfolioPage.fillAllRequiredFields')); 
      return; 
    }
    
    try {
      // 構建要發送到後端的數據
      const newItemData = {
        imageUrl: previewUrl,
        title: newPhotoTitle,
        titleZh: newPhotoTitleZh,
        categoryKey: newPhotoCategory,
        isFeatured: false
      };
      
      // 調用後端 API
      const newItem = await ApiService.createPortfolioItem(newItemData);
      
      // 調用父組件的回調以更新 App 狀態
      onAddPortfolioItem(newItem);
      handleCancelForm();
    } catch (error) {
      console.error('創建作品項目失敗:', error);
      alert('創建作品項目失敗，請重試');
    }
  };

  // Masonry 佈局的斷點設定
  const breakpointColumnsObj = { default: 4, 1199: 3, 767: 2, 500: 2 };

  // 使用 useCallback 創建一個穩定的點擊處理函數，防止輪播組件不必要的重新渲染
  const handleCarouselClick = useCallback((item: PortfolioItemData) => {
    openLightbox(item, carouselItems);
  }, [openLightbox, carouselItems]);


  // --- 渲染 (JSX) ---
  return (
    <div ref={containerRef}>
      {/* Hero Section */}
      <motion.div
        className="relative -m-6 md:-m-12 px-6 md:px-12 flex flex-col md:min-h-[calc(100vh-4rem)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.5 } }}
      >
        {/* Animated Background */}
        {activeCarouselItem && (
          <AnimatePresence>
            <motion.div
              key={activeCarouselItem.id}
              className="absolute left-0 right-0 top-0 bg-cover bg-center filter blur-lg brightness-50 transform scale-110"
              style={{ 
                backgroundImage: `url(${getOptimizedImageUrl(activeCarouselItem.imageUrl, 1920)})`, 
                bottom: '35%' // Make background 65% height from top
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: 'easeInOut' }}
            />
          </AnimatePresence>
        )}

        {/* Foreground Content */}
        <div className="relative z-10 w-full flex-grow flex flex-col pt-24 md:pt-16 pb-12">
            <motion.div className="flex-shrink-0 text-center" {...sectionDelayShow(0)}>
                <h2 className="text-3xl md:text-4xl font-bold relative inline-block text-gray-100">
                    {t('portfolioPage.title')}
                    <span className="absolute -bottom-2 left-0 w-16 h-1 bg-custom-cyan" />
                </h2>
                <p className="mt-3 text-lg text-gray-300">{t('portfolioPage.subtitle')}</p>
            </motion.div>
            
            <motion.div 
                className="mt-16 flex-grow flex items-center justify-center" 
                variants={fadeInUpItemVariants} 
                initial="initial" 
                animate="animate"
            >
                {isLoading ? (
                <div className="portfolio-swiper-container shimmer-bg rounded-lg"></div>
                ) : (
                <MemoizedPortfolioCarousel 
                    items={carouselItems} 
                    onItemClick={handleCarouselClick}
                    onSlideChange={setActiveIndex} 
                />
                )}
            </motion.div>
        </div>
      </motion.div>
      
      <div ref={swipeableAreaRef}>
        <div className="md:mt-6" ref={myWorksRef}>
          <SectionDivider title={t('portfolioPage.myWorks', 'My Works')} />
        </div>

        {/* 篩選與排序控制欄 */}
        <div className="mb-8">
          {/* 桌面版 */}
          <div className="hidden md:relative md:flex md:items-center md:justify-center h-10">
              {/* 全選框（僅在刪除模式下顯示） */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <AnimatePresence> {isDeleteModeActive && deletableItemsCount > 0 && ( <motion.div className="flex items-center" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}> <input type="checkbox" id="select-all-deletable" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-0 cursor-pointer" checked={selectedIdsForDeletion.length === deletableItemsCount && deletableItemsCount > 0} onChange={handleSelectAllForDeletion} aria-label={t('portfolioPage.selectAllDeletableAriaLabel')} /> <label htmlFor="select-all-deletable" className="ml-2 text-sm text-theme-primary cursor-pointer">{t('portfolioPage.selectAllLabel')}</label> </motion.div> )} </AnimatePresence>
              </div>
              {/* 分類篩選按鈕 */}
              <motion.div className="flex items-center space-x-8" variants={staggerContainerVariants(0.1)} initial="initial" animate={showWorks ? 'animate' : 'initial'}>
                  {filterCategories.map((category) => ( <motion.button key={category} data-category={category} onClick={() => handleFilterChange(category)} className="relative text-lg font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-sm whitespace-nowrap" variants={fadeInUpItemVariants} whileTap={{ translateY: 6 }}> <span key={`label-${category}-${activeFilter}`} className={activeFilter === category ? 'text-custom-cyan' : 'text-theme-secondary hover:text-custom-cyan'}> {t(category)} </span> {activeFilter === category && ( <motion.div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-custom-cyan" layoutId="portfolio-filter-underline" transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }} /> )} </motion.button> ))}
              </motion.div>
          </div>
          {/* 行動裝置版 */}
          <div className="md:hidden space-y-4">
              <div className="overflow-x-auto flex justify-center">
                          <motion.div className="flex items-center space-x-4 sm:space-x-8 pb-2 w-max" variants={staggerContainerVariants(0.1)} initial="initial" animate={showWorks ? 'animate' : 'initial'}>
                      {filterCategories.map((category) => ( <motion.button key={category} data-category={category} onClick={() => handleFilterChange(category)} className="relative text-base font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-sm whitespace-nowrap" variants={fadeInUpItemVariants} whileTap={{ translateY: 6 }}> <span key={`label-mobile-${category}-${activeFilter}`} className={activeFilter === category ? 'text-custom-cyan' : 'text-theme-secondary hover:text-custom-cyan'}> {t(category)} </span> {activeFilter === category && ( <motion.div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-custom-cyan" layoutId="portfolio-filter-underline-mobile" transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }} /> )} </motion.button> ))}
                  </motion.div>
              </div>
              <div className="flex items-center justify-between">
                  <div>
                      <AnimatePresence> {isDeleteModeActive && deletableItemsCount > 0 && ( <motion.div className="flex items-center" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}> <input type="checkbox" id="select-all-deletable-mobile" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-0 cursor-pointer" checked={selectedIdsForDeletion.length === deletableItemsCount && deletableItemsCount > 0} onChange={handleSelectAllForDeletion} aria-label={t('portfolioPage.selectAllDeletableAriaLabel')} /> <label htmlFor="select-all-deletable-mobile" className="ml-2 text-sm text-theme-primary cursor-pointer">{t('portfolioPage.selectAllLabel')}</label> </motion.div> )} </AnimatePresence>
                  </div>
              </div>
          </div>
        </div>
        
        {/* 內容網格 */}
        {isLoading ? (
          <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
            {Array.from({ length: 12 }).map((_, index) => <PortfolioSkeletonCard key={index} index={index} />)}
          </Masonry>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {isFiltering ? (
                  <motion.div key="filtering-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
                          {Array.from({ length: 12 }).map((_, index) => <PortfolioSkeletonCard key={index} index={index} />)}
                      </Masonry>
                  </motion.div>
              ) : (
                  <motion.div
                  key={activeFilter}
                  variants={staggerContainerVariants(0.05, 0)}
                  initial="initial"
                  animate={showWorks ? 'animate' : 'initial'}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  >
                  {itemsToDisplay.length > 0 ? (
                      <Masonry
                      breakpointCols={breakpointColumnsObj}
                      className="masonry-grid"
                      columnClassName="masonry-grid_column"
                      >
                      {itemsToDisplay.map((item) => {
                        const displayTitle = (i18n.language === 'zh-Hant' && item.titleZh) ? item.titleZh : (item.title || '');
                        return (
                          <motion.div key={item.id} variants={fadeInUpItemVariants}>
                            <PortfolioCard
                                {...item}
                                imageUrl={getOptimizedImageUrl(item.imageUrl)}
                                onClick={() => openLightbox(item, filteredItems)}
                                isDeleteModeActive={isDeleteModeActive}
                                isSelectedForDeletion={selectedIdsForDeletion.includes(item.id)}
                                onToggleSelectionForDeletion={handleToggleSelectionForDeletion}
                                isCardDisabled={isDeleteModeActive && !!item.isStatic}
                            />
                            <p className="xl:hidden text-center text-custom-cyan mt-2 text-sm font-semibold truncate">{displayTitle}</p>
                          </motion.div>
                        );
                      })}
                      </Masonry>
                  ) : (
                      <div className="text-center text-theme-secondary py-10">
                      <p>{t(allPortfolioItems.length > 0 ? 'portfolioPage.noItemsFound' : 'portfolioPage.noItemsOnView')}</p>
                      </div>
                  )}
                  </motion.div>
              )}
            </AnimatePresence>

             {/* 用於無限滾動的加載觸發器 */}
            <div ref={loaderRef} className="h-10 text-center text-theme-secondary">
               {!isFiltering && displayCount < filteredItems.length && !isLoading && t('loading')}
            </div>
          </>
        )}
      </div>

      {/* 燈箱 */}
      {selectedItem && lightboxItemsSource && (
        <Lightbox
          currentItem={selectedItem}
          filteredItems={lightboxItemsSource}
          onClose={closeLightbox}
          onSelectItem={setSelectedItem}
          isLandscape={isLandscape}
        />
      )}
    </div>
  );
};
