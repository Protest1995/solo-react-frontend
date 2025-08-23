// 引入 React 相關鉤子
import React, { useRef, useEffect } from 'react';

/**
 * 下雨效果組件。
 * 使用 HTML Canvas 創建一個動態的、全螢幕的下雨背景動畫。
 * 效果會適應窗口大小和主題顏色變化。
 */
const RainEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    // 定義雨滴的類型
    let drops: { x: number; y: number; length: number; speed: number; }[] = [];

    // 初始化 Canvas 和雨滴
    const setup = () => {
      // 設置 Canvas 尺寸與窗口大小一致
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const bodyStyles = window.getComputedStyle(document.body);
      const isLightTheme = document.body.classList.contains('theme-light');

      // 根據主題設定雨滴顏色和光暈
      const rainColor = isLightTheme ? '#31e3daff' : bodyStyles.getPropertyValue('--accent-cyan').trim();
      const shadowColor = isLightTheme ? 'rgba(32, 178, 170, 0.4)' : bodyStyles.getPropertyValue('--accent-shadow-color').trim();

      // 為雨滴設置帶有光暈效果的樣式
      ctx.strokeStyle = rainColor;
      ctx.lineWidth = 1.5; // 使雨滴稍微加粗
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.7; // 略微提高不透明度以增強效果
      
      // 添加陰影來創建光暈
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 10;

      drops = [];
      // 根據螢幕寬度動態調整雨滴數量
      const numberOfDrops = Math.floor((canvas.width / 1920) * 150); 

      // 創建雨滴數組，為每個雨滴隨機設定初始屬性
      for (let i = 0; i < numberOfDrops; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: Math.random() * 20 + 10,
          speed: Math.random() * 5 + 2,
        });
      }
    };

    // 繪製每一幀的動畫
    const draw = () => {
      // 清除上一幀的畫面
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const drop of drops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length); // 稍微傾斜
        ctx.stroke();

        // 更新雨滴位置
        drop.y += drop.speed;

        // 當雨滴落出螢幕時，重置其位置到頂部
        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
      }
      // 請求下一幀動畫
      animationFrameId = requestAnimationFrame(draw);
    };

    // 處理窗口大小變化的回調
    const handleResize = () => {
      cancelAnimationFrame(animationFrameId); // 停止當前動畫
      setup(); // 重新計算
      draw(); // 重新開始繪製
    };
    
    // 初始化並啟動動畫
    setup();
    draw();

    // 添加窗口大小變化的事件監聽器
    window.addEventListener('resize', handleResize);
    
    // 新增：監聽主題變化
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                handleResize(); // 主題變化時，重新設定並繪製雨滴
            }
        }
    });
    observer.observe(document.body, { attributes: true });

    // 組件卸載時的清理函數
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []); // 空依賴數組確保此 effect 只在組件掛載時運行一次

  return (
    <canvas 
        ref={canvasRef} 
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
        aria-hidden="true" // 對輔助技術隱藏，因為它純粹是裝飾性的
    />
  );
};

export default RainEffect;