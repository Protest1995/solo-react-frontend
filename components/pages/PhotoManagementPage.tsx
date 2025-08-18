import React, { useState, useMemo, ChangeEvent, useEffect, useCallback, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { PortfolioItemData, Page } from '../../types';
import SectionTitle from '../ui/SectionTitle';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import ViewColumnsIcon from '../icons/ViewColumnsIcon';
import Squares2X2Icon from '../icons/Squares2X2Icon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import PencilIcon from '../icons/PencilIcon';
import EyeIcon from '../icons/EyeIcon';
import PaginationControls from '../ui/PaginationControls';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import { staggerContainerVariants, sectionDelayShow, fadeInUpItemVariants } from '../../animationVariants';
import SparklesIcon from '../icons/SparklesIcon';
import CameraIcon from '../icons/CameraIcon';
import { GoogleGenAI } from '@google/genai';
import { ApiService } from '../../src/services/api';
import CloseIcon from '../icons/CloseIcon';
import Lightbox from '../ui/Lightbox';
import axios, { AxiosProgressEvent } from 'axios';

// 定義排序順序和視圖模式的類型
type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'views-desc' | 'views-asc';
type ViewMode = 'list' | 'grid';

// 過濾器分類選項
const portfolioCategoryOptions = [
    { value: 'all', labelKey: 'portfolioPage.filterAll' },
    { value: 'portfolioPage.filterStreet', labelKey: 'portfolioPage.filterStreet' },
    { value: 'portfolioPage.filterPortrait', labelKey: 'portfolioPage.filterPortrait' },
    { value: 'portfolioPage.filterSport', labelKey: 'portfolioPage.filterSport' },
];

// 新增/編輯表單中的分類選項
const addProjectCategoryOptions = [
    { value: 'portfolioPage.filterStreet', labelKey: 'portfolioPage.filterStreet' },
    { value: 'portfolioPage.filterPortrait', labelKey: 'portfolioPage.filterPortrait' },
    { value: 'portfolioPage.filterSport', labelKey: 'portfolioPage.filterSport' },
];

// 組件屬性介面
interface PhotoManagementPageProps {
  portfolioItems: PortfolioItemData[];
  onDelete: (itemIds: string[]) => void;
  onAdd: (item: PortfolioItemData) => void;
  onUpdate: (item: PortfolioItemData) => void;
  navigateTo: (page: Page, data?: any) => void;
}

// 網格視圖卡片的動畫變體
const imageVariants = { rest: { scale: 1 }, hover: { scale: 1.1, transition: { duration: 0.5, ease: "easeOut" as const } }, };
const titleVariants = { rest: { color: 'var(--text-primary)' }, hover: { color: 'var(--accent-cyan)', transition: { duration: 0.3, ease: "easeOut" as const } }, };

/**
 * 照片管理頁面組件 (PhotoManagementPage)。
 * 專為超級管理員設計，提供對作品集項目的完整 CRUD (創建、讀取、更新、刪除) 功能。
 * - 支持列表 (list) 和網格 (grid) 兩種視圖模式。
 * - 提供排序、分類過濾和分頁功能，狀態保存在 URL 查詢參數中。
 * - 內嵌一個用於新增或編輯照片的表單。
 * - 集成 Gemini AI 功能，可根據上傳的圖片自動生成標題。
 * - 支持批量刪除和單個項目刪除。
 */
const PhotoManagementPage: React.FC<PhotoManagementPageProps> = ({ portfolioItems = [], onDelete, onAdd, onUpdate, navigateTo }) => {
  // --- 鉤子 (Hooks) ---
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- 從 URL 查詢參數讀取狀態 ---
  const sortOrder = (searchParams.get('sort') as SortOrder) || 'date-desc';
  const filterCategory = searchParams.get('filter') || 'all';
  const viewMode = (searchParams.get('view') as ViewMode) || 'list';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = parseInt(searchParams.get('perPage') || '10', 10);
  
  // --- UI 狀態 ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // 存儲批量操作中選中的項目 ID
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 控制刪除確認模態框的開關
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); // 存儲單個待刪除項目的 ID
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false); // 是否處於刪除模式

  // --- 表單狀態 ---
  const [isAdding, setIsAdding] = useState(false); // 是否顯示新增表單
  const [editingPhoto, setEditingPhoto] = useState<PortfolioItemData | null>(null); // 當前正在編輯的照片數據
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoTitleZh, setNewPhotoTitleZh] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false); // AI 是否正在生成標題
  const [isUploading, setIsUploading] = useState(false); // 圖片是否正在上傳
  const [uploadProgress, setUploadProgress] = useState(0); // 圖片上傳進度

  // --- 燈箱狀態 ---
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null); // 當前在燈箱中選中的項目
  const [lightboxItemsSource, setLightboxItemsSource] = useState<PortfolioItemData[] | null>(null); // 傳遞給燈箱的項目列表
  
  // 計算是否顯示表單的布林值
  const showForm = isAdding || !!editingPhoto;

  // --- 回調與處理函數 ---

  // 開啟燈箱
  const openLightbox = useCallback((itemToOpen: PortfolioItemData, sourceItems: PortfolioItemData[]) => { 
    if (isDeleteModeActive) return; // 刪除模式下禁用燈箱
    setSelectedItem(itemToOpen); 
    setLightboxItemsSource(sourceItems); 
  }, [isDeleteModeActive]);
  // 關閉燈箱
  const closeLightbox = useCallback(() => { setSelectedItem(null); setLightboxItemsSource(null); }, []);

  // 處理 URL 查詢參數的變更
  const handleSortChange = (newSortOrder: SortOrder) => { const newParams = new URLSearchParams(searchParams); newParams.set('sort', newSortOrder); newParams.set('page', '1'); setSearchParams(newParams); };
  const handleFilterChange = (newCategory: string) => { const newParams = new URLSearchParams(searchParams); newParams.set('filter', newCategory); newParams.set('page', '1'); setSearchParams(newParams); };
  const handleViewModeChange = (newViewMode: ViewMode) => { const newParams = new URLSearchParams(searchParams); newParams.set('view', newViewMode); setSearchParams(newParams); };
  const handlePageChange = (newPage: number) => { const newParams = new URLSearchParams(searchParams); newParams.set('page', String(newPage)); setSearchParams(newParams); setSelectedIds([]); window.scrollTo(0, 0); };
  const handleItemsPerPageChange = (newSize: number) => { const newParams = new URLSearchParams(searchParams); newParams.set('perPage', String(newSize)); newParams.set('page', '1'); setSearchParams(newParams); };

  // --- 副作用 (useEffect) ---

  // 當前頁碼改變時，清空已選中的項目
  useEffect(() => { setSelectedIds([]); }, [currentPage]);
  
  // --- 計算屬性 (useMemo) ---

  // 處理後的項目列表（過濾 + 排序）
  const processedItems = useMemo(() => {
    let items = [...portfolioItems];
    if (filterCategory !== 'all') { items = items.filter(item => item.categoryKey === filterCategory); }
    items.sort((a, b) => {
        const titleA = (i18n.language === 'zh-Hant' && a.titleZh) ? a.titleZh : (a.title || '');
        const titleB = (i18n.language === 'zh-Hant' && b.titleZh) ? b.titleZh : (b.title || '');
        switch (sortOrder) {
            case 'date-asc': return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'title-desc': return titleB.localeCompare(titleA);
            case 'views-desc': return (b.views || 0) - (a.views || 0);
            case 'views-asc': return (a.views || 0) - (b.views || 0);
            case 'date-desc': default: return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        }
    });
    return items;
  }, [portfolioItems, filterCategory, sortOrder, i18n.language]);

  // 分頁後的項目列表
  const paginatedItems = useMemo(() => { const startIndex = (currentPage - 1) * itemsPerPage; return processedItems.slice(startIndex, startIndex + itemsPerPage); }, [processedItems, currentPage, itemsPerPage]);
  // 當前頁可刪除的項目數量
  const deletableItemsCount = useMemo(() => paginatedItems.filter(item => !item.isStatic).length, [paginatedItems]);
  // 是否所有可刪除項目都已被選中
  const allDeletableSelected = useMemo(() => deletableItemsCount > 0 && selectedIds.length === deletableItemsCount, [deletableItemsCount, selectedIds.length]);

  // --- 刪除相關的處理函數 ---
  const handleSelectAllForDeletion = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.checked) { const allDeletableIds = paginatedItems.filter(item => !item.isStatic).map(item => item.id); setSelectedIds(allDeletableIds); } else { setSelectedIds([]); } };
  const handleSelectOne = (id: string) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const openDeleteModal = (id: string) => { setItemToDelete(id); setIsDeleteModalOpen(true); };
  const handleConfirmDelete = () => { if (itemToDelete) { onDelete([itemToDelete]); setItemToDelete(null); } else if (selectedIds.length > 0) { onDelete(selectedIds); setSelectedIds([]); } setIsDeleteModalOpen(false); setIsDeleteModeActive(false); };
  const handleToggleDeleteMode = () => { setIsAdding(false); setEditingPhoto(null); setIsDeleteModeActive(prev => !prev); setSelectedIds([]); };

  // --- 表單相關的處理函數 ---
  const resetForm = useCallback(() => { setNewPhotoTitle(''); setNewPhotoTitleZh(''); setNewPhotoCategory(''); setSelectedFile(null); setPreviewUrl(null); setImageUploadError(null); setIsUploading(false); setUploadProgress(0); }, []);
  const handleCancelForm = () => { setIsAdding(false); setEditingPhoto(null); resetForm(); };
  
  // 開始編輯一個項目
  const handleStartEdit = (photo: PortfolioItemData) => {
    setEditingPhoto(photo);
    setIsAdding(false);
    setIsDeleteModeActive(false);
    setNewPhotoTitle(photo.title || '');
    setNewPhotoTitleZh(photo.titleZh || '');
    setNewPhotoCategory(photo.categoryKey || '');
    setPreviewUrl(photo.imageUrl);
    setSelectedFile(null);
    setImageUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 處理文件選擇和上傳
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
        formData.append('upload_preset', uploadPreset);
        
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
        setImageUploadError(error.message || t('portfolioPage.imageUploadError'));
        setSelectedFile(null);
        setPreviewUrl(editingPhoto ? editingPhoto.imageUrl : null);
      } finally {
        setIsUploading(false);
      }
    } else if (file) {
      setImageUploadError(t('portfolioPage.imageUploadError'));
      setSelectedFile(null);
      setPreviewUrl(editingPhoto ? editingPhoto.imageUrl : null);
    }
  };
  
  // 使用 AI 生成標題
  const handleGenerateTitle = async () => {
    if (!previewUrl || isGeneratingTitle) return;
    setIsGeneratingTitle(true);
    try {
      if (!process.env.API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => { reader.onloadend = () => { const result = reader.result as string; const base64Data = result.split(',')[1]; if (base64Data) resolve(base64Data); else reject(new Error("Failed to convert image to base64")); }; reader.onerror = () => reject(new Error("Failed to read image file")); reader.readAsDataURL(blob); });
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional photographer providing a title for a portfolio image. Analyze this image. Provide a concise, artistic, and evocative title. Respond with a single JSON object containing two keys: "titleEn" for the English title and "titleZh" for the Traditional Chinese title. Example: { "titleEn": "Urban Solitude", "titleZh": "城市孤影" }`;
      const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: "application/json" } });
      let jsonStr = aiResponse.text?.trim() || '';
      if (!jsonStr) throw new Error("AI response is empty");
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.titleEn && parsedData.titleZh) { setNewPhotoTitle(parsedData.titleEn); setNewPhotoTitleZh(parsedData.titleZh); } else { throw new Error("AI response did not contain the expected JSON structure for titles."); }
    } catch (e) { console.error("Failed to generate AI title:", e); alert("AI title generation failed. Please try again or write one manually."); } finally { setIsGeneratingTitle(false); }
  };
  
  // 提交新增表單
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPhotoTitle.trim() || !newPhotoTitleZh.trim() || !previewUrl || !newPhotoCategory) { alert(t('portfolioPage.fillAllRequiredFields')); return; }
    try { const newItemData = { imageUrl: previewUrl, title: newPhotoTitle, titleZh: newPhotoTitleZh, categoryKey: newPhotoCategory, isFeatured: false }; const newItem = await ApiService.createPortfolioItem(newItemData); onAdd(newItem); handleCancelForm(); } catch (error) { console.error('創建作品項目失敗:', error); alert('創建作品項目失敗，請重試'); }
  };
  
  // 提交更新表單
  const handleUpdateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPhoto || !newPhotoTitle.trim() || !newPhotoTitleZh.trim() || !previewUrl || !newPhotoCategory) { alert(t('portfolioPage.fillAllRequiredFields')); return; }
    try { const updatedItemData = { ...editingPhoto, imageUrl: previewUrl, title: newPhotoTitle, titleZh: newPhotoTitleZh, categoryKey: newPhotoCategory }; await ApiService.updatePortfolioItem(editingPhoto.id, updatedItemData); onUpdate(updatedItemData); handleCancelForm(); } catch (error) { console.error('更新作品項目失敗:', error); alert('更新作品項目失敗，請重試'); }
  };

  // --- 新增：刪除訊息相關 ---
  // 查找待刪除的相片對象
  const photoToDelete = useMemo(() =>
    itemToDelete ? portfolioItems.find(p => p.id === itemToDelete) : null,
    [itemToDelete, portfolioItems]
  );

  // 根據待刪除的相片和當前語言，動態生成刪除確認訊息
  const deletionMessage = useMemo(() => {
    if (photoToDelete) {
      const displayTitle = (i18n.language === 'zh-Hant' && photoToDelete.titleZh)
        ? photoToDelete.titleZh
        : (photoToDelete.title || t('portfolioPage.untitledPhoto', 'Untitled'));
      
      const question = t('photoManagementPage.confirmSingleDeleteMessage', '您確定要刪除這張相片嗎？');
      
      return (
        <>
          <p>{question}</p>
          <p className="mt-4 font-semibold text-theme-primary break-all text-center bg-theme-tertiary p-2 rounded-md">"{displayTitle}"</p>
        </>
      );
    }
    // 對於批量刪除，顯示數量
    return t('photoManagementPage.confirmDeleteMessage', { count: selectedIds.length });
  }, [photoToDelete, selectedIds.length, t, i18n.language]);
  // --- 新增結束 ---

  // 可重用的表單組件
  const FormComponent = ({ isEditMode }: { isEditMode: boolean }) => (
    <div className="bg-theme-primary p-8 rounded-lg shadow-inner">
      <form onSubmit={isEditMode ? handleUpdateSubmit : handleFormSubmit} className="space-y-6">
        <h3 className="text-xl font-bold text-theme-primary">{t(isEditMode ? 'photoManagementPage.editFormTitle' : 'portfolioPage.addFormTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center justify-center">
                <label htmlFor="photoUpload" className="cursor-pointer aspect-square w-full rounded-lg border-2 border-dashed border-theme-primary flex items-center justify-center bg-theme-secondary/50 transition-colors hover:border-custom-cyan">
                    {previewUrl ? ( <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" /> ) : ( <div className="text-center text-theme-secondary p-4"> <CameraIcon className="w-12 h-12 mx-auto mb-2" /> <p className="text-sm">{t('blogPage.imagePreviewPlaceholder')}</p> </div> )}
                </label>
                <input type="file" id="photoUpload" accept="image/*" onChange={handleFileChange} className="hidden" />
                {isUploading ? (<div className="mt-2 text-sm text-center text-green-400 font-semibold">{t('imageUpload.uploading', { progress: uploadProgress })}</div>) : previewUrl && !imageUploadError && selectedFile ? (<div className="mt-2 text-sm text-center text-green-400 font-semibold">{t('imageUpload.success')}</div>) : null}
                {imageUploadError && <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>}
            </div>
            <div className="space-y-6">
                <div> <label htmlFor="photoTitleEn" className="block text-sm font-medium text-theme-secondary mb-1">{t('portfolioPage.titleEnLabel')}</label> <input type="text" id="photoTitleEn" value={newPhotoTitle} onChange={e => setNewPhotoTitle(e.target.value)} required className={`w-full bg-theme-secondary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('portfolioPage.titleEnPlaceholder')} /> </div>
                <div> <label htmlFor="photoTitleZh" className="block text-sm font-medium text-theme-secondary mb-1">{t('portfolioPage.titleZhLabel')}</label> <input type="text" id="photoTitleZh" value={newPhotoTitleZh} onChange={e => setNewPhotoTitleZh(e.target.value)} required className={`w-full bg-theme-secondary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('portfolioPage.titleZhPlaceholder')} /> </div>
                <div> <label htmlFor="photoCategory" className="block text-sm font-medium text-theme-secondary mb-1">{t('portfolioPage.categoryLabel')}</label> <div className="relative"> <select id="photoCategory" value={newPhotoCategory} onChange={e => setNewPhotoCategory(e.target.value)} required className={`w-full bg-theme-secondary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none ${!newPhotoCategory ? 'text-theme-secondary' : 'text-theme-primary'}`}> <option value="" disabled>{t('blogPage.categorySelectPlaceholder')}</option> {addProjectCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)} </select> <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-primary"> <ChevronDownIcon className="w-5 h-5" /> </div> </div> </div>
                <div className="space-y-3 pt-4 border-t border-theme-primary"> <button type="button" onClick={handleGenerateTitle} disabled={!previewUrl || isGeneratingTitle} className="w-full flex items-center justify-center button-theme-neutral font-semibold py-2.5 px-5 rounded-md transition-all disabled:opacity-50"> <SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingTitle ? 'animate-spin' : ''}`} /> {isGeneratingTitle ? t('portfolioPage.generatingTitle') : t('portfolioPage.generateAITitle')} </button> </div>
            </div>
        </div>
        <div className="flex justify-end space-x-4 pt-4 border-t border-theme-primary"> <button type="submit" className={`button-theme-accent font-semibold py-2.5 px-6 rounded-md transition-all`}>{t(isEditMode ? 'photoManagementPage.saveChangesButton' : 'portfolioPage.saveProjectButton')}</button> <button type="button" onClick={handleCancelForm} className="button-theme-neutral font-semibold py-2.5 px-6 rounded-md transition-colors">{t('portfolioPage.cancelButton')}</button> </div>
      </form>
    </div>
  );
  
  // --- 渲染 (JSX) ---
  return (
    <div className="space-y-8">
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="photoManagementPage.title" subtitleKey="photoManagementPage.subtitle" />
      </motion.div>

      {/* 控制欄 */}
      <motion.div className="bg-theme-secondary p-6 rounded-lg shadow-xl" variants={staggerContainerVariants(0.1, 0.2)} initial="initial" animate="animate">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 min-h-[40px]">
          <div className="flex items-center space-x-2">
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.div key="cancel-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}> <button onClick={handleCancelForm} className="button-theme-neutral font-semibold py-2 px-4 rounded-md flex items-center transition-all"> <CloseIcon className="w-5 h-5 mr-2" /> {t('portfolioPage.cancelButton')} </button> </motion.div>
              ) : isDeleteModeActive ? (
                <motion.div key="delete-mode-controls" className="flex flex-col items-start gap-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                   <div className="flex items-center space-x-2">
                       <button onClick={() => { setItemToDelete(null); setIsDeleteModalOpen(true); }} disabled={selectedIds.length === 0} className="button-theme-danger font-semibold py-2 px-4 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"> <TrashIcon className="w-5 h-5 mr-2" /> {t('blogPage.confirmDeleteButton')} ({selectedIds.length}) </button>
                       <button onClick={handleToggleDeleteMode} className="button-theme-neutral font-semibold py-2 px-4 rounded-md flex items-center"> <CloseIcon className="w-5 h-5 mr-2" /> {t('portfolioPage.cancelButton')} </button>
                   </div>
                   {viewMode === 'grid' && deletableItemsCount > 0 && ( <div className="flex items-center pl-1"> <input type="checkbox" id="select-all-photos" className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan focus:ring-offset-theme-secondary cursor-pointer" onChange={handleSelectAllForDeletion} checked={allDeletableSelected} disabled={deletableItemsCount === 0} aria-label={t('photoManagementPage.selectAllAriaLabel')} /> <label htmlFor="select-all-photos" className="ml-2 text-sm text-theme-primary cursor-pointer"> {t('photoManagementPage.selectAll')} </label> </div> )}
                 </motion.div>
              ) : (
                <motion.div key="default-controls" className="flex items-center space-x-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button onClick={() => { setIsAdding(true); setEditingPhoto(null); }} className="button-theme-accent font-semibold py-2 px-4 rounded-md flex items-center transition-all"> <PlusIcon className="w-5 h-5 mr-2" /> {t('portfolioPage.addButton')} </button>
                  <button onClick={handleToggleDeleteMode} className="button-theme-danger font-semibold py-2 px-4 rounded-md flex items-center transition-colors"> <TrashIcon className="w-5 h-5 mr-2" /> {t('portfolioPage.deleteButton')} </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {!showForm && (
              <motion.div className="flex items-center space-x-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  <div className="relative"> <select value={filterCategory} onChange={(e) => handleFilterChange(e.target.value)} className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md py-2 pl-3 pr-8 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}> {portfolioCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)} </select> <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary"> <ChevronDownIcon className="w-4 h-4" /> </div> </div>
                  <div className="relative"> <select value={sortOrder} onChange={(e) => handleSortChange(e.target.value as SortOrder)} className={`bg-theme-tertiary border-transparent text-theme-primary rounded-md py-2 pl-3 pr-8 text-sm focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none cursor-pointer`}> <option value="date-desc">{t('blogPage.sortDateDesc')}</option> <option value="date-asc">{t('blogPage.sortDateAsc')}</option> <option value="title-asc">{t('blogPage.sortTitleAsc')}</option> <option value="title-desc">{t('blogPage.sortTitleDesc')}</option> <option value="views-desc">{t('postManagementPage.sortByViewsDesc')}</option> <option value="views-asc">{t('postManagementPage.sortByViewsAsc')}</option> </select> <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-primary"> <ChevronDownIcon className="w-4 h-4" /> </div> </div>
                  <div className="bg-theme-tertiary p-1 rounded-lg flex items-center"> <button onClick={() => handleViewModeChange('list')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'list' ? 'active' : ''}`} aria-label={t('photoManagementPage.listViewAriaLabel')}><ViewColumnsIcon className="w-5 h-5"/></button> <button onClick={() => handleViewModeChange('grid')} className={`p-2 rounded-md view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`} aria-label={t('photoManagementPage.gridViewAriaLabel')}><Squares2X2Icon className="w-5 h-5"/></button> </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 新增/編輯表單 */}
        <AnimatePresence>
            {isAdding && (<motion.div key="add-photo-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6"><FormComponent isEditMode={false} /></motion.div>)}
            {editingPhoto && (<motion.div key="edit-photo-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6"><FormComponent isEditMode={true} /></motion.div>)}
        </AnimatePresence>

        {/* 內容列表/網格 */}
        <div className="overflow-x-auto">
            {paginatedItems.length > 0 ? (
                viewMode === 'list' ? (
                    <table className="w-full text-sm text-left text-theme-secondary">
                        <thead className="text-xs text-theme-primary uppercase bg-theme-tertiary">
                        <tr>
                            <th scope="col" className="p-4"> {isDeleteModeActive && deletableItemsCount > 0 && ( <div className="flex items-center"> <input type="checkbox" className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan focus:ring-offset-theme-secondary cursor-pointer" onChange={handleSelectAllForDeletion} checked={allDeletableSelected} aria-label={t('photoManagementPage.selectAllAriaLabel')} /> </div> )} </th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('photoManagementPage.titleHeader', i18n.language.startsWith('zh') ? '標題' : 'Title')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.image', '圖片')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.category')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.views')}</th>
                            <th scope="col" className="px-6 py-3">{t('postManagementPage.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedItems.map((item) => { const displayTitle = (i18n.language === 'zh-Hant' && item.titleZh) ? item.titleZh : (item.title || ''); const isSelected = selectedIds.includes(item.id); const isRowDisabled = isDeleteModeActive && !!item.isStatic; return (
                            <tr key={item.id} className={`post-management-row bg-theme-secondary border-b border-theme-primary transition-colors duration-300 ${isRowDisabled ? 'opacity-50' : ''} ${isDeleteModeActive && !isRowDisabled ? 'cursor-pointer' : ''} ${isSelected ? 'row-selected' : ''}`} onClick={() => {if (isDeleteModeActive && !isRowDisabled) handleSelectOne(item.id)}}>
                                <td className="w-4 p-4"> {isDeleteModeActive && ( <input type="checkbox" className="form-checkbox h-4 w-4 rounded text-custom-cyan bg-theme-tertiary border-theme-secondary focus:ring-custom-cyan pointer-events-none" checked={isSelected} readOnly /> )} </td>
                                <td className="px-6 py-4">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-6 py-4 font-medium text-theme-primary whitespace-nowrap">{displayTitle}</td>
                                <td className="px-6 py-4"> <button type="button" onClick={(e) => { if (!isDeleteModeActive) { e.stopPropagation(); openLightbox(item, paginatedItems); } }} disabled={isDeleteModeActive} className={`block w-16 h-10 rounded overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-secondary focus-visible:ring-custom-cyan ${isDeleteModeActive ? 'cursor-default' : 'cursor-pointer'}`} aria-label={!isDeleteModeActive ? `${t('portfolioPage.viewProject', { title: displayTitle })}` : undefined}> <img src={item.imageUrl} alt={displayTitle} className={`w-full h-full object-cover transition-transform duration-300 ${!isDeleteModeActive ? 'group-hover:scale-110' : ''}`} /> </button> </td>
                                <td className="px-6 py-4">{item.categoryKey ? t(item.categoryKey) : 'N/A'}</td>
                                <td className="px-6 py-4">{item.views || 0}</td>
                                <td className="px-6 py-4"> <div className="flex items-center space-x-3"> <button className="text-theme-secondary hover:text-custom-cyan" onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}><PencilIcon className="w-4 h-4"/></button> <button onClick={(e) => { e.stopPropagation(); openDeleteModal(item.id); }} className="text-theme-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button> </div> </td>
                            </tr> ); })}
                        </tbody>
                    </table>
                ) : (
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" variants={staggerContainerVariants(0.05)} initial="initial" animate="animate">
                        {paginatedItems.map((item) => { const displayTitle = (i18n.language === 'zh-Hant' && item.titleZh) ? item.titleZh : (item.title || ''); const isSelected = selectedIds.includes(item.id); const formattedDate = item.date ? new Date(item.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'; const categoryText = item.categoryKey ? t(item.categoryKey) : 'N/A'; const isCardDisabled = isDeleteModeActive && !!item.isStatic; return (
                                <motion.div key={item.id} className={`relative group bg-theme-secondary rounded-lg h-full transition-shadow duration-300 shadow-lg hover:shadow-2xl flex flex-col border-2 ${isSelected ? 'border-custom-cyan' : 'border-transparent'} ${isCardDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} variants={fadeInUpItemVariants} initial="rest" whileHover="hover" animate="rest" onClick={() => { if (isCardDisabled) return; if (isDeleteModeActive) { handleSelectOne(item.id); } else { openLightbox(item, paginatedItems); } }}>
                                    <div className="relative rounded-t-lg overflow-hidden"> <motion.img src={item.imageUrl} alt={displayTitle} className="w-full h-48 object-cover" variants={imageVariants} /> </div>
                                    <div className="p-5 flex flex-col flex-grow">
                                        <div className="flex items-center justify-between text-xs text-theme-secondary mb-2"> <span className="font-semibold text-custom-cyan uppercase">{categoryText}</span> <span>{formattedDate}</span> </div>
                                        <motion.h3 className="text-lg font-bold font-playfair mb-2 leading-tight text-theme-primary" variants={titleVariants}> {displayTitle} </motion.h3>
                                        <div className="flex-grow"></div>
                                        <div className="flex-shrink-0 mt-auto pt-3 border-t border-theme-primary flex justify-between items-center text-xs text-theme-muted">
                                            <div className="flex items-center space-x-3"> <span>{t('postManagementPage.views')}: {item.views || 0}</span> </div>
                                            <div className="flex items-center space-x-3"> <button className="text-theme-secondary hover:text-custom-cyan" onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}><PencilIcon className="w-4 h-4"/></button> <button onClick={(e) => { e.stopPropagation(); openDeleteModal(item.id); }} className="text-theme-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button> </div>
                                        </div>
                                    </div>
                                    <div className={`absolute inset-0 bg-cyan-overlay rounded-lg pointer-events-none transition-opacity duration-300 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                    {isDeleteModeActive && ( <div className="absolute top-3 right-3 z-20 bg-theme-secondary/50 p-1 rounded-md pointer-events-none backdrop-blur-sm"> <input type="checkbox" readOnly checked={isSelected} className="form-checkbox h-5 w-5 rounded text-custom-cyan bg-theme-tertiary border-theme-primary focus:ring-custom-cyan focus:ring-offset-0 pointer-events-none" /> </div> )}
                                </motion.div> ); })}
                    </motion.div>
                )
            ) : (
                <div className="text-center py-16 text-theme-secondary">{t('photoManagementPage.noItemsFound')}</div>
            )}
        </div>

        {/* 分頁控制器 */}
        <div className="mt-6">
          <PaginationControls currentPage={currentPage} totalItems={processedItems.length} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} />
        </div>
      </motion.div>
      {/* 刪除確認模態框 */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title={t('portfolioPage.deleteButton')} 
        message={deletionMessage}
      />
      {/* 燈箱 */}
      {selectedItem && lightboxItemsSource && ( <Lightbox currentItem={selectedItem} filteredItems={lightboxItemsSource} onClose={closeLightbox} onSelectItem={setSelectedItem} /> )}
    </div>
  );
};

export default PhotoManagementPage;