// 引入 React 相關鉤子
import React, { useState, useEffect, useMemo } from 'react';
// 引入 Framer Motion 動畫庫
import { motion } from 'framer-motion';

// 組件屬性介面
interface SplashScreenProps {
  onAnimationComplete: () => void; // 動畫完成後的回調函數
}

/**
 * 應用程式啟動畫面組件。
 * 顯示一個帶有打字效果和光標動畫的歡迎訊息，動畫結束後觸發回調。
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  // --- 狀態管理 ---
  const [charIndex, setCharIndex] = useState(0); // 當前顯示的字符索引
  const [isTypingFinished, setIsTypingFinished] = useState(false); // 打字效果是否完成
  const [isExiting, setIsExiting] = useState(false); // 是否開始退出動畫

  // 使用 useMemo 來定義文本片段，以便對 "Solo" 應用特殊樣式
  const textParts = useMemo(() => [
    { text: "Welcome to ", isSpecial: false },
    { text: "Solo", isSpecial: true },
    { text: "Project", isSpecial: false, prependSpace: true },
  ], []);

  // 將文本片段組合成完整的字符串
  const fullText = useMemo(() => 
    textParts.map(p => (p.prependSpace ? ' ' : '') + p.text).join(''),
    [textParts]
  );

  // --- 動畫參數 ---
  const typingSpeed = 100; // 打字速度 (毫秒)
  const blinkDuration = 0.5; // 光標閃爍週期 (秒)
  const exitDelay = 2000; // 打字完成後等待多久開始退出 (毫秒)

  // --- 副作用 (useEffect) ---

  // 打字效果的 useEffect
  useEffect(() => {
    if (charIndex < fullText.length) {
      const timer = setTimeout(() => {
        setCharIndex(prev => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timer);
    } else {
      // 打字完成後，設置完成狀態
      setIsTypingFinished(true);
    }
  }, [charIndex, fullText.length]);

  // 觸發退出動畫的 useEffect
  useEffect(() => {
    if (isTypingFinished) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, exitDelay);
      return () => clearTimeout(timer);
    }
  }, [isTypingFinished]);
  
  // 退出動畫完成後，調用父組件的回調
  const handleExitAnimationComplete = () => {
    onAnimationComplete();
  };

  // 渲染帶有樣式的文本
  const renderText = () => {
    const visibleText = fullText.slice(0, charIndex);
    const partsToRender = [];
    let currentIndex = 0;

    for (const part of textParts) {
      const textWithSpace = (part.prependSpace ? ' ' : '') + part.text;
      const partEndIndex = currentIndex + textWithSpace.length;
      
      if (visibleText.length > currentIndex) {
        const slicedText = visibleText.slice(currentIndex, partEndIndex);
        partsToRender.push(
          <span key={part.text} className={part.isSpecial ? 'text-splash-cyan' : 'text-black'}>
            {slicedText}
          </span>
        );
      }
      currentIndex = partEndIndex;
    }
    return partsToRender;
  };
  
  // 光標的動畫變體
  const cursorVariants = {
    blinking: {
      opacity: [0, 1, 1, 0], // 定義一個閃爍週期內的透明度變化
      transition: {
        duration: blinkDuration,
        repeat: Infinity,
        repeatType: 'loop' as const,
        times: [0, 0.5, 0.5, 1], // 控制透明度變化的時間點
      },
    },
    visible: { opacity: 1 }, // 持續可見
  };

  return (
    <motion.div
      key="splash-screen"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }} // 觸發退出動畫
      transition={{ duration: 0.5 }}
      onAnimationComplete={isExiting ? handleExitAnimationComplete : undefined}
    >
       <style>
      {`
      /* 由於此組件獨立於主應用的主題系統，直接定義顏色 */
      .text-splash-cyan {
          color: var(--accent-cyan);
      }
      `}
      </style>
      <div 
        className="font-sans text-3xl md:text-5xl font-bold flex items-center"
        aria-label={fullText} // 為輔助技術提供完整的文本內容
        style={{ whiteSpace: 'pre' }} // 保留 span 之間的空格
      >
        {renderText()}
        <motion.span
          className="w-1 md:w-1.5 h-8 md:h-12 bg-black"
          variants={cursorVariants}
          animate={isTypingFinished ? 'blinking' : 'visible'} // 打字時光標可見，完成後開始閃爍
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
};

export default SplashScreen;
