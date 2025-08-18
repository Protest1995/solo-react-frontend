// 引入 React 相關鉤子
import React, { useState, useEffect } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';

// 組件屬性介面
interface TimeAgoProps {
  date: string | number | Date; // 接受多種格式的日期（ISO 字符串、時間戳或 Date 對象）
}

/**
 * TimeAgo 組件。
 * 將一個日期轉換為相對時間的描述（例如 "5分鐘前"），並會定時更新。
 */
const TimeAgo: React.FC<TimeAgoProps> = ({ date }) => {
  const { i18n } = useTranslation();
  // 狀態：存儲計算後的相對時間字符串
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    // 格式化相對時間的函數
    const formatTimeAgo = () => {
      const now = new Date();
      // 計算從給定日期到現在的時間差（秒）
      const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
      
      // 計算時間間隔並返回對應的字符串
      let interval = seconds / 31536000; // 年
      if (interval > 1) {
        return Math.floor(interval) + (i18n.language === 'zh-Hant' ? '年前' : ' years ago');
      }
      interval = seconds / 2592000; // 月
      if (interval > 1) {
        return Math.floor(interval) + (i18n.language === 'zh-Hant' ? '個月前' : ' months ago');
      }
      interval = seconds / 86400; // 天
      if (interval > 1) {
        return Math.floor(interval) + (i18n.language === 'zh-Hant' ? '天前' : ' days ago');
      }
      interval = seconds / 3600; // 小時
      if (interval > 1) {
        return Math.floor(interval) + (i18n.language === 'zh-Hant' ? '小時前' : ' hours ago');
      }
      interval = seconds / 60; // 分鐘
      if (interval > 1) {
        return Math.floor(interval) + (i18n.language === 'zh-Hant' ? '分鐘前' : ' minutes ago');
      }
      // 如果時間差小於一分鐘
      return i18n.language === 'zh-Hant' ? '剛剛' : 'just now';
    };

    // 初始化時計算一次
    setTimeAgo(formatTimeAgo());

    // 設置定時器，每分鐘更新一次，以保持時間的相對準確性
    const timer = setInterval(() => {
      setTimeAgo(formatTimeAgo());
    }, 60000); 

    // 組件卸載時清除定時器，防止內存洩漏
    return () => clearInterval(timer);
  }, [date, i18n.language]); // 當日期或語言改變時，重新運行 effect 以更新顯示

  // 使用 title 屬性在用戶懸停時顯示完整的日期時間，增強可訪問性
  return <span title={new Date(date).toLocaleString()}>{timeAgo}</span>;
};

export default TimeAgo;
