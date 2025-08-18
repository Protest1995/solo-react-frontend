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
import ChevronUpIcon from '../icons/ChevronUpIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 組件屬性介面
interface LightboxProps {
  currentItem: PortfolioItemData; // 當前顯示的項目
  filteredItems: PortfolioItemData[]; // 所有可供瀏覽的項目列表
  onClose: () => void; // 關閉燈箱的回調
  onSelectItem: (item: PortfolioItemData) => void; // 選擇新項目的回調
}

// 主圖片的進入/退出動畫變體
const imageVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 }),
};

/**
 * 燈箱組件。
 * 提供一個全螢幕的圖片瀏覽器，支持鍵盤、滑鼠滾輪和觸控滑動導航，並包含一個可摺疊的縮圖輪播。
 * 在行動裝置橫向模式下提供沉浸式體驗。
 */
const Lightbox: React.FC<LightboxProps> = ({ currentItem, filteredItems, onClose, onSelectItem }) => {
  const { t, i18n } = useTranslation();
  // 狀態管理
  const [direction, setDirection] = useState(0);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);
  const isNavigatingRef = useRef(false);
  const lastWheelNavTime = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false); // 新增狀態

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
    if (isCarouselVisible && carouselRef.current) {
        const thumbnailElement = carouselRef.current.children[currentIndex] as HTMLElement | undefined;
        if (thumbnailElement) {
            thumbnailElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [currentIndex, isCarouselVisible]);

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
    if (event.key === 'Escape') onClose();
    else if (event.key === 'ArrowRight') handleNext();
    else if (event.key === 'ArrowLeft') handlePrevious();
  }, [onClose, handleNext, handlePrevious]);

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
    if (!carouselElement || !isCarouselVisible) return;
    const handleWheel = (e: WheelEvent) => {
      if (carouselElement.scrollWidth > carouselElement.clientWidth) {
        e.preventDefault();
        carouselElement.scrollLeft += e.deltaY;
      }
    };
    carouselElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (carouselElement) carouselElement.removeEventListener('wheel', handleWheel); };
  }, [isCarouselVisible]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };
  
  // 修正後的標題顯示邏輯
  const displayTitle = useMemo(() => {
    return (i18n.language === 'zh-Hant' && titleZh) ? titleZh : (title || '');
  }, [title, titleZh, i18n.language]);
  
  const transitionConfig = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };
  
  const onDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    const swipe = Math.abs(info.offset.x) * info.velocity.x;
    if (swipe < -10000) handleNext();
    else if (swipe > 10000) handlePrevious();
  };
  
  // 根據狀態動態生成 CSS class
  const isLightTheme = document.body.classList.contains('theme-light');
  const overlayClasses = isLightTheme ? 'bg-white' : 'bg-black';
  const carouselContainerClasses = isLightTheme ? 'bg-gray-100' : 'bg-lightbox-carousel-dark';
  const thumbnailBgClasses = isLightTheme ? 'bg-gray-200' : 'bg-theme-secondary';
  const toggleButtonClasses = isLightTheme ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-theme-secondary hover:bg-theme-hover text-white';
  const iconColorClasses = isLightTheme ? 'text-gray-800' : 'text-white';
  const iconHoverClasses = `hover:text-custom-cyan`;

  const imageContainerPaddingClasses = isMobileLandscape ? 'p-0' : 'pt-16 pb-10'; // 根據模式調整邊距
  const titleClasses = `font-bold text-custom-cyan text-center px-4 text-3xl mb-8`;

  const lightboxContent = (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 transition-colors duration-300 ease-in-out ${overlayClasses}`} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
      <div className="relative flex flex-col w-full h-full max-w-screen-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={`absolute top-4 right-4 z-50 p-2 rounded-full flex items-center justify-center transition-colors duration-200 ease-in-out focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS} group`} aria-label={t('lightbox.close')}>
          <CloseIcon className={`w-8 h-8 ${iconColorClasses} ${iconHoverClasses} transition-colors`} />
        </button>
        <div className={`relative flex-grow w-full flex flex-col items-center justify-center px-4 sm:px-16 overflow-hidden group ${imageContainerPaddingClasses}`} onWheel={(e) => { const now = Date.now(); if (now - lastWheelNavTime.current < 450) return; lastWheelNavTime.current = now; if (e.deltaY > 1) handleNext(); else if (e.deltaY < -1) handlePrevious(); }}>
          <motion.div className="w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out" animate={{ paddingBottom: isMobileLandscape ? '0rem' : (isCarouselVisible ? '13rem' : '10rem') }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.img key={id + "_img"} src={imageUrl} alt={displayTitle} className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl" custom={direction} variants={imageVariants} initial="enter" animate="center" exit="exit" transition={transitionConfig} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} onDragEnd={onDragEnd} />
            </AnimatePresence>
          </motion.div>
          {filteredItems.length > 1 && !isMobileLandscape && (
            <div className="absolute inset-x-0 top-0" style={{ bottom: isCarouselVisible ? '136px' : '0' }}>
              <div className="absolute top-0 left-0 h-full w-1/2 z-10 cursor-pointer hidden lg:flex items-center justify-start" onClick={handlePrevious} role="button" aria-label={t('lightbox.previous')}>
                <div className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-4 sm:ml-8`}><ChevronLeftIcon className={`w-12 h-12 transition-colors ${iconColorClasses} ${iconHoverClasses}`} /></div>
              </div>
              <div className="absolute top-0 right-0 h-full w-1/2 z-10 cursor-pointer hidden lg:flex items-center justify-end" onClick={handleNext} role="button" aria-label={t('lightbox.next')}>
                <div className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-4 sm:mr-8`}><ChevronRightIcon className={`w-12 h-12 transition-colors ${iconColorClasses} ${iconHoverClasses}`} /></div>
              </div>
            </div>
          )}
          <AnimatePresence>
              {!isCarouselVisible && filteredItems.length > 1 && !isMobileLandscape && (
                  <motion.div key="collapsed-ui-container" className="absolute bottom-4 z-30 flex flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 260, damping: 25 }}>
                      {displayTitle && <h3 id="lightbox-title" className={titleClasses}>{displayTitle}</h3>}
                      <button onClick={() => setIsCarouselVisible(true)} className={`group pointer-events-auto w-40 h-5 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${toggleButtonClasses} focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`} aria-label={t('lightbox.showThumbnails')}><ChevronUpIcon className={`w-5 h-5 transition-colors ${iconHoverClasses}`} /></button>
                  </motion.div>
              )}
          </AnimatePresence>
        </div>
        {filteredItems.length > 1 && !isMobileLandscape && (
            <AnimatePresence>
                {isCarouselVisible && (
                <motion.div key="lightbox-carousel-panel" className="absolute bottom-0 left-0 right-0 z-20" initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                    <div className="w-full flex justify-center">
                        <div className={`w-full max-w-5xl flex flex-col items-center justify-center relative transition-colors pt-4 ${carouselContainerClasses} rounded-t-lg`}>
                            <div ref={carouselRef} className="relative w-full overflow-x-auto lightbox-thumbnail-scroller">
                               <div className="flex items-center no-select py-2 px-2 w-max mx-auto">
                                {filteredItems.map((item, index) => (
                                    <div key={item.id} onClick={() => handleThumbnailClick(index)} className={`relative flex-shrink-0 w-20 h-20 mx-1 rounded-md overflow-hidden cursor-pointer ${thumbnailBgClasses}`}>
                                        <img src={item.imageUrl} alt="" draggable="false" className="w-full h-full object-cover"/>
                                        {currentIndex === index && ( <motion.div layoutId="lightbox-thumbnail-border" className={`absolute inset-0 border-2 ${ACCENT_BORDER_COLOR} rounded-md`}></motion.div> )}
                                    </div>
                                ))}
                               </div>
                            </div>
                             <div className="w-full flex justify-center py-3">
                                <button onClick={() => setIsCarouselVisible(false)} className={`group w-40 h-5 flex items-center justify-center rounded-full transition-colors duration-200 ${toggleButtonClasses} focus:outline-none ${ACCENT_FOCUS_VISIBLE_RING_CLASS}`} aria-label={t('lightbox.hideThumbnails')}><ChevronDownIcon className={`w-5 h-5 transition-colors ${iconHoverClasses}`} /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        )}
      </div>
    </div>
  );

  if (!lightboxRoot) { console.error("燈箱根元素未找到。"); return null; }
  return createPortal(lightboxContent, lightboxRoot);
};

export default Lightbox;