// 引入 React 相關鉤子
import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
// 引入 react-dom 的 createPortal，用於將組件渲染到 DOM 的不同部分
import { createPortal } from 'react-dom';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped, AnimatePresence } from 'framer-motion'; 
// 引入類型定義
import { PortfolioItemData } from '../../types'; 
// 引入樣式常數
import { ACCENT_FOCUS_VISIBLE_RING_CLASS, ACCENT_BORDER_COLOR } from '../../constants';
// 引入圖標組件
import CloseIcon from '../icons/CloseIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 主圖片的進入/退出動畫變體
const imageVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 }),
};

// 組件屬性介面
interface LightboxProps {
  currentItem: PortfolioItemData;
  filteredItems: PortfolioItemData[];
  onClose: () => void;
  onSelectItem: (item: PortfolioItemData) => void;
}

/**
 * 創建一個 Cloudinary URL 用於壓縮縮圖。
 * @param originalUrl 原始的 Cloudinary 圖片 URL。
 * @returns 帶有轉換參數的新 URL。
 */
const getCloudinaryThumbnailUrl = (originalUrl: string): string => {
  if (!originalUrl || !originalUrl.includes('/upload/')) {
    return originalUrl; // 如果不是有效的 Cloudinary URL，則返回原樣
  }
  // 請求一個寬度為 200px、自動品質、自動格式的版本作為縮圖
  const transformation = 'w_200,q_auto,f_auto';
  return originalUrl.replace('/upload/', `/upload/${transformation}/`);
};


/**
 * 用於懶加載的縮圖組件。
 * 它不包含任何副作用或狀態，只負責渲染一個帶有 data-src 屬性的 img 標籤。
 */
const Thumbnail: React.FC<{
  item: PortfolioItemData;
  index: number;
  onClick: (index: number) => void;
  isActive: boolean;
  thumbnailBgClasses: string;
}> = ({ item, index, onClick, isActive, thumbnailBgClasses }) => (
  <div
    data-index={index}
    onClick={() => onClick(index)}
    className={`relative flex-shrink-0 w-20 h-20 mx-1 rounded-md overflow-hidden cursor-pointer ${thumbnailBgClasses}`}
    role="button"
    aria-label={`View image ${index + 1}`}
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(index); }}
  >
    <img
      // 使用 data-src 存儲真實的圖片 URL，供 IntersectionObserver 使用
      data-src={getCloudinaryThumbnailUrl(item.imageUrl)}
      // src 使用一個透明的 1x1 GIF 作為佔位符，避免顯示“圖片損壞”圖標
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      alt=""
      draggable="false"
      className="w-full h-full object-cover"
    />
    {isActive && (
      <motion.div
        layoutId="lightbox-thumbnail-border"
        className={`absolute inset-0 border-2 ${ACCENT_BORDER_COLOR} rounded-md`}
      ></motion.div>
    )}
  </div>
);


/**
 * 燈箱組件。
 * 提供一個全螢幕的圖片瀏覽器，支持鍵盤、滑鼠滾輪和觸控滑動導航，並包含一個可摺疊的縮圖輪播。
 * 在行動裝置橫向模式下提供沉浸式體驗。
 */
const Lightbox: React.FC<LightboxProps> = ({ currentItem, filteredItems, onClose, onSelectItem }) => {
  const { t, i18n } = useTranslation();
  // 狀態管理
  const [direction, setDirection] = useState(0);
  const isNavigatingRef = useRef(false);
  const lastWheelNavTime = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false); // 預覽面板預設為收合

  const { id, imageUrl, title, titleZh } = currentItem;
  
  const lightboxRoot = useMemo(() => document.getElementById('lightbox-root'), []);

  // 監聽螢幕方向和尺寸變化
  useEffect(() => {
    const checkOrientation = () => {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        const isMobile = window.innerWidth < 1024;
        setIsMobileLandscape(isLandscape && isMobile);
    };
    checkOrientation();
    const mql = window.matchMedia("(orientation: landscape)");
    window.addEventListener('resize', checkOrientation);
    mql.addEventListener('change', checkOrientation);
    return () => {
        window.removeEventListener('resize', checkOrientation);
        mql.removeEventListener('change', checkOrientation);
    };
  }, []);
  
  const currentIndex = useMemo(() => filteredItems.findIndex(item => item.id === currentItem.id), [filteredItems, currentItem.id]);
  
  useEffect(() => {
    if (carouselRef.current && isCarouselVisible) {
        const thumbnailElement = carouselRef.current.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement | undefined;
        if (thumbnailElement) {
            thumbnailElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [currentIndex, isCarouselVisible]);
  
  // 優化後的懶加載邏輯：使用單一 IntersectionObserver
  useEffect(() => {
    // 只有當預覽面板可見且 ref 已掛載時才執行
    if (!isCarouselVisible || !carouselRef.current) return;

    // 創建一個 IntersectionObserver 實例
    const observer = new IntersectionObserver(
        (entries) => {
            // 遍歷所有被觀察的元素
            entries.forEach(entry => {
                // 如果元素進入視口
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    const src = img.dataset.src;
                    if (src) {
                        // 將 data-src 的值赋給 src，觸發圖片加載
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    // 圖片加載後，停止觀察此元素
                    observer.unobserve(img);
                }
            });
        },
        {
            root: carouselRef.current, // 觀察的根元素是滾動容器
            rootMargin: '0px 200px 0px 200px', // 預加載視口左右 200px 範圍內的圖片
        }
    );

    // 獲取所有待加載的圖片並開始觀察
    const imagesToObserve = carouselRef.current.querySelectorAll<HTMLImageElement>('img[data-src]');
    imagesToObserve.forEach(img => observer.observe(img));

    // 清理函數：當組件卸載或預覽面板隱藏時，斷開觀察器
    return () => {
        observer.disconnect();
    };
  }, [isCarouselVisible]); // 此 effect 只依賴 isCarouselVisible 的變化

  const handleNavigation = useCallback((getNewIndex: (current: number) => number) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    const newIndex = getNewIndex(currentIndex);
    const newDirection = newIndex > currentIndex || (newIndex === 0 && currentIndex === filteredItems.length - 1) ? 1 : -1;
    setDirection(newDirection);
    onSelectItem(filteredItems[newIndex]);
    setTimeout(() => { isNavigatingRef.current = false; }, 400);
  }, [currentIndex, filteredItems, onSelectItem]);

  const handleNext = useCallback(() => handleNavigation(current => (current + 1) % filteredItems.length), [handleNavigation, filteredItems.length]);
  const handlePrevious = useCallback(() => handleNavigation(current => (current - 1 + filteredItems.length) % filteredItems.length), [handleNavigation, filteredItems.length]);
  const handleThumbnailClick = (index: number) => { if (index !== currentIndex) handleNavigation(() => index); };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') handleNext();
    else if (event.key === 'ArrowLeft') handlePrevious();
  }, [handleNext, handlePrevious]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (!carouselElement) return;
    const handleWheel = (e: WheelEvent) => {
      if (carouselElement.scrollWidth > carouselElement.clientWidth) {
        e.preventDefault();
        carouselElement.scrollLeft += e.deltaY;
      }
    };
    carouselElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (carouselElement) carouselElement.removeEventListener('wheel', handleWheel); };
  }, [isCarouselVisible]);

  const displayTitle = useMemo(() => {
    return (i18n.language === 'zh-Hant' && titleZh) ? titleZh : (title || '');
  }, [title, titleZh, i18n.language]);
  
  const transitionConfig = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };
  
  const onDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    const swipe = Math.abs(info.offset.x) * info.velocity.x;
    if (swipe < -10000) handleNext();
    else if (swipe > 10000) handlePrevious();
  };
  
  const isLightTheme = document.body.classList.contains('theme-light');
  const overlayClasses = isLightTheme ? 'bg-white' : 'bg-black';
  const carouselContainerClasses = isLightTheme ? 'bg-gray-100' : 'bg-lightbox-carousel-dark';
  const thumbnailBgClasses = isLightTheme ? 'bg-gray-200' : 'bg-theme-secondary';
  const iconColorClasses = isLightTheme ? 'text-gray-800' : 'text-white';
  const iconHoverClasses = `hover:text-custom-cyan`;

  const imageContainerPaddingClasses = isMobileLandscape ? 'p-0' : 'pt-16 pb-10';
  const mainImagePaddingBottom = isMobileLandscape ? '0rem' : (isCarouselVisible ? '10rem' : '3.5rem');

  const lightboxContent = (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 transition-colors duration-300 ease-in-out ${overlayClasses}`} role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
      <div className="relative flex flex-col w-full h-full max-w-screen-2xl">
        <button onClick={onClose} className={`absolute top-4 right-4 z-50 p-2 rounded-full flex items-center justify-center transition-colors duration-200 ease-in-out focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} group`} aria-label={t('lightbox.close')}>
          <CloseIcon className={`w-8 h-8 ${iconColorClasses} ${iconHoverClasses} transition-colors`} />
        </button>
        <div className={`relative flex-grow w-full flex flex-col items-center justify-center px-4 sm:px-16 overflow-hidden group ${imageContainerPaddingClasses}`} onWheel={(e) => { const now = Date.now(); if (now - lastWheelNavTime.current < 450) return; lastWheelNavTime.current = now; if (e.deltaY > 1) handleNext(); else if (e.deltaY < -1) handlePrevious(); }}>
          <motion.div className="w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out" animate={{ paddingBottom: mainImagePaddingBottom }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.img key={id + "_img"} src={imageUrl} alt={displayTitle} className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl" custom={direction} variants={imageVariants} initial="enter" animate="center" exit="exit" transition={transitionConfig} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} onDragEnd={onDragEnd} />
            </AnimatePresence>
          </motion.div>
        </div>
        
        {filteredItems.length > 1 && !isMobileLandscape && (
            <div key="lightbox-carousel-panel" className="absolute bottom-0 left-0 right-0 z-20 w-full">
                <div className={`relative w-full mx-auto transition-colors rounded-t-lg ${carouselContainerClasses}`}>
                    <button
                        onClick={() => setIsCarouselVisible(!isCarouselVisible)}
                        className={`mx-auto block p-2 transition-colors z-20 ${iconColorClasses} ${iconHoverClasses} focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`}
                        aria-label={isCarouselVisible ? "Hide Thumbnails" : "Show Thumbnails"}
                        aria-expanded={isCarouselVisible}
                    >
                        <motion.div animate={{ rotate: isCarouselVisible ? 0 : 180 }} transition={{ duration: 0.3 }}>
                            <ChevronDownIcon className="w-6 h-6" />
                        </motion.div>
                    </button>
                    <AnimatePresence>
                    {isCarouselVisible && (
                        <motion.div
                            key="collapsible-content"
                            className="w-full overflow-hidden"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.4, ease: [0.2, 1, 0.3, 1] }, opacity: { duration: 0.3, delay: 0.1 } } }}
                            exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.4, ease: [0.2, 1, 0.3, 1] }, opacity: { duration: 0.2 } } }}
                        >
                            <div className="pb-3 pt-1">
                                <div className="w-full flex items-center justify-center pb-2 px-4">
                                    {displayTitle && <h3 id="lightbox-title" className="font-bold text-custom-cyan text-center text-xl">{displayTitle}</h3>}
                                </div>
                                <div className="relative w-full overflow-hidden">
                                    <div ref={carouselRef} className="relative w-full overflow-x-auto lightbox-thumbnail-scroller">
                                        <div className="flex items-center no-select py-1 px-2 w-max mx-auto">
                                            {filteredItems.map((item, index) => (
                                                <Thumbnail
                                                    key={item.id}
                                                    item={item}
                                                    index={index}
                                                    isActive={currentIndex === index}
                                                    onClick={handleThumbnailClick}
                                                    thumbnailBgClasses={thumbnailBgClasses}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        )}
      </div>
    </div>
  );

  if (!lightboxRoot) { console.error("燈箱根元素未找到。"); return null; }
  return createPortal(lightboxContent, lightboxRoot);
};

export default Lightbox;