// 引入 React 相關鉤子和組件
import React, { useState, useMemo, useCallback, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入自定義的 UI 組件
import PortfolioCard from '../ui/PortfolioCard';
import Lightbox from '../ui/Lightbox';
import { PortfolioItemData } from '../../types'; 
// 引入 Framer Motion 動畫庫
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
// 引入動畫變體
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants'; 
// 引入瀑布流（Masonry）佈局庫
import Masonry from 'react-masonry-css';
// 引入骨架屏（加載佔位符）組件
import PortfolioSkeletonCard from '../ui/PortfolioSkeletonCard';
import SectionTitle from '../ui/SectionTitle';
import PortfolioCarousel from '../ui/PortfolioCarousel';
// 引入圖標組件
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import SparklesIcon from '../icons/SparklesIcon';
// 引入 Google Gemini AI SDK
import { GoogleGenAI } from '@google/genai';
// 引入樣式常數
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CameraIcon from '../icons/CameraIcon';
// 引入 API 服務，用於與後端進行通信
import { ApiService } from '../../src/services/api';
import { getOptimizedImageUrl } from '../../utils';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 新增作品時的分類選項
const addProjectCategoryOptions = [
  { value: 'portfolioPage.filterStreet', labelKey: 'portfolioPage.filterStreet' },
  { value: 'portfolioPage.filterPortrait', labelKey: 'portfolioPage.filterPortrait' },
  { value: 'portfolioPage.filterSport', labelKey: 'portfolioPage.filterSport' },
];

// 定義每頁顯示的項目數量、無限滾動加載的數量和排序鍵類型
const ITEMS_PER_PAGE = 12; // 初始加載的項目數量
const ITEMS_TO_LOAD = 6;  // 每次無限滾動加載的項目數量
type SortKey = 'date-desc' | 'date-asc' | 'views-desc' | 'views-asc' | 'title-asc' | 'title-desc' | 'category-asc' | 'category-desc';

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

/**
 * 作品集頁面組件 (PortfolioPage)。
 * 負責顯示所有作品集項目，並提供豐富的交互功能。
 * 主要功能包括：
 * - 頂部的特色作品輪播。
 * - 按分類篩選作品。
 * - 對作品進行多種條件排序。
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

  // --- 狀態管理 (useState) ---
  const [activeFilter, setActiveFilter] = useState<string>('portfolioPage.filterAll'); // 當前激活的分類篩選器
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null); // 當前在燈箱中選中的項目
  const [lightboxItemsSource, setLightboxItemsSource] = useState<PortfolioItemData[] | null>(null); // 傳遞給燈箱的項目列表
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE); // 當前已顯示的項目數量（用於無限滾動）
  const [isLoading, setIsLoading] = useState(true); // 是否正在加載（用於顯示骨架屏）

  // 管理員功能相關狀態
  const [isAdding, setIsAdding] = useState(false); // 是否顯示新增表單
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false); // 是否處於刪除模式
  const [selectedIdsForDeletion, setSelectedIdsForDeletion] = useState<string[]>([]); // 存儲被選中待刪除的項目 ID
  const [sortKey, setSortKey] = useState<SortKey>('date-desc'); // 當前的排序方式
  
  // 表單相關狀態
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoTitleZh, setNewPhotoTitleZh] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false); // AI 是否正在生成標題

  // --- 數據處理 (useMemo) ---

  // 所有作品項目，按日期降序排列
  const allPortfolioItems = useMemo(() => {
    return [...userAddedPortfolioItems].sort((a,b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0)); 
  }, [userAddedPortfolioItems]);

  // 用於頂部輪播的項目，優先顯示精選項目，然後按日期排序，最多取8個
  const carouselItems = useMemo(() => {
    const featuredItems = allPortfolioItems.filter(item => item.isFeatured).sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
    const nonFeaturedItems = allPortfolioItems.filter(item => !item.isFeatured).sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
    const combined = [...featuredItems, ...nonFeaturedItems];
    return combined.slice(0, 8);
  }, [allPortfolioItems]);


  // 根據當前排序鍵排序所有項目
  const sortedItems = useMemo(() => {
    return [...allPortfolioItems].sort((a, b) => {
      const titleA = (i18n.language === 'zh-Hant' && a.titleZh) ? a.titleZh : (a.title || a.id);
      const titleB = (i18n.language === 'zh-Hant' && b.titleZh) ? b.titleZh : (b.title || b.id);
      const categoryA = t(a.categoryKey || '');
      const categoryB = t(b.categoryKey || '');
      switch (sortKey) {
        case 'date-asc': return (a.date ? new Date(a.date).getTime() : 0) - (b.date ? new Date(b.date).getTime() : 0);
        case 'title-asc': return titleA.localeCompare(titleB);
        case 'title-desc': return titleB.localeCompare(titleA);
        case 'category-asc': return categoryA.localeCompare(categoryB);
        case 'category-desc': return categoryB.localeCompare(categoryA);
        case 'views-desc': return (b.views || 0) - (a.views || 0);
        case 'views-asc': return (a.views || 0) - (b.views || 0);
        case 'date-desc': default: return (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0);
      }
    });
  }, [allPortfolioItems, sortKey, i18n.language, t]);

  // 根據當前篩選器過濾項目
  const filteredItems = useMemo(() => {
    if (activeFilter === 'portfolioPage.filterAll') return sortedItems;
    return sortedItems.filter(item => item.categoryKey === activeFilter);
  }, [activeFilter, sortedItems]);

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

  // --- 副作用 (useEffect) ---

  // 處理切換篩選器時的加載動畫
  useEffect(() => { setIsLoading(true); const timer = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(timer); }, [activeFilter]);
  // 切換篩選器時，重置顯示的項目數量
  useEffect(() => { setDisplayCount(ITEMS_PER_PAGE); }, [activeFilter]);

  // 無限滾動的 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 當觀察的元素（頁底加載器）進入視口，並且不在加載中，且還有更多項目時
        if (entries[0].isIntersecting && !isLoading && displayCount < filteredItems.length) {
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
  }, [displayCount, filteredItems.length, isLoading]);
  
  // 燈箱相關操作
  const openLightbox = useCallback((itemToOpen: PortfolioItemData, sourceItems: PortfolioItemData[]) => { if (isDeleteModeActive) return; setSelectedItem(itemToOpen); setLightboxItemsSource(sourceItems); }, [isDeleteModeActive]);
  const closeLightbox = useCallback(() => { setSelectedItem(null); setLightboxItemsSource(null); }, []);

  // 處理篩選器變更
  const handleFilterChange = (newCategoryValue: string) => { setActiveFilter(newCategoryValue); setSelectedItem(null); };
  
  // 處理文件上傳
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
        setSelectedFile(file);
        setImageUploadError(null);
        
        try {
          // 直接上傳到 Cloudinary
          const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          
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
      if (!process.env.API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      
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
  const breakpointColumnsObj = { default: 4, 1199: 3, 767: 2, 500: 1 };

  // --- 渲染 (JSX) ---
  return (
    <div>
      {/* 頁面標題 */}
      <motion.div {...sectionDelayShow(0)}> <SectionTitle titleKey="portfolioPage.title" subtitleKey="portfolioPage.subtitle" /> </motion.div>
      
      {/* 作品輪播 */}
      <motion.div className="my-12 relative overflow-hidden" variants={fadeInUpItemVariants} initial="initial" animate="animate">
        <PortfolioCarousel items={carouselItems} onItemClick={(item) => openLightbox(item, carouselItems)} />
      </motion.div>
      
      {/* 篩選與排序控制欄 */}
      <div className="my-8">
        {/* 桌面版 */}
        <div className="hidden md:relative md:flex md:items-center md:justify-center h-10">
            {/* 全選框（僅在刪除模式下顯示） */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <AnimatePresence> {isDeleteModeActive && deletableItemsCount > 0 && ( <motion.div className="flex items-center" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}> <input type="checkbox" id="select-all-deletable" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-0 cursor-pointer" checked={selectedIdsForDeletion.length === deletableItemsCount && deletableItemsCount > 0} onChange={handleSelectAllForDeletion} aria-label={t('portfolioPage.selectAllDeletableAriaLabel')} /> <label htmlFor="select-all-deletable" className="ml-2 text-sm text-theme-primary cursor-pointer">{t('portfolioPage.selectAllLabel')}</label> </motion.div> )} </AnimatePresence>
            </div>
            {/* 分類篩選按鈕 */}
            <motion.div className="flex items-center space-x-8" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
                {filterCategories.map((category) => ( <motion.button key={category} onClick={() => handleFilterChange(category)} className="relative text-lg font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-sm whitespace-nowrap" variants={fadeInUpItemVariants}> <span className={activeFilter === category ? 'text-custom-cyan' : 'text-theme-secondary hover:text-custom-cyan'}> {t(category)} </span> {activeFilter === category && ( <motion.div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-custom-cyan" layoutId="portfolio-filter-underline" transition={{ type: 'spring', stiffness: 350, damping: 30 }} /> )} </motion.button> ))}
            </motion.div>
            {/* 排序下拉選單 */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <label htmlFor="portfolio-sort-desktop" className="text-sm font-medium text-theme-primary whitespace-nowrap">{t('blogPage.sortByLabel')}:</label>
                <div className="relative">
                    <select id="portfolio-sort-desktop" value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className={`bg-theme-tertiary border border-theme-primary text-theme-primary text-sm font-medium rounded-md p-2 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer`} aria-label={t('blogPage.sortByLabel')}>
                        <option value="date-desc">{t('blogPage.sortDateDesc')}</option><option value="date-asc">{t('blogPage.sortDateAsc')}</option><option value="title-asc">{t('blogPage.sortTitleAsc')}</option><option value="title-desc">{t('blogPage.sortTitleDesc')}</option><option value="category-asc">{t('postManagementPage.sortCategoryAsc')}</option><option value="category-desc">{t('postManagementPage.sortCategoryDesc')}</option><option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option><option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary"> <ChevronDownIcon className="w-5 h-5" /> </div>
                </div>
            </div>
        </div>
        {/* 行動裝置版 */}
        <div className="md:hidden space-y-4">
            <div className="overflow-x-auto flex justify-center">
                <motion.div className="flex items-center space-x-4 sm:space-x-8 pb-2 w-max" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
                    {filterCategories.map((category) => ( <motion.button key={category} onClick={() => handleFilterChange(category)} className="relative text-base font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-cyan rounded-sm whitespace-nowrap" variants={fadeInUpItemVariants}> <span className={activeFilter === category ? 'text-custom-cyan' : 'text-theme-secondary hover:text-custom-cyan'}> {t(category)} </span> {activeFilter === category && ( <motion.div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-custom-cyan" layoutId="portfolio-filter-underline-mobile" /> )} </motion.button> ))}
                </motion.div>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <AnimatePresence> {isDeleteModeActive && deletableItemsCount > 0 && ( <motion.div className="flex items-center" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}> <input type="checkbox" id="select-all-deletable-mobile" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-0 cursor-pointer" checked={selectedIdsForDeletion.length === deletableItemsCount && deletableItemsCount > 0} onChange={handleSelectAllForDeletion} aria-label={t('portfolioPage.selectAllDeletableAriaLabel')} /> <label htmlFor="select-all-deletable-mobile" className="ml-2 text-sm text-theme-primary cursor-pointer">{t('portfolioPage.selectAllLabel')}</label> </motion.div> )} </AnimatePresence>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="portfolio-sort-mobile" className="text-sm font-medium text-theme-primary whitespace-nowrap">{t('blogPage.sortByLabel')}:</label>
                    <div className="relative">
                        <select id="portfolio-sort-mobile" value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className={`bg-theme-tertiary border border-theme-primary text-theme-primary text-sm font-medium rounded-md p-2 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer`} aria-label={t('blogPage.sortByLabel')}>
                             <option value="date-desc">{t('blogPage.sortDateDesc')}</option><option value="date-asc">{t('blogPage.sortDateAsc')}</option><option value="title-asc">{t('blogPage.sortTitleAsc')}</option><option value="title-desc">{t('blogPage.sortTitleDesc')}</option><option value="category-asc">{t('postManagementPage.sortCategoryAsc')}</option><option value="category-desc">{t('postManagementPage.sortCategoryDesc')}</option><option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option><option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary"> <ChevronDownIcon className="w-5 h-5" /> </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* 內容網格 */}
      {isLoading ? ( 
        // 加載時顯示骨架屏
        <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column"> {Array.from({ length: 9 }).map((_, index) => <PortfolioSkeletonCard key={index} index={index} />)} </Masonry> 
      ) : (
        <>
          <motion.div transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
              {itemsToDisplay.map((item) => ( 
                <motion.div key={item.id} layout variants={fadeInUpItemVariants} initial="initial" animate="animate" exit="initial" transition={{ duration: 0.5, delay: 0.05 }} className="w-full"> 
                  <PortfolioCard {...item} imageUrl={getOptimizedImageUrl(item.imageUrl)} onClick={() => openLightbox(item, filteredItems)} isDeleteModeActive={isDeleteModeActive} isSelectedForDeletion={selectedIdsForDeletion.includes(item.id)} onToggleSelectionForDeletion={handleToggleSelectionForDeletion} isCardDisabled={isDeleteModeActive && !!item.isStatic} /> 
                </motion.div> 
              ))}
            </Masonry>
            {itemsToDisplay.length === 0 && ( 
              // 沒有項目時顯示提示信息
              <motion.div className="col-span-full text-center text-theme-secondary py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}> 
                <p className="flex items-center justify-center space-x-2"> <span>{t(allPortfolioItems.length > 0 ? 'portfolioPage.noItemsFound' : 'portfolioPage.noItemsOnView')}</span> </p> 
              </motion.div> 
            )}
          </motion.div>
           {/* 用於無限滾動的加載觸發器 */}
          <div ref={loaderRef} className="h-10 text-center text-theme-secondary">
             {displayCount < filteredItems.length && !isLoading && t('loading')}
          </div>
        </>
      )}

      {/* 燈箱 */}
      {selectedItem && lightboxItemsSource && ( <Lightbox currentItem={selectedItem} filteredItems={lightboxItemsSource} onClose={closeLightbox} onSelectItem={setSelectedItem} isLandscape={isLandscape} /> )}
    </div>
  );
};