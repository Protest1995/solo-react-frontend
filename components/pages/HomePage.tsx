
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ACCENT_TEXT_GRADIENT_COLOR } from '../../constants';
import DownloadIcon from '../icons/DownloadIcon';
import { fadeInUpItemVariants, staggerContainerVariants } from '../../animationVariants';
import CVDocument from '../pdf/CVDocument';
import CVDocumentDark from '../pdf/CVDocumentDark';
import RainEffect from '../ui/RainEffect';

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
   * 處理下載履歷按鈕的點擊事件。
   * 這是一個複雜的異步函數，它執行以下步驟來動態生成 PDF：
   * 1. 觸發一個隱藏的 React 組件 (CVDocument 或 CVDocumentDark) 以當前語言和主題重新渲染。
   * 2. 使用 `requestAnimationFrame` 確保 DOM 更新完成。
   * 3. 使用 `html2canvas` 將該組件渲染成一個高解析度的 Canvas 圖像。
   * 4. 使用 `jsPDF` 將該圖像按 A4 紙張大小切割成多頁，並生成 PDF 文件。
   */
  const handleDownloadCV = async () => {
    setIsGeneratingPdf(true);
    setRenderPdfTriggerLang(i18n.language); // 設置語言以觸發對應的 CVDocument 組件渲染

    // 使用兩層 `requestAnimationFrame` 以確保 React 完成渲染且瀏覽器完成佈局和繪製。
    // 這是捕獲最新 DOM 狀態的可靠方法，避免截圖到舊的內容。
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        if (pdfContentRef.current) {
          try {
            // 關鍵步驟：等待網頁字體（如 Noto Sans TC）完全加載。
            // 這可以防止 html2canvas 在字體還未準備好時就截圖，從而導致 PDF 中的文字使用後備字體或顯示不正確。
            await document.fonts.ready;

            // 使用 html2canvas 將 DOM 元素轉換為 Canvas
            const canvas = await html2canvas(pdfContentRef.current, {
              scale: 2, // 提高解析度以獲得更清晰的 PDF
              useCORS: false, 
              backgroundColor: currentTheme === 'dark' ? '#18181B' : '#ffffff', // 根據主題設置背景色
              width: 780, // 強制畫布寬度以匹配設計，避免響應式佈局影響
              windowWidth: 780, 
              logging: false, // 在生產中關閉調試日誌
              scrollX: 0, 
              scrollY: 0,
            });
            
            // 驗證 Canvas 是否成功生成
            if (canvas.width === 0 || canvas.height === 0) throw new Error("html2canvas 產生的畫布尺寸為零。");
            
            const imgData = canvas.toDataURL('image/png');
            if (!imgData || imgData === 'data:,') throw new Error("html2canvas 產生的圖像數據為空。");

            // 初始化 jsPDF 實例
            const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' - 縱向, 'mm' - 毫米, 'a4' - 紙張尺寸
            const pdfWidthMm = pdf.internal.pageSize.getWidth();
            const pdfHeightMm = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData); 

            // 計算從像素到毫米的縮放比例
            const PxToMmScale = pdfWidthMm / imgProps.width; 
            
            let currentSourcePxY = 0; // 當前在源 Canvas 上切割的 Y 軸起點
            const totalSourcePxHeight = imgProps.height;
            let pageCount = 0;

            // 循環切割 Canvas 以創建 PDF 的每一頁
            while(currentSourcePxY < totalSourcePxHeight) {
              pageCount++;
              if (pageCount > 1) pdf.addPage();
              
              // 如果是深色模式，為 PDF 頁面填充背景色
              if (currentTheme === 'dark') {
                pdf.setFillColor('#18181B'); 
                pdf.rect(0, 0, pdfWidthMm, pdfHeightMm, 'F');
              }
              
              // 計算當前頁面需要從源 Canvas 切割的高度（像素）
              const sourceRectHeightPx = Math.min((pdfHeightMm / PxToMmScale), totalSourcePxHeight - currentSourcePxY);
              if (sourceRectHeightPx <= 0) break;

              // 創建一個臨時 Canvas 來存放切割出的單頁圖像
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = imgProps.width; 
              tempCanvas.height = sourceRectHeightPx;
              const tempCtx = tempCanvas.getContext('2d');
              if (!tempCtx) throw new Error("無法從臨時畫布獲取 2D 上下文以進行頁面切割。");
              tempCtx.drawImage(canvas, 0, currentSourcePxY, imgProps.width, sourceRectHeightPx, 0, 0, imgProps.width, sourceRectHeightPx);
              
              const pageImgData = tempCanvas.toDataURL('image/png');
              if (!pageImgData || pageImgData === 'data:,') throw new Error(`為第 ${pageCount} 頁生成的圖像數據為空。`);
              
              // 將單頁圖像添加到 PDF 中
              const displayHeightMm = sourceRectHeightPx * PxToMmScale;
              pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidthMm, displayHeightMm);
              currentSourcePxY += sourceRectHeightPx;
              if (pageCount > 20) break; // 防止無限循環
            }

            // 生成動態的文件名
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const themePart = currentTheme === 'dark' ? t('sidebar.darkMode', { lng: i18n.language }) : t('sidebar.lightMode', { lng: i18n.language });
            const themeStr = `${themePart}${i18n.language === 'zh-Hant' ? '版' : ''}`;
            const docTypePart = i18n.language === 'zh-Hant' ? '履歷表(中文)' : 'Resume(English)';
            const namePart = '黃正德(Solo)';
            const cvFileName = `${dateStr}-${themeStr}${docTypePart}-${namePart}.pdf`;
            
            pdf.save(cvFileName);

          } catch (error) {
            console.error("生成 PDF 時發生詳細錯誤:", error);
            alert(t('homePage.pdfGenerationError', '生成 PDF 失敗。請再試一次。詳情請查看控制台。'));
          } finally {
            setIsGeneratingPdf(false);
            setRenderPdfTriggerLang(null); // 清理觸發器狀態，卸載 CVDocument 組件
          }
        } else {
          setIsGeneratingPdf(false);
          setRenderPdfTriggerLang(null);
          alert(t('homePage.pdfGenerationError', '無法準備履歷內容。Ref 為空。'));
        }
      });
    });
  };

  // 將問候語和標題分割成多個部分，以便對特定單詞（如 'Solo'）應用不同樣式
  const greetingText = t('homePage.greeting');
  const greetingParts = greetingText.split('Solo');

  const titleText = t('homePage.title');
  const separator = ' / ';
  const separatorIndex = titleText.indexOf(separator);
  const titlePart1 = separatorIndex !== -1 ? titleText.substring(0, separatorIndex + separator.length) : titleText;
  const titlePart2 = separatorIndex !== -1 ? titleText.substring(separatorIndex + separator.length) : '';

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
        <motion.h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-theme-primary" variants={fadeInUpItemVariants}>
          {greetingParts[0]}<span className={ACCENT_TEXT_GRADIENT_COLOR}>Solo</span>{greetingParts[1]}
        </motion.h1>
        <motion.p className="mt-4 text-xl sm:text-2xl md:text-3xl font-medium" variants={fadeInUpItemVariants}>
          <span className={ACCENT_TEXT_GRADIENT_COLOR}>{titlePart1}</span>
          <span className="text-theme-primary">{titlePart2}</span>
        </motion.p>
        <motion.p className="mt-6 max-w-2xl mx-auto text-theme-secondary text-lg" variants={fadeInUpItemVariants}>
          {t('homePage.description')}
        </motion.p>
        <motion.div className="mt-12 sm:mt-10" variants={fadeInUpItemVariants}>
          <button onClick={handleDownloadCV} disabled={isGeneratingPdf} className={`button-theme-accent font-semibold py-3 px-8 rounded-full text-lg transition-all duration-300 shadow-lg flex items-center mx-auto disabled:opacity-70 disabled:cursor-not-allowed`}>
            <DownloadIcon className="w-5 h-5 mr-2" />
            {isGeneratingPdf ? t('homePage.generatingPdf', '正在生成 PDF...') : t('homePage.downloadCV')}
          </button>
        </motion.div>
      </motion.div>

      {/* 隱藏的 PDF 內容渲染區域。只有在 `renderPdfTriggerLang` 被設置時才會渲染。 */}
      {renderPdfTriggerLang && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -100 }}>
          <div ref={pdfContentRef}>
            {currentTheme === 'dark' ? (
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
