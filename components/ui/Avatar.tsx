// 引入 React 相關鉤子
import React, { useState, useEffect } from 'react';

// 定義 Avatar 組件的屬性介面
interface AvatarProps {
  src: string | null | undefined; // 頭像圖片的 URL
  username: string; // 用戶名，用於 alt 文本和後備顯示
  className?: string; // 可選的 CSS class 名稱
}

/**
 * Avatar 組件。
 * 負責顯示用戶頭像。如果圖片加載失敗或未提供，則顯示用戶名的首字母作為後備。
 */
const Avatar: React.FC<AvatarProps> = ({ src, username, className = 'w-10 h-10' }) => {
  // 狀態：用於追蹤圖片是否加載失敗
  const [error, setError] = useState(false);

  // 當 src prop 改變時，重置錯誤狀態
  useEffect(() => {
    setError(false);
  }, [src]);

  // 圖片加載失敗時的回調函數
  const handleImageError = () => {
    setError(true);
  };

  // 獲取用戶名的首字母大寫形式，用於後備顯示
  const initial = username ? username.charAt(0).toUpperCase() : '?';

  // 如果圖片加載失敗或 src 未提供，則渲染後備的字母頭像
  if (error || !src) {
    return (
      <div className={`${className} rounded-full bg-theme-tertiary flex items-center justify-center text-theme-primary font-bold select-none`}>
        <span>{initial}</span>
      </div>
    );
  }

  // 正常渲染圖片頭像
  return (
    <img
      src={src}
      alt={`${username}'s avatar`}
      className={`${className} rounded-full object-cover`}
      onError={handleImageError}
    />
  );
};

export default Avatar;
