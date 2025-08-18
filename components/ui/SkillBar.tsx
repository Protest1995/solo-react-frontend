// 引入 React 相關鉤子
import React, { useEffect, useRef } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫相關鉤子
import { motion as motionTyped, useInView, animate } from 'framer-motion';
// 引入類型定義
import { Skill } from '../../types';
// 引入顏色常數
import { ACCENT_BG_COLOR } from '../../constants';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

/**
 * 技能進度條組件。
 * 當組件進入視圖時，會以動畫形式展示技能水平，並帶有數字滾動效果。
 */
const SkillBar: React.FC<Skill> = ({ nameKey, level }) => {
  const { t } = useTranslation();
  // Ref 用於追踪組件是否在視口內
  const ref = useRef<HTMLDivElement>(null);
  // `useInView` 鉤子返回一個布林值，表示 ref 所引用的元素是否在視口內
  // `once: true` 確保動畫只觸發一次
  // `amount: 0.5` 表示當組件 50% 可見時觸發
  const isInView = useInView(ref, { once: true, amount: 0.5 }); 

  // Ref 用於追踪顯示百分比數字的 span 元素
  const countRef = useRef<HTMLSpanElement>(null);

  // 當組件進入視圖時，觸發數字滾動動畫
  useEffect(() => {
    if (isInView && countRef.current) {
      const node = countRef.current;
      // 使用 Framer Motion 的 animate 函數創建從 0 到 `level` 的動畫
      const controls = animate(0, level, {
        duration: 1.5,
        ease: "circOut", // 使用 "circOut" 緩動函數，效果為快速開始，緩慢結束
        onUpdate(value) {
          // 在動畫的每一幀更新 span 的文本內容
          node.textContent = Math.round(value).toString();
        },
      });

      // 組件卸載或 effect 重新運行時停止動畫，防止內存洩漏
      return () => controls.stop();
    }
  }, [isInView, level]);
  
  // 進度條寬度的動畫變體
  const barVariants = {
    hidden: { width: "0%" }, // 初始狀態：寬度為 0
    visible: { 
      width: `${level}%`, // 可見狀態：寬度為技能水平百分比
      transition: {
        duration: 1.5,
        ease: "circOut",
      }
    }
  };

  return (
    <div ref={ref}>
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-theme-primary">{t(nameKey)}</span>
        <span className={`text-sm font-medium text-custom-cyan`}>
          <span ref={countRef}>0</span>%
        </span>
      </div>
      <div className="w-full bg-theme-tertiary rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`${ACCENT_BG_COLOR} h-2.5 rounded-full`}
          variants={barVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"} // 根據是否在視圖內來觸發動畫
          aria-valuenow={level}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar" // WAI-ARIA 角色，增強可訪問性
          aria-label={`${t(nameKey)} skill level`}
        />
      </div>
    </div>
  );
};

export default SkillBar;
