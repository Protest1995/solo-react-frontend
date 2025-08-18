// 引入 React 相關鉤子
import React, { useEffect } from 'react';
// 引入 react-dom 的 createPortal，用於將組件渲染到 DOM 的不同部分
import { createPortal } from 'react-dom';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion, AnimatePresence } from 'framer-motion';
// 引入圖標組件
import CloseIcon from '../icons/CloseIcon';

// 組件屬性介面
interface ConfirmationModalProps {
  isOpen: boolean; // 模態框是否開啟
  onClose: () => void; // 關閉模態框的回調
  onConfirm: () => void; // 確認操作的回調
  title: string; // 模態框標題
  message: React.ReactNode; // 模態框消息內容
}

/**
 * 通用的確認模態框組件。
 * 用於需要用戶二次確認的敏感操作（例如刪除）。
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { t } = useTranslation();
  // 獲取用於渲染模態框的根 DOM 元素
  const modalRoot = document.getElementById('lightbox-root');

  // 處理鍵盤事件的 effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按下 Escape 鍵時關閉模態框
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // 組件卸載時移除事件監聽器
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 如果找不到模態框的根元素，則不渲染任何內容
  if (!modalRoot) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        // 背景遮罩層
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // 點擊遮罩層關閉模態框
        >
          {/* 模態框主體 */}
          <motion.div
            className="bg-theme-secondary rounded-lg shadow-2xl p-6 w-full max-w-sm mx-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()} // 防止點擊模態框內部觸發遮罩層的關閉事件
            role="alertdialog" // WAI-ARIA 角色，表示這是一個需要用戶響應的對話框
            aria-labelledby="modal-title"
            aria-describedby="modal-message"
          >
            {/* 標題和關閉按鈕 */}
            <div className="flex justify-between items-center mb-4">
              <h3 id="modal-title" className="text-xl font-semibold text-theme-primary">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-full text-theme-secondary hover:bg-theme-hover hover:text-theme-primary transition-colors" aria-label={t('lightbox.close')}>
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            {/* 消息內容 */}
            <div id="modal-message" className="text-theme-secondary mb-6">{message}</div>
            {/* 操作按鈕 */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  onConfirm(); // 執行確認操作
                  onClose();   // 關閉模態框
                }}
                className="button-theme-danger font-semibold py-2 px-5 rounded-md transition-all"
              >
                {t('portfolioPage.confirmDeleteButton', 'Confirm Delete')}
              </button>
              <button
                onClick={onClose}
                className="button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all"
              >
                {t('portfolioPage.cancelButton', 'Cancel')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 使用 React Portal 將模態框渲染到指定的 DOM 節點
  return createPortal(modalContent, modalRoot);
};

export default ConfirmationModal;