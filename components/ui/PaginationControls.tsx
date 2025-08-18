// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入圖標組件
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
// 引入樣式常數
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';

// 組件屬性介面
interface PaginationControlsProps {
  currentPage: number; // 當前頁碼
  totalItems: number; // 總項目數
  itemsPerPage: number; // 每頁顯示的項目數
  onPageChange: (newPage: number) => void; // 頁碼改變時的回調
  onItemsPerPageChange: (newSize: number) => void; // 每頁項目數改變時的回調
  allowedItemsPerPage?: number[]; // 允許的每頁項目數選項
}

/**
 * 分頁控制組件。
 * 通常用於表格或列表的頂部或底部，提供切換頁面和更改每頁顯示項目數量的功能。
 * 這是一個比 `Pagination` 組件更緊湊的版本，專為數據管理界面設計。
 */
const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  allowedItemsPerPage = [10, 20, 50, 100],
}) => {
  const { t } = useTranslation();

  // 計算總頁數
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  // 計算當前頁顯示的項目範圍
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-end space-x-4 md:space-x-6 text-sm text-theme-secondary">
      {/* 每頁行數選擇器 */}
      <div className="flex items-center space-x-2">
        <label htmlFor="rows-per-page" className="hidden sm:inline-block">
          {t('pagination.rowsPerPage')}
        </label>
        <div className="relative">
            <select
              id="rows-per-page"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md p-1 pl-2 pr-6 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}
            >
              {allowedItemsPerPage.map(size => (
                  <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-theme-primary">
                <ChevronDownIcon className="w-4 h-4" />
            </div>
        </div>
      </div>
      {/* 項目範圍顯示 */}
      <span className="font-medium text-theme-primary">
        {t('pagination.rangeDisplay', { start: startItem, end: endItem, total: totalItems })}
      </span>
      {/* 上一頁/下一頁按鈕 */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-theme-hover"
          aria-label={t('pagination.previous')}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalItems === 0}
          className="p-1.5 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-theme-hover"
          aria-label={t('pagination.next')}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
