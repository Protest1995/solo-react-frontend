// 引入 React
import React, { useRef } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion, useInView } from 'framer-motion';
// 引入類型定義
import { TimelineItem } from '../../types';
// 引入顏色常數
import { ACCENT_SOLID_BG_COLOR } from '../../constants';

// 擴展 TimelineItem 類型，增加一個可選屬性
interface CustomTimelineItem extends TimelineItem {
  renderWithHeaders?: boolean; // 是否將描述渲染為帶有子標題的格式
}

/**
 * 時間軸事件組件。
 * 用於在履歷頁面中展示單個工作經歷或教育背景。
 */
const TimelineEvent: React.FC<CustomTimelineItem> = ({ date, titleKey, institutionKey, descriptionKey, renderWithHeaders = false }) => {
  const { t } = useTranslation();
  const description = t(descriptionKey);
  
  // Framer Motion 的 in-view 偵測
  const ref = useRef(null);
  // `useInView` 鉤子返回一個布林值，表示 ref 所引用的元素是否在視口內
  // `once: true` 確保動畫只觸發一次
  // `amount: 0.5` 表示當組件 50% 可見時觸發
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  // 描述中子標題下劃線的動畫變體
  const underlineVariants = {
    hidden: { scaleX: 0, originX: 0 }, // 初始狀態：從左側開始，寬度為 0
    visible: { 
      scaleX: 1, // 可見狀態：寬度為 100%
      transition: { 
        duration: 1.8, 
        ease: [0.25, 1, 0.5, 1] as const, // 使用平滑的 ease-out 曲線
        delay: 0.3 
      } 
    }
  };
  

  // 渲染描述的輔助函數
  const renderDescription = () => {
    if (!description) return null;

    // 如果啟用帶標題的渲染模式
    if (renderWithHeaders) {
      // 按兩個換行符分割成段落
      const parts = description.split('\n\n');

      return parts.map((part, partIndex) => {
        const lines = part.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return null;
        // 判斷是否為標題段落（不以 '•' 開頭）
        const isHeaderSection = !lines[0].trim().startsWith('•');

        if (isHeaderSection) {
          // 渲染標題和其後的普通文本
          return (
            <div key={partIndex} className="mt-4 first:mt-0">
              <div className="relative inline-block mb-2">
                <strong className="font-bold text-theme-primary">{lines[0]}</strong>
                <motion.span 
                  style={{ width: 'calc(100% - 0.875rem)' }} 
                  className={`absolute -bottom-1 left-0 h-0.5 ${ACCENT_SOLID_BG_COLOR}`}
                  variants={underlineVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"} // 根據是否在視圖內觸發動畫
                />
              </div>
              {lines.slice(1).map((line, lineIndex) => (
                <p key={lineIndex} className="text-theme-secondary">{line}</p>
              ))}
            </div>
          );
        } else {
          // 渲染列表項
          return (
            <div key={partIndex} className="mt-3 space-y-1.5">
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex text-theme-secondary">
                  <span className="w-5 text-center flex-shrink-0">•</span>
                  <p className="flex-1">{line.substring(line.indexOf('•') + 1).trim()}</p>
                </div>
              ))}
            </div>
          );
        }
      });
    }
    
    // 默認渲染為單個列表項
    return (
        <div className="flex text-theme-secondary">
          <span className="w-5 text-center flex-shrink-0">•</span>
          <p className="flex-1">{description}</p>
        </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <div className="bg-theme-secondary p-5 rounded-lg shadow-md hover:shadow-[0_0_10px_rgba(112,255,255,0.3)] transition-shadow duration-300">
        <p className={`text-xs text-custom-cyan uppercase font-medium mb-1`}>{date}</p>
        <h4 className="text-xl font-semibold text-theme-primary">{t(titleKey)}</h4>
        <p className="text-sm text-theme-secondary mb-2">{t(institutionKey)}</p>
        {description && 
          <div className="text-sm leading-relaxed mt-3">
            {renderDescription()}
          </div>
        }
      </div>
    </div>
  );
};

export default TimelineEvent;
