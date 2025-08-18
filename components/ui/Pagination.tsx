// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入樣式常數
import { ACCENT_BG_COLOR } from '../../constants';
// 引入圖標組件
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

// 組件屬性介面
interface PaginationProps {
  currentPage: number; // 當前頁碼
  totalPages: number; // 總頁數
  onPageChange: (page: number) => void; // 頁碼改變時的回調
}

/**
 * 分頁組件。
 * 提供一個標準的分頁導航界面，包括上一頁、下一頁和頁碼按鈕。
 * 當頁數過多時，會自動顯示省略號，以保持界面簡潔。
 */
const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();

  // 獲取要顯示的頁碼數組
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // 最多顯示的頁碼按鈕數量
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      // 如果總頁數小於等於最大顯示數量，則顯示所有頁碼
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 處理複雜的分頁邏輯，當頁數過多時顯示省略號
      pageNumbers.push(1); // 總是顯示第一頁
      
      // 判斷是否需要在左側顯示省略號
      if (currentPage > halfPagesToShow + 2) {
        pageNumbers.push('...');
      }
      
      // 計算中間頁碼的起始和結束點
      let startPage = Math.max(2, currentPage - halfPagesToShow);
      let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);
      
      // 處理邊界情況，確保在靠近開頭或結尾時，始終顯示 `maxPagesToShow` 個按鈕
      if (currentPage <= halfPagesToShow + 1) {
        endPage = Math.min(totalPages - 1, maxPagesToShow - 1); 
      }
      if (currentPage >= totalPages - halfPagesToShow) {
        startPage = Math.max(2, totalPages - maxPagesToShow + 2); 
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // 判斷是否需要在右側顯示省略號
      if (currentPage < totalPages - halfPagesToShow - 1) {
        pageNumbers.push('...');
      }
      
      pageNumbers.push(totalPages); // 總是顯示最後一頁
    }
    return pageNumbers;
  };

  const pageNumbersToDisplay = getPageNumbers();

  // 如果總頁數小於等於1，則不渲染分頁組件
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label={t('pagination.ariaLabel')} className="flex items-center justify-center space-x-2 sm:space-x-3 mt-12">
      {/* 上一頁按鈕 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-md transition-colors duration-200
                    ${currentPage === 1 
                      ? 'bg-theme-tertiary text-theme-muted cursor-not-allowed' 
                      : `bg-theme-secondary text-theme-primary hover:bg-theme-hover hover:${ACCENT_BG_COLOR} hover:text-zinc-900`
                    }`}
        aria-label={t('pagination.previous')}
      >
        <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* 頁碼按鈕和省略號 */}
      {pageNumbersToDisplay.map((page, index) =>
        typeof page === 'number' ? (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page)}
            disabled={currentPage === page}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md transition-colors duration-200
                        ${currentPage === page
                          ? `${ACCENT_BG_COLOR} text-zinc-900 font-semibold cursor-default`
                          : `bg-theme-secondary text-theme-primary hover:bg-theme-hover hover:${ACCENT_BG_COLOR} hover:text-zinc-900`
                        }`}
            aria-current={currentPage === page ? 'page' : undefined}
            aria-label={t('pagination.goToPage', { pageNumber: page })}
          >
            {page}
          </button>
        ) : (
          <span key={`ellipsis-${index}`} className="px-1 sm:px-2 py-1.5 sm:py-2 text-theme-muted text-sm sm:text-base">
            {page}
          </span>
        )
      )}

      {/* 下一頁按鈕 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md transition-colors duration-200
                    ${currentPage === totalPages 
                      ? 'bg-theme-tertiary text-theme-muted cursor-not-allowed' 
                      : `bg-theme-secondary text-theme-primary hover:bg-theme-hover hover:${ACCENT_BG_COLOR} hover:text-zinc-900`
                    }`}
        aria-label={t('pagination.next')}
      >
        <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </nav>
  );
};

export default Pagination;
