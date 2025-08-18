// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { BlogPostData, Page } from '../../types'; 
// 引入常數和圖標
import { ACCENT_COLOR, ACCENT_BORDER_COLOR } from '../../constants';
import HeartIcon from '../icons/HeartIcon';
import ChatAltIcon from '../icons/ChatAltIcon';
import LockClosedIcon from '../icons/LockClosedIcon';
// 引入工具函數，用於移除 Markdown 格式
import { stripMarkdown } from '../../utils';

// 定義視圖模式的類型
type ViewMode = '3-col' | '2-col' | '1-col';

// 組件屬性介面
interface BlogPostCardProps {
  post: BlogPostData; // 文章數據
  navigateTo: (page: Page, data?: BlogPostData) => void; // 導航函數
  isDeleteModeActive?: boolean; // 是否處於刪除模式，預設為 false
  isSelectedForDeletion?: boolean; // 是否被選中以待刪除，預設為 false
  onToggleSelectionForDeletion?: (id: string) => void; // 切換選中狀態的回調
  isCardDisabled?: boolean; // 卡片是否被禁用（例如，在刪除模式下，靜態文章不可刪除）
  viewMode?: ViewMode; // 當前的視圖模式，預設為 '3-col'
}

/**
 * 部落格文章卡片組件。
 * 能夠根據不同的視圖模式（1、2或3欄）調整佈局，並處理刪除模式下的交互。
 */
const BlogPostCard: React.FC<BlogPostCardProps> = ({ 
    post, 
    navigateTo,
    isDeleteModeActive = false,
    isSelectedForDeletion = false,
    onToggleSelectionForDeletion = (_id: string) => {},
    isCardDisabled = false,
    viewMode = '3-col',
}) => {
  const { t, i18n } = useTranslation();

  let displayTitle: string;
  let displayExcerpt: string;

  // 根據文章類型（靜態或用戶添加）和語言選擇顯示的標題和摘要
  if (post.isStatic) {
    // 靜態文章的內容來自翻譯文件
    displayTitle = t(post.titleKey || 'blogPage.untitledPost');
    const rawContent = t(post.contentKey || 'blogPage.noContent');
    displayExcerpt = stripMarkdown(rawContent); // 清除 Markdown 格式以生成純文字摘要
  } else {
    // 用戶添加的文章有雙語字段
    displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || t('blogPage.untitledPost'));
    const rawContent = (i18n.language === 'zh-Hant' && post.contentZh) ? post.contentZh : (post.content || t('blogPage.noContent'));
    displayExcerpt = stripMarkdown(rawContent);
  }
  
  // 格式化日期
  const formattedDate = new Date(post.date).toLocaleDateString(i18n.language === 'zh-Hant' ? 'zh-TW' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // 處理卡片點擊事件
  const handleCardClick = () => {
    if (isCardDisabled) return; // 如果卡片被禁用，不執行任何操作
    if (isDeleteModeActive) {
        // 在刪除模式下，點擊用於選中/取消選中（僅限非靜態文章）
        if (!post.isStatic) {
            onToggleSelectionForDeletion(post.id);
        }
    } else {
        // 正常模式下，導航到文章詳情頁
        navigateTo(Page.BlogPostDetail, post);
    }
  };
  
  // 格式化留言數量文本，處理單複數
  const commentsText = post.commentsCount && post.commentsCount > 0 
    ? `${post.commentsCount} ${t('blogPage.commentsLabel', {count: post.commentsCount})}`
    : t('blogPage.noComments');
    
  // 根據狀態動態生成卡片的 CSS class
  const cardWrapperClasses = `
    service-card-wrapper animated-border-on-hover group rounded-lg transition-all duration-300 ease-in-out hover:-translate-y-1 h-full
    ${isCardDisabled ? 'opacity-50 cursor-not-allowed' : (isDeleteModeActive && post.isStatic ? 'cursor-not-allowed' : 'cursor-pointer')}
    ${isSelectedForDeletion ? `ring-2 ring-offset-2 ring-offset-theme-primary ${ACCENT_BORDER_COLOR}` : ''}
  `;
  
  // 判斷是否為列表視圖模式（單欄）
  const isListView = viewMode === '1-col';

  // 根據視圖模式動態生成佈局的 CSS class
  const wrapperDivClass = `service-card-inner rounded-md h-full bg-theme-secondary ${isListView ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`;
  const imageContainerClass = `relative ${isListView ? 'sm:w-2/5 flex-shrink-0' : ''}`;
  const imageClass = `w-full object-cover ${isListView ? 'h-56 sm:h-full' : 'h-56'}`;
  const contentContainerClass = `p-6 flex flex-col flex-grow ${isListView ? 'sm:w-3/5' : ''}`;


  return (
    <div 
        className={cardWrapperClasses}
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
        role="button"
        tabIndex={isCardDisabled ? -1 : 0}
        aria-label={displayTitle}
    >
      <div className={wrapperDivClass}>
        {/* 圖片容器 */}
        <div className={imageContainerClass}>
          <img src={post.imageUrl} alt={displayTitle} className={imageClass} />
          {/* 如果文章被鎖定，在非刪除模式下顯示鎖定圖標 */}
          {post.isLocked && !isDeleteModeActive && (
             <div className="absolute top-3 left-3 p-1.5 bg-theme-secondary/70 rounded-full backdrop-blur-sm" title={t('post.locked', 'Locked Post')}>
              <LockClosedIcon className="w-5 h-5 text-theme-primary" />
            </div>
          )}
        </div>
        {/* 內容容器 */}
        <div className={contentContainerClass}>
          {post.categoryKey && (
            <div className="mb-2">
              <span className="inline-block bg-theme-tertiary text-custom-cyan py-1 px-3 rounded-full text-xs font-bold uppercase tracking-wider">
                  {t(post.categoryKey)}
              </span>
            </div>
          )}
          <p className={`text-sm ${ACCENT_COLOR} mb-2 font-medium`}>{formattedDate}</p>
          <h4 className="text-xl font-bold text-theme-primary mb-3 group-hover:text-custom-cyan transition-colors">
              {displayTitle}
          </h4>
          <p className={`text-theme-secondary text-sm leading-relaxed mb-4 flex-grow ${isListView ? 'line-clamp-4' : 'line-clamp-3'}`}>
            {displayExcerpt}
          </p>
          {/* 文章元數據（點讚、留言） */}
          <div className="mt-auto pt-4 border-t border-theme-primary flex items-center text-sm text-theme-muted space-x-6">
             <div className="flex items-center group/meta transition-colors hover:text-custom-cyan">
                <HeartIcon className="w-5 h-5 mr-2 text-theme-muted group-hover/meta:text-custom-cyan transition-colors" />
                <span>{post.likes || 0} {t('blogPage.likesLabel')}</span>
             </div>
             <div className="flex items-center group/meta transition-colors hover:text-custom-cyan">
                <ChatAltIcon className="w-5 h-5 mr-2 text-theme-muted group-hover/meta:text-custom-cyan transition-colors" />
                <span>{commentsText}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;
