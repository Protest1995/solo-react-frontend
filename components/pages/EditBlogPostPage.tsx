import React, { useState, useCallback, ChangeEvent, FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import { BlogPostData, Page } from '../../types';
import SectionTitle from '../ui/SectionTitle';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import CameraIcon from '../icons/CameraIcon';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { ApiService } from '../../src/services/api';
import axios, { AxiosProgressEvent } from 'axios';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// 部落格文章分類的選項
const blogCategoryOptions = [
    { value: 'blogPage.categoryPhotography', labelKey: 'blogPage.categoryPhotography' },
    { value: 'blogPage.categorySoloLearningDiary', labelKey: 'blogPage.categorySoloLearningDiary' },
    { value: 'blogPage.categoryToolSharing', labelKey: 'blogPage.categoryToolSharing' },
];

// 自訂的 rehype-sanitize schema，允許 iframe
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    iframe: [
      'src',
      'width',
      'height',
      'frameborder',
      'allow',
      'allowfullscreen',
      'allowFullScreen', 
      'title',
      'referrerpolicy',
    ],
  },
};

// 定義 EditBlogPostPage 組件的屬性介面
interface EditBlogPostPageProps {
  postToEdit: BlogPostData; // 從父組件傳入的、要編輯的文章數據
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  onSave: (postData: BlogPostData) => void; // 儲存文章後的回調函數
  isAuthenticated: boolean; // 用戶是否登入
  isSuperUser: boolean; // 用戶是否為超級管理員
  navigateToLogin: () => void; // 導航到登入頁的函數
}

/**
 * 編輯部落格文章頁面組件 (EditBlogPostPage)。
 * 此組件的功能與 `AddBlogPostPage` 非常相似，但主要用於修改現有的文章。
 * 它會從 `postToEdit` prop 預先填充表單欄位。
 */
const EditBlogPostPage: React.FC<EditBlogPostPageProps> = ({
  postToEdit,
  navigateTo,
  onSave,
  isAuthenticated,
  isSuperUser,
  navigateToLogin,
}) => {
  // --- 鉤子 (Hooks) ---
  const { t, i18n } = useTranslation();

  // --- 狀態管理 (useState) ---
  
  // 表單數據狀態，初始值來自 `postToEdit`
  const [title, setTitle] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [content, setContent] = useState('');
  const [contentZh, setContentZh] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // UI 相關狀態
  const [activeContentLang, setActiveContentLang] = useState<'en' | 'zh'>('en');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AI 功能與表單提交狀態
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 副作用 (useEffect) ---

  // 當 `postToEdit` prop 改變時（例如，用戶在不同文章的編輯頁面間導航），用其數據填充表單
  useEffect(() => {
    if (postToEdit) {
        setTitle(postToEdit.title || '');
        setTitleZh(postToEdit.titleZh || '');
        setContent(postToEdit.content || '');
        setContentZh(postToEdit.contentZh || '');
        setCategoryKey(postToEdit.categoryKey || '');
        setPreviewUrl(postToEdit.imageUrl);
    }
  }, [postToEdit]);

  // 監聽主題變化以更新編輯器顏色模式
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

  // --- 回調函數 (useCallback & Handlers) ---

  // 處理取消編輯，導航回文章詳情頁
  const handleCancel = useCallback(() => {
    navigateTo(Page.BlogPostDetail, postToEdit);
  }, [navigateTo, postToEdit]);

  // 處理文件選擇和上傳，邏輯與 `AddBlogPostPage` 相同
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setImageUploadError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
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
        setImageUploadError(error.message || t('imageUpload.error'));
        setSelectedFile(null);
        setPreviewUrl(postToEdit.imageUrl); // 上傳失敗時，恢復為原始圖片
      } finally {
        setIsUploading(false);
      }
    } else if (file) {
      setSelectedFile(null);
      setPreviewUrl(postToEdit.imageUrl);
      setImageUploadError(t('imageUpload.error'));
    }
  };

  // 使用 AI 生成標題
  const handleGenerateTitle = async () => {
    if (!previewUrl || isGeneratingTitle || isGeneratingContent) return;
    setIsGeneratingTitle(true);
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => { reader.onloadend = () => { const result = reader.result as string; const base64Data = result.split(',')[1]; if (base64Data) resolve(base64Data); else reject(new Error("Failed to convert image to base64")); }; reader.onerror = () => reject(new Error("Failed to read image file")); reader.readAsDataURL(blob); });
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional blog writer. Analyze this image. Provide a concise, artistic, and evocative title. Respond with a single JSON object containing two keys: "titleEn" for the English title and "titleZh" for the Traditional Chinese title. Example: { "titleEn": "Urban Solitude", "titleZh": "城市孤影" }`;
      const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: "application/json" } });
      let jsonStr = aiResponse.text?.trim() || '';
      if (!jsonStr) throw new Error("AI response is empty");
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.titleEn && parsedData.titleZh) { setTitle(parsedData.titleEn); setTitleZh(parsedData.titleZh); } else { throw new Error("AI response did not contain the expected JSON structure for titles."); }
    } catch (e) { console.error("Failed to generate AI title:", e); alert("AI 標題生成失敗，請再試一次或手動填寫。"); } finally { setIsGeneratingTitle(false); }
  };

  // 使用 AI 生成內容
  const handleGenerateContent = async () => {
    if (!previewUrl || isGeneratingContent || isGeneratingTitle) return;
    setIsGeneratingContent(true);
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => { const result = reader.result as string; const base64Data = result.split(',')[1]; if (base64Data) { resolve(base64Data); } else { reject(new Error("Failed to convert image to base64")); } };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional blog writer. Analyze this image. Write a very short, engaging blog post excerpt (around 50-70 words) formatted in Markdown. The post should include at least one bolded phrase or a heading. Respond with a single JSON object containing two keys: "contentEn" for the English content in Markdown, and "contentZh" for the Traditional Chinese content in Markdown.`;
      const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] }, config: { responseMimeType: "application/json" } });
      
      let jsonStr = aiResponse.text?.trim() || '';
      if (!jsonStr) throw new Error("AI response is empty");
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.contentEn && parsedData.contentZh) { setContent(parsedData.contentEn); setContentZh(parsedData.contentZh); } else { throw new Error("AI response did not contain the expected JSON structure for content."); }
    } catch (e) { console.error("Failed to generate AI content:", e); alert("AI 內容生成失敗，請再試一次或手動填寫。"); } finally { setIsGeneratingContent(false); }
  };

  // 處理表單提交（更新文章）
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSuperUser) { navigateToLogin(); return; }
    if (!previewUrl || !title.trim() || !titleZh.trim() || !content.trim() || !contentZh.trim() || !categoryKey) {
      alert(t('blogPage.fillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 構建更新後的文章數據
      const postData = {
        imageUrl: previewUrl,
        title,
        titleZh,
        content,
        contentZh,
        excerpt: content.substring(0, 150),
        excerptZh: contentZh.substring(0, 150),
        categoryKey,
        isLocked: postToEdit.isLocked,
        isFeatured: postToEdit.isFeatured
      };

      // 調用 API 服務更新文章
      const updatedPost = await ApiService.updatePost(postToEdit.id, postData);
      
      // 調用父組件的回調函數以更新 App 狀態
      onSave(updatedPost);
      
      // 導航回更新後的文章詳情頁
      navigateTo(Page.BlogPostDetail, updatedPost);
    } catch (error) {
      console.error('更新文章失敗:', error);
      alert('更新文章失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 渲染 (JSX) ---
  return (
    <div className="space-y-12">
      <motion.div {...sectionDelayShow(0)} className="flex justify-between items-center">
        <SectionTitle titleKey="blogPage.editFormTitle" />
        <button onClick={handleCancel} className="button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all flex items-center">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          {t('blogPage.backToBlog')}
        </button>
      </motion.div>

      <motion.div className="bg-theme-primary p-8 rounded-lg shadow-inner max-w-4xl mx-auto" variants={staggerContainerVariants(0.05)} initial="initial" animate="animate">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="postImage" className="block text-sm font-medium text-theme-secondary mb-2">{t('blogPage.imageLabel')}</label>
            <label htmlFor="postImage" className="cursor-pointer aspect-video w-full rounded-lg border-2 border-dashed border-theme-primary flex items-center justify-center bg-theme-secondary/50 transition-colors hover:border-custom-cyan">
                {previewUrl ? ( <img src={previewUrl} alt={t('blogPage.imagePreviewAlt')} className="max-h-full max-w-full object-contain rounded-md" /> ) : ( <div className="text-center text-theme-secondary p-4"> <CameraIcon className="w-12 h-12 mx-auto mb-2" /> <p className="text-sm">{t('blogPage.imagePreviewPlaceholder')}</p> </div> )}
            </label>
            <input type="file" id="postImage" accept="image/*" onChange={handleFileChange} className="hidden" />
            {isUploading ? ( <div className="mt-2 text-sm text-center text-green-400 font-semibold">{t('imageUpload.uploading', { progress: uploadProgress })}</div> ) : previewUrl && !imageUploadError && selectedFile ? ( <div className="mt-2 text-sm text-center text-green-400 font-semibold">{t('imageUpload.success')}</div> ) : null}
            {imageUploadError && <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>}
          </motion.div>

          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="postCategory" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.categoryLabel')}</label>
            <div className="relative">
                <select id="postCategory" value={categoryKey} onChange={e => setCategoryKey(e.target.value)} required className={`w-full bg-theme-secondary border border-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer`}>
                <option value="" disabled>{t('blogPage.categorySelectPlaceholder')}</option>
                {blogCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-primary"><ChevronDownIcon className="w-5 h-5" /></div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUpItemVariants} className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="postTitleEn" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.titleEnLabel')}</label>
              <input id="postTitleEn" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('blogPage.titleEnPlaceholder')} required className={`w-full bg-theme-secondary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} />
            </div>
            <div>
              <label htmlFor="postTitleZh" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.titleZhLabel')}</label>
              <input id="postTitleZh" type="text" value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder={t('blogPage.titleZhPlaceholder')} required className={`w-full bg-theme-secondary border border-theme-primary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} />
            </div>
          </motion.div>

          <motion.div variants={fadeInUpItemVariants}>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-theme-secondary">{t('blogPage.contentLabel')}</label>
                <div className="flex space-x-1 p-0.5 bg-theme-secondary rounded-lg">
                    <button type="button" onClick={() => setActiveContentLang('en')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeContentLang === 'en' ? 'bg-theme-primary shadow' : 'text-theme-secondary hover:text-theme-primary'}`}>{t('blogPage.editorLangEn')}</button>
                    <button type="button" onClick={() => setActiveContentLang('zh')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeContentLang === 'zh' ? 'bg-theme-primary shadow' : 'text-theme-secondary hover:text-theme-primary'}`}>{t('blogPage.editorLangZh')}</button>
                </div>
            </div>
            <div className="wmde-wrapper" data-color-mode={colorMode}>
                <MDEditor height={300} value={activeContentLang === 'en' ? content : contentZh} onChange={(val) => { if (activeContentLang === 'en') { setContent(val || ''); } else { setContentZh(val || ''); } }} previewOptions={{ rehypePlugins: [[rehypeSanitize, sanitizeSchema]], className: 'prose prose-custom-styles max-w-none' }} />
            </div>
          </motion.div>

          <motion.div variants={fadeInUpItemVariants} className="space-y-3 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <button type="button" onClick={handleGenerateTitle} disabled={!previewUrl || isGeneratingTitle || isGeneratingContent} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2.5 px-5 rounded-md transition-all disabled:opacity-50`}><SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingTitle ? 'animate-spin' : ''}`} />{isGeneratingTitle ? t('blogPage.generatingTitle') : t('blogPage.generateAITitle')}</button>
              <button type="button" onClick={handleGenerateContent} disabled={!previewUrl || isGeneratingContent || isGeneratingTitle} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2.5 px-5 rounded-md transition-all disabled:opacity-50`}><SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingContent ? 'animate-spin' : ''}`} />{isGeneratingContent ? t('blogPage.generatingContent') : t('blogPage.generateAIContent')}</button>
            </div>
            <p className="text-xs text-theme-muted text-center mt-2">{t('blogPage.aiFeatureInfo')}</p>
          </motion.div>

          <motion.div variants={fadeInUpItemVariants} className="flex justify-end space-x-4 pt-4 border-t border-theme-primary">
            <button type="submit" disabled={isSubmitting} className={`${ACCENT_BG_COLOR} ${ACCENT_BG_HOVER_COLOR} text-zinc-900 font-semibold py-2.5 px-6 rounded-md transition-all disabled:opacity-50`}>{t('blogPage.saveChangesButton')}</button>
            <button type="button" onClick={handleCancel} className="button-theme-neutral font-semibold py-2.5 px-6 rounded-md transition-colors">{t('blogPage.cancelButton')}</button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditBlogPostPage;