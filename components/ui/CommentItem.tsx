// 引入 React 相關鉤子
import React, { useState } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion, AnimatePresence } from 'framer-motion';
// 引入類型定義
import { CommentWithChildren, UserProfile } from '../../types';
// 引入常數和 UI 組件
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import TimeAgo from './TimeAgo';
import Avatar from './Avatar';
import ConfirmationModal from './ConfirmationModal';
// 引入圖標組件
import ReplyIcon from '../icons/ReplyIcon';
import TrashIcon from '../icons/TrashIcon';

// 組件屬性介面
interface CommentItemProps {
  comment: CommentWithChildren; // 留言數據，包含子留言
  postId: string; // 文章 ID
  isAuthenticated: boolean; // 用戶是否登入
  currentUserProfile: UserProfile; // 當前用戶資料
  onAddComment: (postId: string, text: string, parentId?: string | null) => void; // 新增留言的回調
  onDeleteComment: (commentId: string) => void; // 刪除留言的回調
  isSuperUser: boolean; // 是否為超級用戶
  depth?: number; // 留言的遞迴深度
}

/**
 * 回覆表單的內部組件。
 * @param {object} props - 組件屬性。
 * @param {UserProfile} props.currentUserProfile - 當前用戶資料。
 * @param {(text: string) => void} props.onSubmit - 提交回覆時的回調。
 * @param {() => void} props.onCancel - 取消回覆時的回調。
 */
const ReplyForm: React.FC<{
  currentUserProfile: UserProfile;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}> = ({ currentUserProfile, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  // 狀態：回覆內容
  const [replyText, setReplyText] = useState('');
  // 狀態：是否正在提交
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return; // 防止提交空內容
    setIsSubmitting(true);
    onSubmit(replyText);
    // 提交後，父組件會處理關閉表單等後續操作
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex items-start space-x-3">
      <Avatar src={currentUserProfile.avatarUrl} username={currentUserProfile.username} className="w-8 h-8 rounded-full object-cover" />
      <div className="flex-grow">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={t('comments.addCommentPlaceholder')}
          rows={3}
          className={`w-full bg-theme-tertiary border border-theme-primary text-theme-primary rounded-md p-2 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS} text-sm resize-y transition-colors duration-200 shadow-inner`}
          required
          autoFocus // 自動聚焦以便用戶直接輸入
        />
        <div className="flex items-center justify-end space-x-3 mt-2">
          <button type="button" onClick={onCancel} className="button-theme-neutral font-semibold text-xs py-1.5 px-3 rounded-md">
            {t('comments.cancelButton')}
          </button>
          <button type="submit" disabled={isSubmitting || !replyText.trim()} className="button-theme-accent text-zinc-900 font-semibold text-xs py-1.5 px-3 rounded-md disabled:opacity-60">
            {isSubmitting ? t('comments.postingButton') : t('comments.replyButton')}
          </button>
        </div>
      </div>
    </form>
  );
};

/**
 * 單個留言項目組件。
 * 遞迴地渲染留言及其子留言，並處理回覆、摺疊和刪除等交互。
 */
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  isAuthenticated,
  currentUserProfile,
  onAddComment,
  onDeleteComment,
  isSuperUser,
  depth = 0 // 預設深度為 0
}) => {
  const { t } = useTranslation();
  // 狀態：是否正在回覆此留言
  const [isReplying, setIsReplying] = useState(false);
  // 狀態：是否已摺疊子留言 (預設為展開)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // 狀態：是否顯示刪除確認模態框
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 切換留言線程的摺疊狀態
  const toggleCollapse = () => {
    if (comment.children.length > 0) {
      setIsCollapsed(prev => !prev);
    }
  };

  // 提交回覆
  const handleReplySubmit = (text: string) => {
    onAddComment(postId, text, comment.id); // 將回覆與父留言 ID 關聯
    setIsReplying(false); // 關閉回覆表單
  };

  // 處理刪除操作：打開確認模態框
  const handleDelete = () => { setIsDeleteModalOpen(true); };
  // 確認刪除：調用父組件的刪除回調
  const handleConfirmDelete = () => { onDeleteComment(comment.id); };

  return (
    <>
      <div className="flex space-x-3">
        {/* 左側：頭像和連接線 */}
        <div className="flex flex-col items-center flex-shrink-0 relative">
          <Avatar src={comment.avatarUrl} username={comment.username} className="w-8 h-8 rounded-full object-cover z-10" />
          {/* 如果有子留言，顯示垂直連接線，點擊可摺疊/展開 */}
          {comment.children.length > 0 && (
            <div
              className={`w-px bg-theme-primary/30 flex-grow mt-2 cursor-pointer transition-colors hover:bg-custom-cyan`}
              onClick={toggleCollapse}
              title={isCollapsed ? t('comments.expandReplies', { count: comment.children.length }) : t('comments.collapseReplies')}
            />
          )}
        </div>

        {/* 右側：留言內容和操作 */}
        <div className="flex-grow min-w-0">
          <div className="text-sm flex items-center space-x-2 flex-wrap">
            <span className="font-semibold text-theme-primary">{comment.username}</span>
            {/* 摺疊按鈕，顯示子留言數量 */}
            {comment.children.length > 0 && (
              <button
                onClick={toggleCollapse}
                className="text-xs text-theme-muted hover:text-custom-cyan font-mono px-1"
                title={isCollapsed ? t('comments.expandReplies', { count: comment.children.length }) : t('comments.collapseReplies')}
              >
                [{isCollapsed ? '+' : '-'}{comment.children.length}]
              </button>
            )}
            <span className="text-theme-muted text-xs">·</span>
            {/* 顯示相對時間 */}
            <TimeAgo date={comment.date} />
          </div>
          <p className="text-theme-primary text-base my-2 whitespace-pre-wrap break-words">{comment.text}</p>

          <div className="flex items-center space-x-4 text-xs">
            {/* 回覆按鈕 (需登入) */}
            {isAuthenticated && (
                <button onClick={() => setIsReplying(!isReplying)} className="flex items-center text-theme-secondary hover:text-custom-cyan font-semibold transition-colors">
                    <ReplyIcon className="w-4 h-4 mr-1"/>
                    {t('comments.replyButton')}
                </button>
            )}
            {/* 刪除按鈕 (需超級用戶權限) */}
            {isSuperUser && (
                <button onClick={handleDelete} className="flex items-center text-red-500 hover:text-red-400 font-semibold transition-colors">
                    <TrashIcon className="w-4 h-4 mr-1"/>
                    {t('comments.deleteButton')}
                </button>
            )}
          </div>

          {/* 回覆表單的進入/退出動畫容器 */}
          <AnimatePresence>
            {isReplying && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <ReplyForm currentUserProfile={currentUserProfile} onSubmit={handleReplySubmit} onCancel={() => setIsReplying(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 子留言的遞迴渲染區域 */}
      <AnimatePresence>
        {!isCollapsed && comment.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-6 pt-4 space-y-4 border-l border-theme-primary/30 ml-4"
            aria-expanded={!isCollapsed}
          >
            {comment.children.map(child => (
              <CommentItem
                key={child.id}
                comment={child}
                postId={postId}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                isAuthenticated={isAuthenticated}
                isSuperUser={isSuperUser}
                currentUserProfile={currentUserProfile}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 刪除確認模態框 */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('comments.deleteButton')}
        message={t('comments.confirmDelete')}
      />
    </>
  );
};

export default CommentItem;