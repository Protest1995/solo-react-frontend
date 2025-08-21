import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fadeInUpItemVariants, staggerContainerVariants } from '../../animationVariants';
import CVDocument from '../pdf/CVDocument';
import CVDocumentDark from '../pdf/CVDocumentDark';
import RainEffect from '../ui/RainEffect';
import { SunIcon } from '../icons/SunIcon';
import { MoonIcon } from '../icons/MoonIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;
// 定義主題的類型
type Theme = 'light' | 'dark';

/**
 * 首頁組件 (HomePage)。
 * 這是應用程式的主要入口畫面，特色如下：
 * - 全螢幕背景圖和動態下雨效果。
 * - 帶有打字動畫的歡迎標語。
 * - 一個「下載履歷」按鈕，能動態生成並下載包含當前主題和語言的 PDF 履歷。
 */
const HomePage: React.FC = () => {
  // --- 鉤子 (Hooks) ---
  const { t, i18n } = useTranslation();
  
  // --- 狀態管理 (useState) ---
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // 追蹤 PDF 是否正在生成中，用於禁用按鈕
  const [renderPdfTriggerLang, setRenderPdfTriggerLang] = useState<string | null>(null); // 觸發隱藏的 PDF 內容渲染。當設為特定語言時，對應的 CVDocument 組件會被渲染
  const [themeForPdf, setThemeForPdf] = useState<Theme | null>(null); // 追蹤要生成哪個主題的 PDF
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark'); // 追蹤當前應用的主題（淺色或深色）

  // --- Refs ---
  const pdfContentRef = useRef<HTMLDivElement>(null); // 用於引用將要被轉換為 PDF 的隱藏 DOM 元素

  // --- 副作用 (useEffect) ---

  // 監聽 <body> 的 class 變化以同步 `currentTheme` 狀態。
  // 這使得此組件能夠響應在 App.tsx 中進行的主題切換，以生成對應主題的 PDF。
  useEffect(() => {
    const updateThemeFromBody = () => {
      const themeClass = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      setCurrentTheme(themeClass);
    };
    
    updateThemeFromBody(); // 組件掛載時立即檢查一次

    // 使用 MutationObserver 監聽屬性變化，比定時器更高效
    const observer = new MutationObserver(updateThemeFromBody);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // 組件卸載時清理 observer
    return () => observer.disconnect();
  }, []);


  /**
   * 處理下載特定主題履歷的按鈕點擊事件。
   * @param {Theme} themeToDownload - 要下載的履歷主題 ('light' 或 'dark')。
   */
  const handleDownloadCVForTheme = async (themeToDownload: Theme) => {
    if (isGeneratingPdf) return; // 防止重複點擊

    setIsGeneratingPdf(true);
    setThemeForPdf(themeToDownload); // 設置要渲染的 PDF 組件的主題
    setRenderPdfTriggerLang(i18n.language); // 觸發隱藏的 PDF 組件渲染

    // 使用兩層 `requestAnimationFrame` 以確保 React 完成渲染且瀏覽器完成佈局和繪製
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        if (pdfContentRef.current) {
          try {
            // 等待網頁字體完全加載，防止 PDF 中的文字顯示不正確
            await document.fonts.ready;

            // 使用 html2canvas 將 DOM 元素轉換為 Canvas
            const canvas = await html2canvas(pdfContentRef.current, {
              scale: 4,
              useCORS: false, 
              backgroundColor: themeToDownload === 'dark' ? '#18181B' : '#ffffff',
              width: 780,
              windowWidth: 780,
              logging: false,
              scrollX: 0, 
              scrollY: 0,
            });
            
            if (canvas.width === 0 || canvas.height === 0) throw new Error("html2canvas generated a zero-sized canvas.");

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidthMm = pdf.internal.pageSize.getWidth();
            const pdfHeightMm = pdf.internal.pageSize.getHeight();
            const imgProps = { width: canvas.width, height: canvas.height };
            const PxToMmScale = pdfWidthMm / imgProps.width; 
            
            let currentSourcePxY = 0;
            const totalSourcePxHeight = imgProps.height;
            let pageCount = 0;

            // 循環切割 Canvas 以創建 PDF 的每一頁
            while(currentSourcePxY < totalSourcePxHeight) {
              pageCount++;
              if (pageCount > 1) pdf.addPage();
              if (themeToDownload === 'dark') {
                pdf.setFillColor('#18181B'); 
                pdf.rect(0, 0, pdfWidthMm, pdfHeightMm, 'F');
              }
              
              const sourceRectHeightPx = Math.min((pdfHeightMm / PxToMmScale), totalSourcePxHeight - currentSourcePxY);
              if (sourceRectHeightPx <= 0) break;

              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = imgProps.width; 
              tempCanvas.height = sourceRectHeightPx;
              const tempCtx = tempCanvas.getContext('2d');
              if (!tempCtx) throw new Error("Could not get 2D context for temp canvas for page slicing.");
              tempCtx.drawImage(canvas, 0, currentSourcePxY, imgProps.width, sourceRectHeightPx, 0, 0, imgProps.width, sourceRectHeightPx);
              
              // 使用高品質的 JPEG 格式以大幅減小檔案大小
              const pageImgData = tempCanvas.toDataURL('image/jpeg', 0.95);
              if (!pageImgData || pageImgData === 'data:,') throw new Error(`Generated empty image data for page ${pageCount}.`);
              
              const displayHeightMm = sourceRectHeightPx * PxToMmScale;
              // 添加圖片到 PDF，指定格式為 JPEG 並使用快速壓縮
              pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, displayHeightMm, undefined, 'FAST');
              currentSourcePxY += sourceRectHeightPx;
              if (pageCount > 20) break; // 防止無限循環
            }

            // 生成動態的文件名
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const themePart = themeToDownload === 'dark' ? t('sidebar.darkMode', { lng: i18n.language }) : t('sidebar.lightMode', { lng: i18n.language });
            const themeStr = `${themePart}${i18n.language === 'zh-Hant' ? '版' : ''}`;
            const docTypePart = i18n.language === 'zh-Hant' ? '履歷表(中文)' : 'Resume(English)';
            const namePart = '黃正德(Solo)';
            const cvFileName = `${dateStr}-${themeStr}${docTypePart}-${namePart}.pdf`;
            
            pdf.save(cvFileName);

          } catch (error) {
            console.error("Error generating PDF:", error);
            alert(t('homePage.pdfGenerationError', 'Failed to generate PDF. Please check the console for details.'));
          } finally {
            setIsGeneratingPdf(false);
            setRenderPdfTriggerLang(null);
            setThemeForPdf(null); // 清理觸發器狀態
          }
        } else {
          setIsGeneratingPdf(false);
          setRenderPdfTriggerLang(null);
          setThemeForPdf(null);
          alert(t('homePage.pdfGenerationError', 'Could not prepare CV content. Ref is null.'));
        }
      });
    });
  };

  // 將問候語和標題分割成多個部分，以便對特定單詞（如 'Solo'）應用不同樣式
  const greetingText = t('homePage.greeting');
  const greetingParts = greetingText.split('Solo');
  const subtitle = t('homePage.title');
  const subtitleParts = subtitle.split('/');
  const subtitlePart1 = subtitleParts[0] ? `${subtitleParts[0].trim()} / ` : '';
  const subtitlePart2 = subtitleParts[1] ? subtitleParts[1].trim() : '';

  // --- 渲染 (JSX) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden -m-6 md:-m-12">
      {/* 背景圖片 */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/images/home-bg.jpg')", zIndex: 0 }} />
      {/* 主題顏色遮罩層 */}
      <div className={`absolute inset-0 bg-theme-secondary`} style={{ zIndex: 0, opacity: currentTheme === 'light' ? 0.08 : 0.7 }} />
      {/* 下雨效果 */}
      <RainEffect />

      {/* 主要內容，帶有 Framer Motion 動畫 */}
      <motion.div className="relative z-10 p-6 pt-16 sm:pt-20 md:pt-6" variants={staggerContainerVariants(0.3)} initial="initial" animate="animate">
        <motion.h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-theme-primary font-playfair" variants={fadeInUpItemVariants}>
          {greetingParts[0]}<span className="text-glow-cyan">Solo</span>{greetingParts[1]}
        </motion.h1>
        <motion.p className="mt-4 text-xl sm:text-2xl md:text-3xl font-medium font-playfair" variants={fadeInUpItemVariants}>
          <span className="text-glow-cyan">{subtitlePart1}</span>
          <span className="text-theme-secondary">{subtitlePart2}</span>
        </motion.p>
        <motion.p className="mt-6 max-w-2xl mx-auto text-theme-secondary text-lg" variants={fadeInUpItemVariants}>
          {t('homePage.description')}
        </motion.p>
        <motion.div className="mt-12 sm:mt-10" variants={fadeInUpItemVariants}>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* 淺色履歷按鈕 */}
            <button
              onClick={() => handleDownloadCVForTheme('light')}
              disabled={isGeneratingPdf}
              className={`font-semibold py-3 px-6 rounded-full text-base transition-all duration-300 shadow-md flex items-center disabled:opacity-70 disabled:cursor-not-allowed ${
                currentTheme === 'light' ? 'button-theme-neutral' : 'button-theme-toggle'
              } hover:scale-105 hover:shadow-[0_0_15px_var(--accent-shadow-color)]`}
            >
              <SunIcon className="w-5 h-5 mr-2" />
              <span>{isGeneratingPdf && themeForPdf === 'light' ? t('homePage.generatingPdf') : t('homePage.downloadLightCV')}</span>
            </button>

            {/* 深色履歷按鈕 */}
            <button
              onClick={() => handleDownloadCVForTheme('dark')}
              disabled={isGeneratingPdf}
              className={`font-semibold py-3 px-6 rounded-full text-base transition-all duration-300 shadow-md flex items-center disabled:opacity-70 disabled:cursor-not-allowed ${
                currentTheme === 'dark' ? 'button-theme-neutral' : 'button-theme-toggle'
              } hover:scale-105 hover:shadow-[0_0_15px_var(--accent-shadow-color)]`}
            >
              <MoonIcon className="w-5 h-5 mr-2" />
              <span>{isGeneratingPdf && themeForPdf === 'dark' ? t('homePage.generatingPdf') : t('homePage.downloadDarkCV')}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* 隱藏的 PDF 內容渲染區域 */}
      {renderPdfTriggerLang && themeForPdf && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -100 }}>
          <div ref={pdfContentRef}>
            {themeForPdf === 'dark' ? (
                <CVDocumentDark language={renderPdfTriggerLang} />
            ) : (
                <CVDocument language={renderPdfTriggerLang} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;