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
import ChevronLeftIcon from '../icons/ChevronLeftIcon';

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
  isLandscape: boolean;
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
  isVertical: boolean;
}> = ({ item, index, onClick, isActive, isVertical }) => {
    const wrapperClass = isVertical
        ? `relative flex-shrink-0 w-32 h-36 my-1 rounded-md cursor-pointer flex items-center justify-center p-1 group ${isActive ? 'active-thumbnail-vertical' : ''}`
        : `relative flex-shrink-0 w-36 h-32 mx-1 rounded-md cursor-pointer flex items-center justify-center p-1 group ${isActive ? 'active-thumbnail' : ''}`;
    
    const innerDivClass = isVertical ? "film-strip-thumbnail-vertical w-full h-full" : "film-strip-thumbnail w-full h-full";
    const imgClass = isVertical ? "film-strip-image-vertical" : "film-strip-image";
    
    return (
        <div
            data-index={index}
            onClick={() => onClick(index)}
            className={wrapperClass}
            role="button"
            aria-label={`View image ${index + 1}`}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(index); }}
        >
            <div className={innerDivClass}>
                <img
                    data-src={getCloudinaryThumbnailUrl(item.imageUrl)}
                    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                    alt=""
                    draggable="false"
                    className={imgClass}
                />
            </div>
        </div>
    );
};


/**
 * 燈箱組件。
 * 提供一個全螢幕的圖片瀏覽器，支持鍵盤、滑鼠滾輪和觸控滑動導航，並包含一個可摺疊的縮圖輪播。
 * 在行動裝置橫向模式下提供沉浸式體驗。
 */
const Lightbox: React.FC<LightboxProps> = ({ currentItem, filteredItems, onClose, onSelectItem, isLandscape }) => {
  const { t, i18n } = useTranslation();
  // 狀態管理
  const [direction, setDirection] = useState(0);
  const isNavigatingRef = useRef(false);
  const lastWheelNavTime = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false); // 水平預覽面板預設為收合
  const [isVerticalCarouselVisible, setIsVerticalCarouselVisible] = useState(true); // 垂直預覽面板在橫向模式下預設為展開

  const { id, imageUrl, title, titleZh } = currentItem;
  
  const lightboxRoot = useMemo(() => document.getElementById('lightbox-root'), []);
  
  const currentIndex = useMemo(() => filteredItems.findIndex(item => item.id === currentItem.id), [filteredItems, currentItem.id]);
  
  // 當前預覽項目滾動至可見區域
  useEffect(() => {
    const isAnyCarouselVisible = isCarouselVisible || (isLandscape && isVerticalCarouselVisible);
    if (carouselRef.current && isAnyCarouselVisible) {
        const thumbnailElement = carouselRef.current.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement | undefined;
        if (thumbnailElement) {
            setTimeout(() => {
                thumbnailElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }, 100);
        }
    }
  }, [currentIndex, isCarouselVisible, isVerticalCarouselVisible, isLandscape]);
  
  // 優化後的懶加載邏輯：使用單一 IntersectionObserver
  useEffect(() => {
    const isAnyCarouselVisible = isCarouselVisible || (isLandscape && isVerticalCarouselVisible);
    if (!isAnyCarouselVisible || !carouselRef.current) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        },
        {
            root: carouselRef.current,
            rootMargin: isLandscape ? '200px 0px' : '0px 200px',
        }
    );

    const imagesToObserve = carouselRef.current.querySelectorAll<HTMLImageElement>('img[data-src]');
    imagesToObserve.forEach(img => observer.observe(img));

    return () => {
        observer.disconnect();
    };
  }, [isCarouselVisible, isVerticalCarouselVisible, isLandscape]);

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
  
  // 僅在非橫向模式下啟用滾輪水平滾動縮圖
  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (!carouselElement || isLandscape) return;
    const handleWheel = (e: WheelEvent) => {
      if (carouselElement.scrollWidth > carouselElement.clientWidth) {
        e.preventDefault();
        carouselElement.scrollLeft += e.deltaY;
      }
    };
    carouselElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (carouselElement) carouselElement.removeEventListener('wheel', handleWheel); };
  }, [isCarouselVisible, isLandscape]);

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
  const carouselContainerClasses = 'bg-lightbox-carousel-dark';
  const iconColorClasses = isLightTheme ? 'text-gray-800' : 'text-white';
  const iconHoverClasses = `hover:text-custom-cyan`;

  const imageContainerPaddingClasses = 'pt-16 pb-10';
  const mainImagePaddingBottom = !isLandscape && isCarouselVisible ? '12.75rem' : isLandscape ? '1rem' : '3.5rem';
  const mainImagePaddingLeft = isLandscape && isVerticalCarouselVisible ? '9rem' : isLandscape ? '0.5rem' : undefined;
  const mainImagePaddingRight = isLandscape && isVerticalCarouselVisible ? '9rem' : isLandscape ? '0.5rem' : undefined;

  const lightboxContent = (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 transition-colors duration-300 ease-in-out ${overlayClasses}`} role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
        <div className="relative flex w-full h-full max-w-screen-2xl">
            {/* Vertical Film Strip for Landscape Mobile */}
            {isLandscape && filteredItems.length > 1 && (
                <motion.div
                    key="vertical-carousel-container"
                    className="absolute top-0 left-0 bottom-0 z-30 h-full flex items-center"
                    animate={{ x: isVerticalCarouselVisible ? '0rem' : '-9rem' }}
                    transition={transitionConfig}
                >
                    <div className={`relative h-full flex items-center transition-colors bg-lightbox-carousel-dark rounded-r-lg`}>
                        <div className="h-full w-36 overflow-hidden">
                          <div ref={carouselRef} className="relative h-full overflow-y-auto lightbox-thumbnail-scroller-vertical pr-2">
                              <div className="flex flex-col items-center no-select py-16 w-max mx-auto">
                                  {filteredItems.map((item, index) => (
                                      <Thumbnail
                                          key={item.id} item={item} index={index}
                                          isActive={currentIndex === index}
                                          onClick={handleThumbnailClick} isVertical={true}
                                      />
                                  ))}
                              </div>
                          </div>
                        </div>
                        <button
                            onClick={() => setIsVerticalCarouselVisible(!isVerticalCarouselVisible)}
                            className={`absolute top-1/2 -right-8 transform -translate-y-1/2 w-8 h-16 rounded-r-full flex items-center justify-center
                                        cursor-pointer transition-colors z-10 bg-lightbox-carousel-dark ${isLightTheme ? 'text-zinc-800' : 'text-white'} hover:text-custom-cyan
                                        focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`}
                            aria-label={isVerticalCarouselVisible ? "Hide Thumbnails" : "Show Thumbnails"}
                            aria-expanded={isVerticalCarouselVisible}
                        >
                            <motion.div animate={{ rotate: isVerticalCarouselVisible ? 0 : 180 }} transition={{ duration: 0.3 }}>
                                <ChevronLeftIcon className="w-6 h-6" />
                            </motion.div>
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="relative flex-grow w-full flex flex-col items-center justify-center overflow-hidden group"
                 onWheel={(e) => { const now = Date.now(); if (now - lastWheelNavTime.current < 450) return; lastWheelNavTime.current = now; if (e.deltaY > 1) handleNext(); else if (e.deltaY < -1) handlePrevious(); }}
            >
                <button onClick={onClose} className={`absolute top-4 right-4 z-50 p-2 rounded-full flex items-center justify-center transition-colors duration-200 ease-in-out focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} group`} aria-label={t('lightbox.close')}>
                    <CloseIcon className={`w-8 h-8 ${iconColorClasses} ${iconHoverClasses} transition-colors`} />
                </button>
                <motion.div
                    className={`w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out ${isLandscape ? 'pt-4 px-2' : `${imageContainerPaddingClasses} px-4 sm:px-16`}`}
                    animate={{ paddingBottom: mainImagePaddingBottom, paddingLeft: mainImagePaddingLeft, paddingRight: mainImagePaddingRight }}
                >
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.img key={id + "_img"} src={imageUrl} alt={displayTitle} className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl lightbox-main-image" custom={direction} variants={imageVariants} initial="enter" animate="center" exit="exit" transition={transitionConfig} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} onDragEnd={onDragEnd} />
                    </AnimatePresence>
                </motion.div>
            </div>
            
            {!isLandscape && filteredItems.length > 1 && (
                <div key="lightbox-carousel-panel" className="absolute bottom-0 left-0 right-0 z-20 w-full">
                    <div className={`relative w-full mx-auto transition-colors rounded-t-lg ${carouselContainerClasses}`}>
                        <button
                            onClick={() => setIsCarouselVisible(!isCarouselVisible)}
                            className={`w-full flex justify-center p-2 cursor-pointer transition-colors z-10 ${iconColorClasses} ${iconHoverClasses} focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`}
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
                                <div className="pb-3 pt-2">
                                    <div className="relative w-full overflow-hidden">
                                        <div ref={carouselRef} className="relative w-full overflow-x-auto lightbox-thumbnail-scroller">
                                            <div className="flex items-center no-select pt-1 pb-4 px-2 w-max mx-auto">
                                                {filteredItems.map((item, index) => (
                                                    <Thumbnail
                                                        key={item.id} item={item} index={index}
                                                        isActive={currentIndex === index}
                                                        onClick={handleThumbnailClick} isVertical={false}
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