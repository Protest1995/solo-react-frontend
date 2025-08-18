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

// 定義部落格文章分類的選項
const blogCategoryOptions = [
    { value: 'blogPage.categoryPhotography', labelKey: 'blogPage.categoryPhotography' },
    { value: 'blogPage.categorySoloLearningDiary', labelKey: 'blogPage.categorySoloLearningDiary' },
    { value: 'blogPage.categoryToolSharing', labelKey: 'blogPage.categoryToolSharing' },
];

// 自訂的 rehype-sanitize schema，用於允許在 Markdown 內容中使用 iframe (例如嵌入 YouTube 影片)
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

// 定義 AddBlogPostPage 組件的屬性介面
interface AddBlogPostPageProps {
  navigateTo: (page: Page, data?: any) => void; // 導航函數
  onSave: (postData: BlogPostData) => void; // 保存文章後的回調函數
  isAuthenticated: boolean; // 用戶是否登入
  isSuperUser: boolean; // 用戶是否為超級管理員
  navigateToLogin: () => void; // 導航到登入頁的函數
}

/**
 * 新增部落格文章頁面組件 (AddBlogPostPage)。
 * 此組件提供一個表單，讓超級管理員可以創建新的部落格文章。
 * 功能包括：
 * - 雙語標題和內容輸入 (英文/繁中)。
 * - 上傳封面圖片至 Cloudinary 並顯示進度。
 * - 使用 Google Gemini AI 根據封面圖片生成標題和內容建議。
 * - 選擇文章分類。
 * - 提交後端 API 創建文章。
 */
const AddBlogPostPage: React.FC<AddBlogPostPageProps> = ({
  navigateTo,
  onSave,
  isAuthenticated,
  isSuperUser,
  navigateToLogin,
}) => {
  // 使用 useTranslation 鉤子來獲取翻譯函數 t
  const { t } = useTranslation();

  // --- 狀態管理 (useState) ---
  
  // 表單數據狀態
  const [title, setTitle] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [content, setContent] = useState('');
  const [contentZh, setContentZh] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // UI 相關狀態
  const [activeContentLang, setActiveContentLang] = useState<'en' | 'zh'>('en'); // 控制當前顯示的內容編輯器語言
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark'); // Markdown 編輯器的主題模式
  const [isUploading, setIsUploading] = useState(false); // 標記圖片是否正在上傳
  const [uploadProgress, setUploadProgress] = useState(0); // 圖片上傳進度

  // AI 功能與表單提交狀態
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- 副作用 (useEffect) ---

  // 監聽應用程式的主題變化，以同步更新 Markdown 編輯器的顏色模式
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      setColorMode(newMode);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // 組件掛載時立即設定一次初始模式
    const initialMode = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    setColorMode(initialMode);
    return () => observer.disconnect();
  }, []);

  // --- 回調函數 (useCallback & Handlers) ---

  // 處理取消操作，導航回部落格主頁
  const handleCancel = useCallback(() => {
    navigateTo(Page.Blog);
  }, [navigateTo]);
  
  // 處理文件選擇變更，並上傳至 Cloudinary
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
        await new Promise(r => setTimeout(r, 300)); // Let user see 100%
      } catch (error: any) {
        console.error('Image upload failed:', error);
        setImageUploadError(error.message || t('imageUpload.error'));
        setSelectedFile(null);
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    } else if (file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageUploadError(t('imageUpload.error'));
    }
  };

  // 使用 AI (Gemini) 根據圖片生成標題
  const handleGenerateTitle = async () => {
    if (!previewUrl || isGeneratingTitle || isGeneratingContent) return;

    setIsGeneratingTitle(true);
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) throw new Error("API Key not found.");
      const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
      
      // 從 Cloudinary URL 獲取圖片數據並轉為 base64
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          if (base64Data) resolve(base64Data);
          else reject(new Error("Failed to convert image to base64"));
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional blog writer. Analyze this image. Provide a concise, artistic, and evocative title. Respond with a single JSON object containing two keys: "titleEn" for the English title and "titleZh" for the Traditional Chinese title. Example: { "titleEn": "Urban Solitude", "titleZh": "城市孤影" }`;

      // 調用 Gemini API
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" },
      });

      let jsonStr = aiResponse.text?.trim() || '';
      // 處理 AI 可能返回的 Markdown code fence
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      if (!jsonStr) throw new Error("AI response is empty");

      // 解析 JSON 並更新狀態
      const parsedData = JSON.parse(jsonStr);
      if (parsedData.titleEn && parsedData.titleZh) {
        setTitle(parsedData.titleEn);
        setTitleZh(parsedData.titleZh);
      } else {
        throw new Error("AI response did not contain the expected JSON structure for titles.");
      }
    } catch (e) {
      console.error("Failed to generate AI title:", e);
      alert("AI 標題生成失敗，請再試一次或手動填寫。");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // 使用 AI (Gemini) 根據圖片生成內容
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
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          if (base64Data) resolve(base64Data);
          else reject(new Error("Failed to convert image to base64"));
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      const imagePart = { inlineData: { mimeType: selectedFile?.type || 'image/jpeg', data: base64Data } };
      const prompt = `You are a professional blog writer. Analyze this image. Write an engaging blog post (around 200-300 words) formatted in Markdown. The post should include a main heading (h2), at least one subheading (h3), and a bulleted list. Respond with a single JSON object containing two keys: "contentEn" for the English content in Markdown, and "contentZh" for the Traditional Chinese content in Markdown.`;
      
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" },
      });
      
      let jsonStr = aiResponse.text?.trim() || '';
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      if (!jsonStr) throw new Error("AI response is empty");

      const parsedData = JSON.parse(jsonStr);
      if (parsedData.contentEn && parsedData.contentZh) {
        setContent(parsedData.contentEn);
        setContentZh(parsedData.contentZh);
      } else {
        throw new Error("AI response did not contain the expected JSON structure for content.");
      }
    } catch (e) {
      console.error("Failed to generate AI content:", e);
      alert("AI 內容生成失敗，請再試一次或手動填寫。");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 處理表單提交
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSuperUser) { navigateToLogin(); return; }
    if (!previewUrl || !title.trim() || !titleZh.trim() || !content.trim() || !contentZh.trim() || !categoryKey) {
      alert(t('blogPage.fillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 構建要發送到後端的數據
      const postData = {
        imageUrl: previewUrl,
        title,
        titleZh,
        content,
        contentZh,
        excerpt: content.substring(0, 150),
        excerptZh: contentZh.substring(0, 150),
        categoryKey,
        isLocked: false,
        isFeatured: false
      };

      // 調用 API 服務創建文章
      const newPost = await ApiService.createPost(postData);
      
      // 調用父組件的回調函數以更新 App 狀態
      onSave(newPost);
      
      // 導航到新創建的文章詳情頁
      navigateTo(Page.BlogPostDetail, newPost);
    } catch (error) {
      console.error('創建文章失敗:', error);
      alert('創建文章失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 渲染 (JSX) ---
  return (
    <div className="space-y-12">
      <motion.div {...sectionDelayShow(0)} className="flex justify-between items-center">
        <SectionTitle titleKey="blogPage.addFormTitle" />
        <button onClick={handleCancel} className="button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all flex items-center">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          {t('blogPage.backToBlog')}
        </button>
      </motion.div>

      <motion.div
        className="bg-theme-primary p-8 rounded-lg shadow-inner max-w-4xl mx-auto"
        variants={staggerContainerVariants(0.05)}
        initial="initial"
        animate="animate"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* 圖片上傳 */}
          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="postImage" className="block text-sm font-medium text-theme-secondary mb-2">{t('blogPage.imageLabel')}</label>
            <label htmlFor="postImage" className="cursor-pointer aspect-video w-full rounded-lg border-2 border-dashed border-theme-primary flex items-center justify-center bg-theme-secondary/50 transition-colors hover:border-custom-cyan">
                {previewUrl ? ( <img src={previewUrl} alt={t('blogPage.imagePreviewAlt')} className="max-h-full max-w-full object-contain rounded-md" /> ) : ( <div className="text-center text-theme-secondary p-4"> <CameraIcon className="w-12 h-12 mx-auto mb-2" /> <p className="text-sm">{t('blogPage.imagePreviewPlaceholder')}</p> </div> )}
            </label>
            <input type="file" id="postImage" accept="image/*" onChange={handleFileChange} className="hidden" />
            {isUploading ? ( <div className="mt-2 text-sm text-center text-green-400 font-semibold"> {t('imageUpload.uploading', { progress: uploadProgress })} </div> ) : previewUrl && !imageUploadError ? ( <div className="mt-2 text-sm text-center text-green-400 font-semibold"> {t('imageUpload.success')} </div> ) : null}
            {imageUploadError && <p className="text-red-500 text-sm mt-2">{imageUploadError}</p>}
          </motion.div>

          {/* 分類選擇 */}
          <motion.div variants={fadeInUpItemVariants}>
            <label htmlFor="postCategory" className="block text-sm font-medium text-theme-secondary mb-1">{t('blogPage.categoryLabel')}</label>
            <div className="relative">
              <select id="postCategory" value={categoryKey} onChange={e => setCategoryKey(e.target.value)} required className={`w-full bg-theme-secondary border border-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none pr-8 cursor-pointer ${!categoryKey ? 'text-theme-secondary' : 'text-theme-primary'}`} >
                <option value="" disabled>{t('blogPage.categorySelectPlaceholder')}</option>
                {blogCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-primary"> <ChevronDownIcon className="w-5 h-5" /> </div>
            </div>
          </motion.div>

          {/* 標題輸入 */}
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

          {/* 內容編輯器 */}
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

          {/* AI 功能按鈕 */}
          <motion.div variants={fadeInUpItemVariants} className="space-y-3 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <button type="button" onClick={handleGenerateTitle} disabled={!previewUrl || isGeneratingTitle || isGeneratingContent} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all disabled:opacity-50`}> <SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingTitle ? 'animate-spin' : ''}`} /> {isGeneratingTitle ? t('blogPage.generatingTitle') : t('blogPage.generateAITitle')} </button>
              <button type="button" onClick={handleGenerateContent} disabled={!previewUrl || isGeneratingContent || isGeneratingTitle} className={`w-full flex items-center justify-center button-theme-neutral font-semibold py-2 px-5 rounded-md transition-all disabled:opacity-50`}> <SparklesIcon className={`w-5 h-5 mr-2 ${isGeneratingContent ? 'animate-spin' : ''}`} /> {isGeneratingContent ? t('blogPage.generatingContent') : t('blogPage.generateAIContent')} </button>
            </div>
            <p className="text-xs text-theme-muted text-center mt-2">{t('blogPage.aiFeatureInfo')}</p>
          </motion.div>

          {/* 表單操作按鈕 */}
          <motion.div variants={fadeInUpItemVariants} className="flex justify-end space-x-4 pt-4 border-t border-theme-primary">
            <button type="submit" disabled={isSubmitting} className={`${ACCENT_BG_COLOR} ${ACCENT_BG_HOVER_COLOR} text-zinc-900 font-semibold py-2.5 px-6 rounded-md transition-all disabled:opacity-50`}> {t('blogPage.savePostButton')} </button>
            <button type="button" onClick={handleCancel} className="button-theme-neutral font-semibold py-2.5 px-6 rounded-md transition-colors">{t('blogPage.cancelButton')}</button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddBlogPostPage;