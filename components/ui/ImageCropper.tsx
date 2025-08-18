// 引入 React 相關鉤子
import React, { useState, useRef } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 react-image-crop 庫及其相關類型和輔助函數
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
// 引入 Framer Motion 動畫庫
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
// 引入顏色常數
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR } from '../../constants';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 組件屬性介面
interface ImageCropperProps {
  src: string | null; // 要裁剪的圖片的數據 URL
  onSave: (croppedImageUrl: string) => void; // 保存裁剪後圖片的回調
  onCancel: () => void; // 取消裁剪的回調
}

/**
 * 輔助函數：在圖片中心創建一個具有指定寬高比的裁剪框。
 * @param {number} mediaWidth - 圖片的原始寬度。
 * @param {number} mediaHeight - 圖片的原始高度。
 * @param {number} aspect - 裁剪框的寬高比。
 * @returns {Crop} - 計算出的裁剪框對象。
 */
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: 90 }, // 初始裁剪框寬度為圖片寬度的 90%
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

/**
 * 圖片裁剪器組件。
 * 提供一個模態框，允許用戶上傳圖片並將其裁剪為 1:1 的正方形。
 */
const ImageCropper: React.FC<ImageCropperProps> = ({ src, onSave, onCancel }) => {
  const { t } = useTranslation();
  // Refs 用於訪問 DOM 元素
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  // 狀態管理
  const [crop, setCrop] = useState<Crop>(); // 當前裁剪框的位置和大小
  const [completedCrop, setCompletedCrop] = useState<Crop>(); // 完成拖動後的裁剪框數據
  const aspect = 1; // 設置裁剪框的寬高比為 1:1

  // 圖片加載完成後的回調
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // 初始化裁剪框，使其居中並具有指定的寬高比
    setCrop(centerAspectCrop(width, height, aspect));
  }

  // 獲取裁剪後的圖片數據
  function getCroppedImage(): Promise<string> {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    if (!image || !canvas || !completedCrop) {
      throw new Error('裁剪畫布不存在');
    }

    // 計算從顯示尺寸到原始圖片尺寸的縮放比例
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1; // 考慮高 DPI 螢幕以獲得更清晰的輸出

    // 設置 canvas 的尺寸以匹配裁剪區域的原始像素大小
    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('無法獲取 2D 上下文');
    }

    ctx.scale(pixelRatio, pixelRatio); // 縮放 canvas 上下文以適應高 DPI
    ctx.imageSmoothingQuality = 'high'; // 設置圖像平滑質量

    // 計算在原始圖片上的裁剪座標和尺寸
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;
    
    // 在 canvas 上繪製裁剪後的圖片
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    
    // 將 canvas 內容轉換為 base64 數據 URL
    return new Promise<string>((resolve, reject) => {
        // 使用 JPEG 格式並設定 85% 的質量以平衡文件大小和質量
        const base64Image = canvas.toDataURL('image/jpeg', 0.85); 
        if (!base64Image || base64Image === 'data:,') {
            reject(new Error('畫布為空'));
        } else {
            resolve(base64Image);
        }
    });
  }

  // 處理保存按鈕點擊事件
  const handleSaveClick = async () => {
    try {
      const croppedImageUrl = await getCroppedImage();
      onSave(croppedImageUrl);
    } catch (e) {
      console.error('裁剪圖片時出錯:', e);
    }
  };

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-theme-secondary rounded-lg shadow-2xl p-6 w-full max-w-lg mx-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <h3 className="text-xl font-semibold text-theme-primary mb-4">{t('accountPage.avatarTitle')}</h3>
            <div className="flex justify-center mb-4 bg-black/20">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop // 啟用圓形裁剪遮罩
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={src}
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
            
            {/* 用於繪製裁剪後圖片的隱藏 canvas */}
            <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSaveClick}
                className={`${ACCENT_BG_COLOR} text-zinc-900 font-semibold py-2 px-5 rounded-md ${ACCENT_BG_HOVER_COLOR} transition-all`}
              >
                {t('blogPage.saveChangesButton', 'Save Changes')}
              </button>
              <button
                onClick={onCancel}
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
};

export default ImageCropper;
