// 引入 React 相關鉤子和功能
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// 引入 Framer Motion 動畫庫
import { motion, AnimatePresence } from 'framer-motion';
// 引入圖標組件
import CloseIcon from '../icons/CloseIcon';
import ClipboardCopyIcon from '../icons/ClipboardCopyIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

// 定義模態框的屬性介面
interface GeneratedCodeModalProps {
  isOpen: boolean; // 模態框是否開啟
  onClose: () => void; // 關閉模態框的回調
  title: string; // 模態框標題
  jsonCode: string; // 要顯示的 JSON 程式碼字符串
  imageFileName: string; // 相關的圖片文件名
  targetPath: string; // 提示用戶要貼上程式碼的目標文件路徑
}

/**
 * 已生成代碼的模態框組件。
 * 用於在用戶通過表單（非批次）新增靜態內容後，提供一個包含兩步驟的引導：
 * 1. 複製生成的 JSON 物件。
 * 2. 手動將對應的圖片文件移動到項目的指定目錄。
 */
const GeneratedCodeModal: React.FC<GeneratedCodeModalProps> = ({ isOpen, onClose, title, jsonCode, imageFileName, targetPath }) => {
  // 獲取用於渲染模態框的根 DOM 元素
  const modalRoot = document.getElementById('lightbox-root');
  // 狀態：追蹤程式碼是否已成功複製
  const [copied, setCopied] = useState(false);

  // 當模態框關閉時，延遲重置 'copied' 狀態
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setCopied(false), 300); // 在關閉動畫後重置
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 處理複製按鈕的點擊事件
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonCode).then(() => {
      setCopied(true);
      // 2 秒後自動重置複製成功狀態
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 處理鍵盤事件的 effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按下 Escape 鍵時關閉模態框
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    // 組件卸載時移除事件監聽器
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 如果找不到模態框的根元素，則不渲染任何內容
  if (!modalRoot) return null;

  // 模態框的 JSX 內容
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // 點擊背景遮罩層關閉模態框
        >
          <motion.div
            className="bg-theme-secondary rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-auto flex flex-col"
            style={{ maxHeight: '90vh' }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()} // 防止點擊模態框內部觸發關閉
            role="alertdialog"
            aria-labelledby="modal-title"
          >
            {/* 模態框頭部 */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 id="modal-title" className="text-xl font-semibold text-theme-primary">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-full text-theme-secondary hover:bg-theme-hover hover:text-theme-primary transition-colors" aria-label="Close">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* 可滾動的內容區域 */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {/* 步驟一：複製 JSON */}
                <div>
                    <h4 className="font-semibold text-theme-primary mb-2">Step 1: Copy JSON Code</h4>
                    <p className="text-sm text-theme-secondary mb-2">
                        Click the button to copy the code, then open the file <code className="bg-theme-tertiary text-custom-cyan px-1 py-0.5 rounded">{targetPath}</code> in your editor and paste it at the beginning of the array (right after the opening <code className="bg-theme-tertiary text-custom-cyan px-1 rounded">[</code> and before the first existing item). Add a comma after your new item if it's not the last one.
                    </p>
                    <div className="relative">
                        <pre className="bg-theme-tertiary p-4 rounded-md text-sm text-theme-primary overflow-x-auto">
                        <code>{jsonCode}</code>
                        </pre>
                        <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md bg-theme-secondary hover:bg-theme-hover transition-colors">
                        {copied ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <ClipboardCopyIcon className="w-5 h-5 text-theme-secondary" />}
                        </button>
                    </div>
                </div>

                {/* 步驟二：移動圖片 */}
                <div>
                    <h4 className="font-semibold text-theme-primary mb-2">Step 2: Move Image File</h4>
                    <p className="text-sm text-theme-secondary">
                        Find the image file <code className="bg-theme-tertiary text-custom-cyan px-1 py-0.5 rounded">{imageFileName}</code> on your computer and move it into the following folder in your project:
                    </p>
                    <p className="bg-theme-tertiary text-custom-cyan p-2 mt-2 rounded-md text-sm">public/images/{targetPath.includes('Posts') ? 'posts' : 'portfolio'}/</p>
                </div>
            </div>

            {/* 模態框底部操作按鈕 */}
            <div className="mt-6 flex justify-end flex-shrink-0">
              <button
                onClick={onClose}
                className="button-theme-accent text-zinc-900 font-semibold py-2 px-5 rounded-md transition-all"
              >
                Done
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

export default GeneratedCodeModal;
