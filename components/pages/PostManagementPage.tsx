// 引入 React 相關鉤子
import React, { useState, useMemo, ChangeEvent, useEffect, useCallback, FormEvent } from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入 Framer Motion 動畫庫
import { motion, AnimatePresence } from 'framer-motion';
// 引入 React Router 的 URL 查詢參數鉤子
import { useSearchParams } from 'react-router-dom';
// 引入類型定義
import { BlogPostData, Page } from '../../types';
// 引入 UI 組件
import SectionTitle from '../ui/SectionTitle';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import ViewColumnsIcon from '../icons/ViewColumnsIcon';
import Squares2X2Icon from '../icons/Squares2X2Icon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import PencilIcon from '../icons/PencilIcon';
import { blogCategoryDefinitions } from '../data/blogData';
import PaginationControls from '../ui/PaginationControls';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import { staggerContainerVariants, sectionDelayShow, fadeInUpItemVariants } from '../../animationVariants';
import SparklesIcon from '../icons/SparklesIcon';
import CameraIcon from '../icons/CameraIcon';
import { GoogleGenAI } from '@google/genai';
import { ApiService } from '../../src/services/api';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import CloseIcon from '../icons/CloseIcon';
import { stripMarkdown } from '../../utils';
import axios, { AxiosProgressEvent } from 'axios';

// 定義排序順序的類型
type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'views-desc' | 'views-asc';
// 定義視圖模式的類型
type ViewMode = 'list' | 'grid';

// 過濾器下拉選單的分類選項
const postCategoryOptions = [
    { value: 'all', labelKey: 'portfolioPage.filterAll' },
    ...blogCategoryDefinitions.map(def => ({ value: def.titleKey, labelKey: def.titleKey }))
];

// 新增/編輯表單中的分類選項
const addPostCategoryOptions = [
    { value: 'blogPage.categoryPhotography', labelKey: 'blogPage.categoryPhotography' },
    { value: 'blogPage.categorySoloLearningDiary', labelKey: 'blogPage.categorySoloLearningDiary' },
    { value: 'blogPage.categoryToolSharing', labelKey: 'blogPage.categoryToolSharing' },
];

// 自訂 Markdown 內容的淨化規則，允許 iframe 和帶 style 的 span 標籤
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'iframe', 'span'],
  attributes: {
    ...defaultSchema.attributes,
    iframe: [ 'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'allowFullScreen', 'title', 'referrerpolicy' ],
    span: ['style'],
  },
};

// 組件屬性介面
interface PostManagementPageProps {
  posts: BlogPostData[]; // 所有文章數據
  onDelete: (postIds: string[]) => void; // 刪除文章的回調
  onAdd: (postData: BlogPostData) => void; // 新增文章的回調
  onUpdate: (postData: BlogPostData) => void; // 更新文章的回調
  navigateTo: (page: Page, data?: any) => void; // 導航函數
}

/**
 * 文章管理頁面組件 (PostManagementPage)。
 * 專為超級管理員設計，提供對部落格文章的完整 CRUD (創建、讀取、更新、刪除) 功能。
 * - 支持列表 (list) 和網格 (grid) 兩種視圖模式。
 * - 提供排序、分類過濾和分頁功能，狀態保存在 URL 查詢參數中。
 * - 內嵌一個用於新增或編輯文章的表單。
 * - 集成 Gemini AI 功能，可根據上傳的圖片自動生成標題和內容。
 * - 支持批量刪除和單個項目刪除。
 */
const PostManagementPage: React.FC<PostManagementPageProps> = ({ posts = [], onDelete, onAdd, onUpdate, navigateTo }) => {
  // --- 鉤子 (Hooks) ---
  const { t, i18n } = useTranslation(); // 翻譯鉤子
  const [searchParams, setSearchParams] = useSearchParams(); // URL 查詢參數鉤子

  // --- 從 URL 查詢參數讀取狀態 ---
  const sortOrder = (searchParams.get('sort') as SortOrder) || 'date-desc'; // 排序順序
  const filterCategory = searchParams.get('filter') || 'all'; // 分類過濾器
  const viewMode = (searchParams.get('view') as ViewMode) || 'list'; // 視圖模式
  const currentPage = parseInt(searchParams.get('page') || '1', 10); // 當前頁碼
  const itemsPerPage = parseInt(searchParams.get('perPage') || '10', 10); // 每頁項目數
  
  // --- UI 狀態 ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // 批量操作中選中的項目 ID
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 刪除確認模態框的開關
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); // 單個待刪除項目的 ID
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false); // 是否處於刪除模式
  const [editingPost, setEditingPost] = useState<BlogPostData | null>(null); // 當前正在編輯的文章數據

  // --- 表單狀態 ---
  const [isAdding, setIsAdding] = useState(false); // 是否顯示新增表單
  const [title, setTitle] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [content, setContent] = useState('');
  const [contentZh, setContentZh] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [activeContentLang, setActiveContentLang] = useState<'en' | 'zh'>('en'); // 內容編輯器的當前語言
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark'); // Markdown 編輯器的主題模式
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false); // AI 是否正在生成標題
  const [isGeneratingContent, setIsGeneratingContent] = useState(false); // AI 是否正在生成內容
  const [isUploading, setIsUploading] = useState(false); // 圖片是否正在上傳
  const [uploadProgress, setUploadProgress] = useState(0); // 圖片上傳進度
  const [isSubmitting, setIsSubmitting] = useState(false); // 表單是否正在提交
  
  // --- 輔助變量 ---
  // 計算是否應顯示新增/編輯表單
  const showForm = isAdding || !!editingPost;

  // --- 動畫變體 (Framer Motion) ---
  // 網格視圖卡片圖片的動畫
  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1, transition: { duration: 0.5, ease: "easeOut" as const } },
  };
  // 網格視圖卡片標題的動畫
  const titleVariants = {
    rest: { color: 'var(--text-primary)' },
    hover: { color: 'var(--accent-cyan)', transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  // --- 處理函數 ---

  // 更新 URL 參數以改變排序順序
  const handleSortChange = (newSortOrder: SortOrder) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSortOrder);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // 更新 URL 參數以改變分類過濾
  const handleFilterChange = (newCategory: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', newCategory);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // 更新 URL 參數以改變視圖模式
  const handleViewModeChange = (newViewMode: ViewMode) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', newViewMode);
    setSearchParams(newParams);
  };

  // 更新 URL 參數以改變頁碼
  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
    setSelectedIds([]); // 換頁時清空選中項
    window.scrollTo(0, 0); // 滾動到頁面頂部
  };

  // 更新 URL 參數以改變每頁顯示的項目數
  const handleItemsPerPageChange = (newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('perPage', String(newSize));
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  // 監聽應用主題變化，同步 Markdown 編輯器的主題
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      setColorMode(newMode);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const initialMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    setColorMode(initialMode);
    return () => observer.disconnect();
  }, []);
  
  // 當前頁碼改變時，清空選中項
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage]);

  // 使用 useMemo 對文章進行過濾和排序，以優化性能
  const processedPosts = useMemo(() => {
    let items = [...posts];

    // 根據分類過濾
    if (filterCategory !== 'all') {
        const activeCategoryDef = blogCategoryDefinitions.find(def => def.titleKey === filterCategory);
        if (activeCategoryDef) {
            items = items.filter(post => post.categoryKey && activeCategoryDef.categoryKeys.includes(post.categoryKey));
        }
    }

    // 根據排序順序排序
    items.sort((a, b) => {
        const titleA = (i18n.language === 'zh-Hant' && a.titleZh) ? a.titleZh : (a.title || '');
        const titleB = (i18n.language === 'zh-Hant' && b.titleZh) ? b.titleZh : (b.title || '');
        switch (sortOrder) {
            case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'title-desc': return titleB.localeCompare(titleA);
            case 'views-desc': return (b.views || 0) - (a.views || 0);
            case 'views-asc': return (a.views || 0) - (b.views || 0);
            case 'date-desc':
            default: return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
    });

    return items;
  }, [posts, filterCategory, sortOrder, i18n.language]);

  // 根據當前頁碼和每頁項目數，從已處理的列表中提取要顯示的項目
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedPosts.slice(startIndex, startIndex + itemsPerPage);
  }, [processedPosts, currentPage, itemsPerPage]);

  // 計算當前頁可刪除的項目數量（靜態項目不可刪除）
  const deletableItemsCount = useMemo(() => paginatedPosts.filter(post => !post.isStatic).length, [paginatedPosts]);

  // 判斷是否所有可刪除項目都已被選中
  const allDeletableSelected = useMemo(() => 
    deletableItemsCount > 0 && selectedIds.length === deletableItemsCount, 
  [deletableItemsCount, selectedIds.length]);

  // 全選/取消全選
  const handleSelectAllForDeletion = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allDeletableIds = paginatedPosts.filter(post => !post.isStatic).map(post => post.id);
      setSelectedIds(allDeletableIds);
    } else {
      setSelectedIds([]);
    }
  };

  // 切換單個項目的選中狀態
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 打開刪除確認模態框
  const openDeleteModal = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  // 確認刪除操作
  const handleConfirmDelete = () => {
    if (itemToDelete) { // 單個刪除
      onDelete([itemToDelete]);
      setItemToDelete(null);
    } else if (selectedIds.length > 0) { // 批量刪除
      onDelete(selectedIds);
      setSelectedIds([]);
    }
    setIsDeleteModalOpen(false);
    setIsDeleteModeActive(false);
  };
  
  // 切換刪除模式
  const handleToggleDeleteMode = () => {
    setIsAdding(false);
    setEditingPost(null);
    setIsDeleteModeActive(prev => !prev);
    setSelectedIds([]);
  };

  // 重置表單狀態
  const resetForm = useCallback(() => {
    setTitle('');
    setTitleZh('');
    setContent('');
    setContentZh('');
    setCategoryKey('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  // 取消新增/編輯
  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingPost(null);
    resetForm();
  };
  
  // 開始編輯一篇文章
  const handleStartEdit = (post: BlogPostData) => {
    setEditingPost(post);
    setIsAdding(false);
    setIsDeleteModeActive(false);
    setTitle(post.title || '');
    setTitleZh(post.titleZh || '');
    setContent(post.content || '');
    setContentZh(post.contentZh || '');
    setCategoryKey(post.categoryKey || '');
    setPreviewUrl(post.imageUrl);
    setSelectedFile(null);
    setImageUploadError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 滾動到頁面頂部以顯示表單
  };
  
  // 處理文件選擇和上傳到 Cloudinary
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
        setSelectedFile(file);
        setImageUploadError(null);
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
          const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          
          if (!uploadPreset || !cloudName) throw new Error(t('imageUpload.cloudinaryError'));
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', String(uploadPreset));
          
           const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData, {
            onUploadProgress: (event: AxiosProgressEvent) => {
              if (event.total) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
              }
            },
          });

          setPreviewUrl(response.data.secure_url);
          setUploadProgress(100);
          await new Promise(r => setTimeout(r, 300));
        } catch (error: any) {
          console.error('Image upload failed:', error);
          setImageUploadError(error.message || t('imageUpload.error'));
          setSelectedFile(null);
          setPreviewUrl(editingPost ? editingPost.imageUrl : null);
        } finally {
            setIsUploading(false);
        }
    } else if(file) {
        setImageUploadError(t('imageUpload.error'));
        setSelectedFile(null);
        setPreviewUrl(editingPost ? editingPost.imageUrl : null);
    }
  };

  // 使用 AI (Gemini) 生成標題
  const handleGenerateTitle = async () => {
    if (!previewUrl || isGeneratingTitle || isGeneratingContent) return;
    setIsGeneratingTitle(true);
    try {
      if (!process.env.API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await axios.get(previewUrl, { responseType: 'blob' });
      const blob = response.data;
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => { const result = reader.result as string; const base64Data = result.split(',')[1]; if (base64Data) { resolve(base64Data); } else { reject(new Error("Failed to convert image to base64")); } };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional blog writer.Analyze this image. Provide a concise, artistic, and evocative title. Respond with a single JSON object containing two keys: "titleEn" for the English title and "titleZh" for the Traditional Chinese title. Example: { "titleEn": "Urban Solitude", "titleZh": "城市孤影" }`;

      const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: "application/json" } });
      let jsonStr = aiResponse.text?.trim() || '';
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      if (!jsonStr) throw new Error("AI response is empty");
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.titleEn && parsedData.titleZh) { setTitle(parsedData.titleEn); setTitleZh(parsedData.titleZh); } else { throw new Error("AI response did not contain the expected JSON structure for titles."); }
    } catch (e) { console.error("Failed to generate AI title:", e); alert("AI 標題生成失敗，請再試一次或手動填寫。"); } finally { setIsGeneratingTitle(false); }
  };

  // 使用 AI (Gemini) 生成內容
  const handleGenerateContent = async () => {
    if (!previewUrl || isGeneratingContent || isGeneratingTitle) return;
    setIsGeneratingContent(true);
    try {
      if (!process.env.API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await axios.get(previewUrl, { responseType: 'blob' });
      const blob = response.data;
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => { const result = reader.result as string; const base64Data = result.split(',')[1]; if (base64Data) { resolve(base64Data); } else { reject(new Error("Failed to convert image to base64")); } };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional blog writer. Analyze this image. Write an engaging blog post (around 200-300 words) formatted in Markdown. The post should include a main heading (h2), at least one subheading (h3), and a bulleted list. Respond with a single JSON object containing two keys: "contentEn" for the English content in Markdown, and "contentZh" for the Traditional Chinese content in Markdown.`;
      const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: "application/json" } });
      
      let jsonStr = aiResponse.text?.trim() || '';
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      if (!jsonStr) throw new Error("AI response is empty");
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.contentEn && parsedData.contentZh) { setContent(parsedData.contentEn); setContentZh(parsedData.contentZh); } else { throw new Error("AI response did not contain the expected JSON structure for content."); }
    } catch (e) { console.error("Failed to generate AI content:", e); alert("AI 內容生成失敗，請再試一次或手動填寫。"); } finally { setIsGeneratingContent(false); }
  };

  // 提交表單（新增或更新）
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!previewUrl || !title.trim() || !titleZh.trim() || !content.trim() || !contentZh.trim() || !categoryKey) { alert(t('blogPage.fillAllRequiredFields')); return; }
    setIsSubmitting(true);
    try {
      if (editingPost) {
        // 更新邏輯
        const updatedPostData: BlogPostData = {
          ...editingPost,
          imageUrl: previewUrl,
          title,
          titleZh,
          content,
          contentZh,
          excerpt: stripMarkdown(content).substring(0, 150),
          excerptZh: stripMarkdown(contentZh).substring(0, 150),
          categoryKey,
        };
        await ApiService.updatePost(editingPost.id, updatedPostData);
        onUpdate(updatedPostData);
      } else {
        // 新增邏輯
        const postData = { imageUrl: previewUrl, title, titleZh, content, contentZh, excerpt: stripMarkdown(content).substring(0, 150), excerptZh: stripMarkdown(contentZh).substring(0, 150), categoryKey, isLocked: false, isFeatured: false };
        const newPost = await ApiService.createPost(postData);
        onAdd(newPost);
      }
      handleCancelForm();
    } catch (error) {
      console.error('Failed to save post:', error);
      alert(editingPost ? '更新文章失敗，請重試' : '創建文章失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 計算屬性 (useMemo) ---
  // 查找待刪除的文章對象，用於在確認模態框中顯示其標題
  const postToDelete = useMemo(() =>
    itemToDelete ? posts.find(p => p.id === itemToDelete) : null,
    [itemToDelete, posts]
  );

  // 動態生成刪除確認訊息
  const deletionMessage = useMemo(() => {
    if (postToDelete) {
      const displayTitle = (i18n.language === 'zh-Hant' && postToDelete.titleZh)
        ? postToDelete.titleZh
        : (postToDelete.title || t('blogPage.untitledPost'));
      
      const question = i18n.language === 'zh-Hant' ? '您確定要刪除這篇文章嗎？' : 'Are you sure you want to delete this post?';
      return (
        <>
          <p>{question}</p>
          <p className="mt-4 font-semibold text-theme-primary break-all text-center bg-theme-tertiary p-2 rounded-md">"{displayTitle}"</p>
        </>
      );
    }
    // 批量刪除時顯示數量
    return t('postManagementPage.confirmDeleteMessage', { count: selectedIds.length });
  }, [postToDelete, selectedIds.length, t, i18n.language]);


  // --- 渲染 (JSX) ---
  return (
    <div className="space-y-8">
      {/* 頁面標題 */}
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="postManagementPage.title" subtitleKey="postManagementPage.subtitle" />
      </motion.div>

      {/* 控制欄 */}
      <motion.div
        className="bg-theme-secondary p-6 rounded-lg shadow-xl"
        variants={staggerContainerVariants(0.1, 0.2)}
        initial="initial"
        animate="animate"
      >
        {/* 控制按鈕 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 min-h-[40px]">
          <div className="flex items-center space-x-2">
            <AnimatePresence mode="wait">
              {showForm ? (
                // 顯示表單時，顯示取消按鈕
                <motion.div key="cancel-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button onClick={handleCancelForm} className="button-theme-neutral font-semibold py-2 px-4 rounded-md flex items-center transition-all">
                    <CloseIcon className="w-5 h-5 mr-2" />
                    {t('portfolioPage.cancelButton')}
                  </button>
                </motion.div>
              ) : isDeleteModeActive ? (
                // 處於刪除模式時，顯示刪除和取消按鈕
                <motion.div key="delete-mode-controls" className="flex flex-col items-start gap-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                   <div className="flex items-center space-x-2">
                       <button onClick={() => { setItemToDelete(null); setIsDeleteModalOpen(true); }} disabled={selectedIds.length === 0} className="button-theme-danger font-semibold py-2 px-4 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                         <TrashIcon className="w-5 h-5 mr-2" />
                         {t('blogPage.confirmDeleteButton')} ({selectedIds.length})
                       </button>
                       <button onClick={handleToggleDeleteMode} className="button-theme-neutral font-semibold py-2 px-4 rounded-md flex items-center">
                         <CloseIcon className="w-5 h-5 mr-2" />
                         {t('portfolioPage.cancelButton')}
                       </button>
                   </div>
                   {/* 網格視圖下的全選框 */}
                   {viewMode === 'grid' && deletableItemsCount > 0 && (
                     <div className="flex items-center pl-1">
                       <input
                         type="checkbox"
                         id="select-all-posts"
                         className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan focus:ring-offset-theme-secondary cursor-pointer"
                         onChange={handleSelectAllForDeletion}
                         checked={allDeletableSelected}
                         disabled={deletableItemsCount === 0}
                       />
                       <label htmlFor="select-all-posts" className="ml-2 text-sm text-theme-primary cursor-pointer">
                         {t('postManagementPage.selectAll')}
                       </label>
                     </div>
                   )}
                 </motion.div>
              ) : (
                // 默認模式下，顯示新增和刪除按鈕
                <motion.div key="default-controls" className="flex items-center space-x-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button onClick={() => { setIsAdding(true); setEditingPost(null); resetForm(); }} className="button-theme-accent font-semibold py-2 px-4 rounded-md flex items-center transition-all">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('blogPage.addButton')}
                  </button>
                  <button onClick={handleToggleDeleteMode} className="button-theme-danger font-semibold py-2 px-4 rounded-md flex items-center transition-colors">
                    <TrashIcon className="w-5 h-5 mr-2" />
                    {t('blogPage.deleteButton')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* 過濾和視圖模式控制 */}
          <AnimatePresence>
            {!showForm && (
              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
              <div className="relative">
                  <select
                      value={filterCategory}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md py-2 pl-3 pr-8 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}
                  >
                      {postCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary">
                      <ChevronDownIcon className="w-4 h-4" />
                  </div>
              </div>
              <div className="relative">
                  <select
                      value={sortOrder}
                      onChange={(e) => handleSortChange(e.target.value as SortOrder)}
                      className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md py-2 pl-3 pr-8 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}
                  >
                      <option value="date-desc">{t('blogPage.sortDateDesc')}</option>
                      <option value="date-asc">{t('blogPage.sortDateAsc')}</option>
                      <option value="title-asc">{t('blogPage.sortTitleAsc')}</option>
                      <option value="title-desc">{t('blogPage.sortTitleDesc')}</option>
                      <option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option>
                      <option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary">
                      <ChevronDownIcon className="w-4 h-4" />
                  </div>
              </div>
               <div className="bg-theme-tertiary p-1 rounded-lg flex items-center">
                  <button onClick={() => handleViewModeChange('list')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'list' ? 'active' : ''}`} aria-label={t('postManagementPage.listViewAriaLabel')}><ViewColumnsIcon className="w-5 h-5"/></button>
                  <button onClick={() => handleViewModeChange('grid')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`} aria-label={t('postManagementPage.gridViewAriaLabel')}><Squares2X2Icon className="w-5 h-5"/></button>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 新增/編輯表單 */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="add-edit-post-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden my-6"
            >
              <div className="bg-theme-primary p-8 rounded-lg shadow-inner">
                <h3 className="text-2xl font-semibold text-theme-primary mb-6">{t(editingPost ? 'postManagementPage.editFormTitle' : 'blogPage.addFormTitle')}</h3>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* ... 表單內容（圖片上傳、分類、標題、內容、AI按鈕、提交按鈕）... */}
                    <div>
                        <label htmlFor="postImage" className="block text-sm font-medium text-theme-secondary mb-2">{t('blogPage.imageLabel')}</label>
                        <label htmlFor="postImage" className="cursor-pointer aspect-video w-full rounded-lg border-2 border-dashed border-theme-primary flex items-center justify-center bg-theme-secondary/50 transition-colors hover:border-custom-cyan">
                            {previewUrl ? ( <img src={previewUrl} alt={t('blogPage.imagePreviewAlt')} className="max-h-full max-w-full object-contain rounded-md" /> ) : ( <div className="text-center text-theme-secondary p-4"> <CameraIcon className="w-12 h-12 mx-auto mb-2" /> <p className="text-sm">{t('blogPage.imagePreviewPlaceholder')}</p> </div> )}
                        </label>
                        <input type="file" id="postImage" accept="image/*" onChange={handleFileChange} className="hidden" />
                        {isUploading ? (<div className="mt-2 text-sm text-center text-green-400 font-semibold">{t('imageUpload.uploading', { progress: uploadProgress })}</div>) : previewUrl && !imageUploadError && selectedFile ? (<div className="mt-2 text-sm text-center text-green-400 font-semibold">{t('imageUpload.success')}</div>) : null}
                        {imageUploadError && <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>}
                    </div>
                    <div>
                        <label htmlFor="postCategory" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.categoryLabel')}</label>
                        <div className="relative">
                            <select id="postCategory" value={categoryKey} onChange={e => setCategoryKey(e.target.value)} required className={`w-full bg-theme-secondary border border-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer ${!categoryKey ? 'text-theme-secondary' : 'text-theme-primary'}`}>
                                <option value="" disabled>{t('blogPage.categorySelectPlaceholder')}</option>
                                {addPostCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-primary"><ChevronDownIcon className="w-5 h-5" /></div>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div><label htmlFor="postTitleEn" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.titleEnLabel')}</label><input id="postTitleEn" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('blogPage.titleEnPlaceholder')} required className={`w-full bg-theme-secondary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} /></div>
                        <div><label htmlFor="postTitleZh" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.titleZhLabel')}</label><input id="postTitleZh" type="text" value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder={t('blogPage.titleZhPlaceholder')} required className={`w-full bg-theme-secondary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} /></div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2"><label className="block text-sm font-medium text-theme-secondary">{t('blogPage.contentLabel')}</label><div className="flex space-x-1 p-0.5 bg-theme-secondary rounded-lg"><button type="button" onClick={() => setActiveContentLang('en')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeContentLang === 'en' ? 'bg-theme-primary shadow' : 'text-theme-secondary hover:text-theme-primary'}`}>{t('blogPage.editorLangEn')}</button><button type="button" onClick={() => setActiveContentLang('zh')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeContentLang === 'zh' ? 'bg-theme-primary shadow' : 'text-theme-secondary hover:text-theme-primary'}`}>{t('blogPage.editorLangZh')}</button></div></div>
                        <div className="wmde-wrapper" data-color-mode={colorMode}><MDEditor height={300} value={activeContentLang === 'en' ? content : contentZh} onChange={(val) => { if (activeContentLang === 'en') { setContent(val || ''); } else { setContentZh(val || ''); } }} previewOptions={{ rehypePlugins: [[rehypeSanitize, sanitizeSchema]], className: 'prose prose-custom-styles max-w-none' }} /></div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <button type="button" onClick={handleGenerateTitle} disabled={!previewUrl || isGeneratingTitle || isGeneratingContent} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all disabled:opacity-50`}><SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingTitle ? 'animate-spin' : ''}`} />{isGeneratingTitle ? t('blogPage.generatingTitle') : t('blogPage.generateAITitle')}</button>
                            <button type="button" onClick={handleGenerateContent} disabled={!previewUrl || isGeneratingContent || isGeneratingTitle} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all disabled:opacity-50`}><SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingContent ? 'animate-spin' : ''}`} />{isGeneratingContent ? t('blogPage.generatingContent') : t('blogPage.generateAIContent')}</button>
                        </div>
                        <p className="text-xs text-theme-muted text-center mt-2">{t('blogPage.aiFeatureInfo')}</p>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4 border-t border-theme-primary">
                        <button type="submit" disabled={isSubmitting} className={`${ACCENT_BG_COLOR} ${ACCENT_BG_HOVER_COLOR} text-zinc-900 font-semibold py-2.5 px-6 rounded-md transition-all disabled:opacity-50`}>{t(editingPost ? 'blogPage.saveChangesButton' : 'blogPage.savePostButton')}</button>
                        <button type="button" onClick={handleCancelForm} className="button-theme-neutral font-semibold py-2.5 px-6 rounded-md transition-colors">{t('blogPage.cancelButton')}</button>
                    </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 內容顯示區域 */}
        <div className="overflow-x-auto">
          {paginatedPosts.length > 0 ? (
            viewMode === 'list' ? (
                // 列表視圖
                <table className="w-full text-sm text-left text-theme-secondary">
                  {/* ... 表頭 ... */}
                  <thead className="text-xs text-theme-primary uppercase bg-theme-tertiary">
                    <tr>
                      <th scope="col" className="p-4">
                        {isDeleteModeActive && deletableItemsCount > 0 && (
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-theme-secondary cursor-pointer"
                                    onChange={handleSelectAllForDeletion}
                                    checked={allDeletableSelected}
                                    aria-label={t('postManagementPage_selectAll')}
                                />
                            </div>
                        )}
                      </th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.date')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.titleHeader', i18n.language.startsWith('zh') ? '標題' : 'Title')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.image', '圖片')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.category')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.views')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.comments')}</th>
                      <th scope="col" className="px-6 py-3">{t('postManagementPage.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ... 渲染每一行 ... */}
                    {paginatedPosts.map((post) => {
                      const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || '');
                      const isSelected = selectedIds.includes(post.id);
                      return (
                        <tr key={post.id}
                            onClick={() => isDeleteModeActive && handleSelectOne(post.id)}
                            className={`post-management-row bg-theme-secondary border-b border-theme-primary transition-colors duration-300 ${isDeleteModeActive ? 'cursor-pointer' : ''} ${isSelected ? 'row-selected' : ''}`}
                        >
                          <td className="w-4 p-4">
                             {isDeleteModeActive && (
                                <input type="checkbox" className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan pointer-events-none" checked={isSelected} readOnly/>
                             )}
                          </td>
                          <td className="px-6 py-4">{new Date(post.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-medium text-theme-primary whitespace-nowrap">{displayTitle}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                if (!isDeleteModeActive) {
                                  e.stopPropagation();
                                  navigateTo(Page.BlogPostDetail, post);
                                }
                              }}
                              disabled={isDeleteModeActive}
                              className={`block w-16 h-10 rounded overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-secondary focus-visible:ring-custom-cyan ${isDeleteModeActive ? 'cursor-not-allowed' : 'group'}`}
                              aria-label={`${t('blogPage.readMore')}: ${displayTitle}`}
                            >
                              <img
                                src={post.imageUrl}
                                alt={displayTitle}
                                className={`w-full h-full object-cover transition-transform duration-300 ${!isDeleteModeActive ? 'group-hover:scale-110' : ''}`}
                              />
                            </button>
                          </td>
                          <td className="px-6 py-4">{post.categoryKey ? t(post.categoryKey) : 'N/A'}</td>
                          <td className="px-6 py-4">{post.views || 0}</td>
                          <td className="px-6 py-4">{post.commentsCount || 0}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <button onClick={(e) => { e.stopPropagation(); handleStartEdit(post); }} disabled={isDeleteModeActive} className={`text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed ${!isDeleteModeActive && 'hover:text-custom-cyan'}`}><PencilIcon className="w-4 h-4"/></button>
                              <button onClick={(e) => { e.stopPropagation(); openDeleteModal(post.id); }} disabled={isDeleteModeActive || !!post.isStatic} className={`text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed ${!isDeleteModeActive && 'hover:text-red-500'}`}><TrashIcon className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            ) : (
                // 網格視圖
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={staggerContainerVariants(0.05)}
                    initial="initial"
                    animate="animate"
                >
                    {/* ... 渲染每一個卡片 ... */}
                    {paginatedPosts.map((post) => {
                        const displayTitle = (i18n.language === 'zh-Hant' && post.titleZh) ? post.titleZh : (post.title || '');
                        const isSelected = selectedIds.includes(post.id);
                        const displayExcerpt = stripMarkdown((i18n.language === 'zh-Hant' ? (post.excerptZh || post.contentZh) : (post.excerpt || post.content)) || '').substring(0, 100) + (post.content && post.content.length > 100 ? '...' : '');
                        const formattedDate = new Date(post.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
                        const categoryText = post.categoryKey ? t(post.categoryKey) : 'N/A';
                        const isCardDisabled = isDeleteModeActive && !!post.isStatic;

                        return (
                            <motion.div
                                key={post.id}
                                className={`relative group bg-theme-secondary rounded-lg h-full transition-shadow duration-300 shadow-lg hover:shadow-2xl flex flex-col border-2 ${isSelected ? 'border-custom-cyan' : 'border-transparent'} ${isCardDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                variants={fadeInUpItemVariants}
                                initial="rest"
                                whileHover={isCardDisabled ? 'rest' : 'hover'}
                                animate="rest"
                                onClick={() => {
                                    if (isCardDisabled) return;
                                    if (isDeleteModeActive) {
                                        handleSelectOne(post.id);
                                    } else {
                                        navigateTo(Page.BlogPostDetail, post);
                                    }
                                }}
                            >
                                <div
                                  className={`relative rounded-t-lg overflow-hidden block w-full`}
                                >
                                    <motion.img
                                        src={post.imageUrl}
                                        alt={displayTitle}
                                        className="w-full h-48 object-cover"
                                        variants={imageVariants}
                                    />
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="flex items-center justify-between text-xs text-theme-secondary mb-2">
                                        <span className="font-semibold text-custom-cyan uppercase">{categoryText}</span>
                                        <span>{formattedDate}</span>
                                    </div>
                                    <motion.h3
                                        className="text-lg font-bold font-playfair mb-2 leading-tight text-theme-primary"
                                        variants={titleVariants}
                                    >
                                        {displayTitle}
                                    </motion.h3>
                                    <p className="text-theme-secondary text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
                                        {displayExcerpt}
                                    </p>
                                    <div className="flex-shrink-0 mt-auto pt-3 border-t border-theme-primary flex justify-between items-center text-xs text-theme-muted">
                                        <div className="flex items-center space-x-3">
                                            <span>{t('postManagementPage.views')}: {post.views || 0}</span>
                                            <span>{t('postManagementPage.comments')}: {post.commentsCount || 0}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button onClick={(e) => { e.stopPropagation(); handleStartEdit(post); }} disabled={isDeleteModeActive} className={`text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed ${!isDeleteModeActive && 'hover:text-custom-cyan'}`}><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); openDeleteModal(post.id); }} disabled={isDeleteModeActive || !!post.isStatic} className={`text-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed ${!isDeleteModeActive && 'hover:text-red-500'}`}><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </div>
                                <div className={`absolute inset-0 bg-cyan-overlay rounded-lg pointer-events-none transition-opacity duration-300 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                {isDeleteModeActive && (
                                    <div className="absolute top-3 right-3 z-20 bg-theme-secondary/50 p-1 rounded-md pointer-events-none backdrop-blur-sm">
                                        <input
                                            type="checkbox"
                                            readOnly
                                            checked={isSelected}
                                            className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan focus:ring-offset-0 pointer-events-none"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            )
          ) : (
            <div className="text-center py-16 text-theme-secondary">{t('postManagementPage.noPostsFound')}</div>
          )}
        </div>

        {/* 分頁控制器 */}
        <div className="mt-6">
          <PaginationControls currentPage={currentPage} totalItems={processedPosts.length} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} />
        </div>
      </motion.div>
      {/* 刪除確認模態框 */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title={t('blogPage.deleteButton')}
        message={deletionMessage}
      />
    </div>
  );
};

export default PostManagementPage;
