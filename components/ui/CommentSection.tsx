// 引入 React 相關鉤子
import React, { useState, useMemo } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { Comment, UserProfile, CommentWithChildren } from '../../types';
// 引入 UI 組件
import CommentItem from './CommentItem';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import Avatar from './Avatar';
import LockClosedIcon from '../icons/LockClosedIcon'; // 引入鎖頭圖標

// 組件屬性介面
interface CommentSectionProps {
  postId: string; // 文章 ID
  comments: Comment[]; // 該文章的所有留言
  isAuthenticated: boolean; // 用戶是否登入
  currentUserProfile: UserProfile; // 當前用戶資料
  onAddComment: (postId: string, text: string, parentId?: string | null) => void; // 新增留言的回調
  onDeleteComment: (commentId: string) => void; // 刪除留言的回調
  isSuperUser: boolean; // 是否為超級用戶
  onLoginClick: () => void; // 點擊登入按鈕時的回調
}

/**
 * 將扁平的留言列表轉換為樹狀結構。
 * @param {Comment[]} comments - 扁平的留言數組。
 * @returns {CommentWithChildren[]} - 樹狀結構的留言數組。
 */
const buildCommentTree = (comments: Comment[]): CommentWithChildren[] => {
    // 創建一個 map，方便通過 ID 快速查找留言，並為每個留言添加空的 children 數組
    const commentsById: { [key: string]: CommentWithChildren } = {};
    comments.forEach(comment => {
        commentsById[comment.id] = { ...comment, children: [] };
    });

    const tree: CommentWithChildren[] = [];
    // 遍歷所有留言，將它們放入其父留言的 children 數組中
    Object.values(commentsById).forEach(comment => {
        if (comment.parentId && commentsById[comment.parentId]) {
            // 如果有 parentId 且父留言存在，則將其添加到父留言的 children 中
            commentsById[comment.parentId].children.push(comment);
        } else {
            // 如果沒有 parentId，則為頂層留言，直接放入樹的根部
            tree.push(comment);
        }
    });

    // 遞迴地對留言及其子留言按日期進行升序排序
    const sortRecursive = (nodes: CommentWithChildren[]) => {
        nodes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        nodes.forEach(node => sortRecursive(node.children));
    };
    sortRecursive(tree);

    return tree;
};

/**
 * 留言區塊組件。
 * 負責顯示留言列表、發表新留言的表單，並管理留言樹的構建。
 */
const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  isAuthenticated,
  currentUserProfile,
  onAddComment,
  onDeleteComment,
  isSuperUser,
  onLoginClick,
}) => {
  const { t } = useTranslation();
  // 狀態：新留言的文本內容
  const [newCommentText, setNewCommentText] = useState('');
  // 狀態：是否正在提交新留言
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 處理新留言的提交
  const handleSubmitComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCommentText.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    // 調用父組件的回調函數來新增頂層留言 (parentId 設置為 null)
    onAddComment(postId, newCommentText, null);
    setNewCommentText(''); // 清空輸入框
    setIsSubmitting(false);
  };

  // 使用 useMemo 來緩存留言樹，只有在 comments 數組改變時才重新計算，以優化性能
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  return (
    <div className="mt-12 pt-8 border-t border-theme-primary">
      <h3 className="text-2xl font-semibold text-theme-primary mb-6">
        {t('comments.title', { count: comments.length })}
      </h3>

      {/* 留言表單容器 */}
      <div className="relative mb-8 p-4 bg-theme-secondary rounded-lg shadow-lg">
          <form onSubmit={handleSubmitComment} className="flex items-start space-x-4">
              <Avatar 
                src={currentUserProfile.avatarUrl}
                username={currentUserProfile.username}
                className="w-10 h-10 flex-shrink-0"
              />
              <div className="flex-grow flex flex-col">
                  <textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder={t('comments.addCommentPlaceholder')}
                      rows={4}
                      className={`w-full bg-theme-tertiary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS} text-sm resize-y transition-colors duration-200 shadow-inner`}
                      aria-label={t('comments.addCommentPlaceholder')}
                      required
                  />
                  <div className="flex justify-end mt-3">
                      <button
                          type="submit"
                          disabled={isSubmitting || !newCommentText.trim()}
                          className={`button-theme-accent text-zinc-900 font-semibold py-2 px-5 rounded-md text-sm transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                          {isSubmitting ? t('comments.postingButton') : t('comments.postButton')}
                      </button>
                  </div>
              </div>
          </form>

          {/* 未登入時的遮罩層 */}
          {!isAuthenticated && (
            <div
              className="absolute inset-0 backdrop-blur-2xl rounded-lg flex items-center justify-center z-10 cursor-pointer"
              style={{ backgroundColor: 'rgba(var(--bg-secondary-rgb), 0.7)' }}
              onClick={onLoginClick}
              role="button"
              aria-label={t('comments.loginToComment')}
            >
              <div className="flex items-center space-x-2 font-semibold text-theme-primary">
                <LockClosedIcon className="w-5 h-5" />
                <span>{t('comments.loginToComment')}</span>
              </div>
            </div>
          )}
      </div>

      {/* 留言列表 */}
      <div className="space-y-6">
        {commentTree.length > 0 ? (
            // 遍歷頂層留言，並遞迴渲染 CommentItem 組件
            commentTree.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                postId={postId}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                isAuthenticated={isAuthenticated}
                isSuperUser={isSuperUser}
                currentUserProfile={currentUserProfile}
              />
            ))
        ) : (
          // 如果沒有留言，顯示提示信息
          <p className="text-theme-secondary text-center py-8 px-4 text-sm">{t('comments.noComments')}</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;