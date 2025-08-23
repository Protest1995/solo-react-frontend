import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios, { AxiosProgressEvent } from 'axios';
import SectionTitle from '../ui/SectionTitle';
import { UserProfile } from '../../types';
import { ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import { sectionDelayShow } from '../../animationVariants';
import ImageCropper from '../ui/ImageCropper';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import { AuthService, UpdateUserRequest } from '../../src/services/authService';

// 帳戶頁面屬性介面
interface AccountPageProps {
  userProfile: UserProfile; // 當前用戶資料
  onUpdateProfile: (newProfileData: Partial<UserProfile>) => void; // 更新個人資料的回調函數
  onUpdateAvatar: (newAvatarUrl: string) => void; // 更新頭像的回調函數
  isAuthenticated: boolean; // 用戶是否已登入
}

/**
 * 帳戶管理頁面組件。
 * 允許用戶查看和編輯他們的個人資料，包括頭像、基本資訊和密碼。
 */
const AccountPage: React.FC<AccountPageProps> = ({ userProfile, onUpdateProfile, onUpdateAvatar, isAuthenticated }) => {
  const { t } = useTranslation();

  // 表單狀態
  const [initialProfile, setInitialProfile] = useState(userProfile); // 初始個人資料，用於比較是否有變更
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NOT_SPECIFIED' | undefined>(userProfile.gender);
  const [birthday, setBirthday] = useState(userProfile.birthday || '');
  const [isBirthdayInputFocused, setIsBirthdayInputFocused] = useState<boolean>(false);
  // 上傳頭像時顯示遮罩與進度
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [address, setAddress] = useState(userProfile.address || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  
  // 頭像相關狀態
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(userProfile.avatarUrl); // 頭像預覽 URL
  const [imageToCrop, setImageToCrop] = useState<string | null>(null); // 待裁剪的圖片數據 URL
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'failed'>('loading'); // 頭像圖片加載狀態
  
  // 密碼相關狀態
  const [newPassword, setNewPassword] = useState('');
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 提交狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 當 userProfile prop 改變時，重置所有表單狀態
  useEffect(() => {
    setInitialProfile(userProfile);
    setUsername(userProfile.username);
    setEmail(userProfile.email);
    setGender(userProfile.gender);
    // 確保從後端回來的 ISO 或 yyyy-MM-dd 會轉為 yyyy/MM/dd 顯示
    const s = userProfile.birthday as any;
    if (s) {
      const str = String(s);
      const mIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      setBirthday(mIso ? `${mIso[1]}/${mIso[2]}/${mIso[3]}` : str);
    } else {
      setBirthday('');
    }
    setAddress(userProfile.address || '');
    setPhone(userProfile.phone || '');
    setPreviewAvatarUrl(userProfile.avatarUrl);
    
    // 清除臨時狀態
    setImageToCrop(null);
    setNewPassword('');
    setConfirmPassword('');
    setUploadProgress(0); // 清除上傳進度
    // 不立刻清除提示文字，避免剛保存完成就被覆蓋造成閃一下
  }, [userProfile]);

  // 當預覽頭像 URL 改變時，將圖片狀態設為加載中
  useEffect(() => {
    setImageStatus('loading');
  }, [previewAvatarUrl]);

  // 判斷表單是否有任何變更
  const isDirty = useMemo(() => {
    const infoChanged =
      username !== initialProfile.username ||
      email !== initialProfile.email ||
      gender !== initialProfile.gender ||
      birthday !== (initialProfile.birthday || '') ||
      address !== (initialProfile.address || '') ||
      phone !== (initialProfile.phone || '');

    const avatarChanged = previewAvatarUrl !== initialProfile.avatarUrl;
    const passwordChanged = newPassword !== '';

    return infoChanged || avatarChanged || passwordChanged;
  }, [username, email, gender, birthday, address, phone, previewAvatarUrl, newPassword, initialProfile]);


  // 處理頭像文件選擇
  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploadingAvatar(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', file);
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!uploadPreset || !cloudName) {
        console.error('Cloudinary configuration is missing');
        setIsUploadingAvatar(false);
        return;
      }
      formData.append('upload_preset', String(uploadPreset));

      try {
        const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData, {
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });
        
        let url: string = response.data.secure_url as string;
        url = url.replace('/upload/', '/upload/q_auto,f_auto/');
        setPreviewAvatarUrl(url);
        setUploadProgress(100);
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error('Avatar upload failed', err);
      } finally {
        setIsUploadingAvatar(false);
        e.target.value = '';
      }
    }
  };
  
  // 處理圖片裁剪完成
  const handleCropSave = (croppedImageUrl: string) => {
    setPreviewAvatarUrl(croppedImageUrl);
    setImageToCrop(null);
    setSubmitStatus('idle');
  };
  
  // 取消圖片裁剪
  const handleCropCancel = () => {
    setImageToCrop(null);
  };
  
  // 處理性別選擇變更
  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'MALE' | 'FEMALE' | 'NOT_SPECIFIED' | '';
    setGender(value || undefined);
    console.log('Selected gender:', value); // 加入日誌以追蹤值的變化
  };

  // 無
  
  // 處理圖片加載成功/失敗
  const handleImageLoad = () => setImageStatus('loaded');
  const handleImageError = () => setImageStatus('failed');

  // 重置所有表單變更
  const handleReset = () => {
    setUsername(initialProfile.username);
    setEmail(initialProfile.email);
    setGender(initialProfile.gender);
    const s = initialProfile.birthday as any;
    if (s) {
      const str = String(s);
      const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      setBirthday(m ? `${m[1]}/${m[2]}/${m[3]}` : str);
    } else {
      setBirthday('');
    }
    setAddress(initialProfile.address || '');
    setPhone(initialProfile.phone || '');
    setPreviewAvatarUrl(initialProfile.avatarUrl);
    setImageToCrop(null);
    setNewPassword('');
    setConfirmPassword('');
    setUploadProgress(0);
    // 不強制清空提示
  };

  // 處理整個表單的提交
  const handleUpdateAll = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated || !isDirty) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    setSubmitStatus('idle');

    // 密碼驗證
    if (newPassword && newPassword !== confirmPassword) {
      setStatusMessage(t('accountPage.passwordsDoNotMatchError'));
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setStatusMessage(t('registerPage.passwordPlaceholder'));
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log('Current gender value:', gender); // 加入日誌
      const payload: UpdateUserRequest = {
        username,
        email,
        gender,
        birthday: birthday || undefined,
        address,
        phone,
        avatarUrl: previewAvatarUrl || initialProfile.avatarUrl,
      };
      console.log('Submitting payload:', payload); // 加入日誌
      
      // 如果有新密碼，添加到 payload 中
      if (newPassword && newPassword.trim()) {
        payload.password = newPassword;
      }
      
      const updated = await AuthService.updateMe(payload);

      // 對應本地顯示同步
      onUpdateProfile({
        username: updated.username,
        email: updated.email,
        gender: updated.gender,
        birthday: updated.birthday,
        address: updated.address,
        phone: updated.phone,
      });

      if (updated.avatarUrl) onUpdateAvatar(updated.avatarUrl);
      
      // 立即同步 AuthContext 與 localStorage，讓側邊欄立即反映
      AuthService.setCurrentUser(updated);

      if (newPassword) {
        // 密碼更新成功，清空欄位
        setNewPassword('');
        setConfirmPassword('');
      }

      setSubmitStatus('success');
      setStatusMessage(t('accountPage.accountUpdateSuccess'));
      // 成功訊息至少停留 1.5 秒
      await new Promise(r => setTimeout(r, 1500));
    } catch (err: any) {
      setSubmitStatus('error');
      setStatusMessage(err?.message || '更新失敗');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 4000);
    }
  };

  const birthdayInputType = isBirthdayInputFocused || birthday ? 'date' : 'text';

  return (
    // NOTE: Added a negative top margin (-mt-8) to reduce the space above the "My Account" title.
    // The best practice is to reduce the top padding in the parent layout component that renders this page.
    <div className="space-y-12 -mt-12">
      <AnimatePresence>
        {isUploadingAvatar && (
          <motion.div
            className="fixed inset-0 bg-glass flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
                className="w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2"
                style={{
                    boxShadow: '0 0 30px var(--accent-shadow-color)',
                    border: '2px solid var(--accent-cyan-darker)',
                    backgroundColor: 'rgba(var(--bg-secondary-rgb), 0.5)'
                }}
            >
                <img
                  src="/images/icon/icon.jpg"
                  alt=""
                  className="w-10 h-10 animate-spin"
                />
                <p className="mt-1 text-sm font-semibold text-theme-secondary tracking-wide text-center px-4">
                  {t('accountPage.avatarUploading')} {uploadProgress}%
                </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 隱藏原生 date placeholder（包含本地化文字），在沒有值時保持空白 */}
      <style>{`
        .hide-date-placeholder::-webkit-datetime-edit,
        .hide-date-placeholder::-webkit-datetime-edit-year-field,
        .hide-date-placeholder::-webkit-datetime-edit-month-field,
        .hide-date-placeholder::-webkit-datetime-edit-day-field,
        .hide-date-placeholder::-webkit-datetime-edit-text { color: transparent; }
        .hide-date-placeholder:focus::-webkit-datetime-edit,
        .hide-date-placeholder:focus::-webkit-datetime-edit-year-field,
        .hide-date-placeholder:focus::-webkit-datetime-edit-month-field,
        .hide-date-placeholder:focus::-webkit-datetime-edit-day-field,
        .hide-date-placeholder:focus::-webkit-datetime-edit-text { color: transparent; }
      `}</style>
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="accountPage.title" subtitleKey="accountPage.subtitle" />
      </motion.div>

      {/* 圖片裁剪器模態框 */}
      <ImageCropper 
        src={imageToCrop}
        onSave={handleCropSave}
        onCancel={handleCropCancel}
      />

      <form onSubmit={handleUpdateAll} className="max-w-3xl mx-auto">
        <motion.div
          className="bg-theme-secondary rounded-lg shadow-xl overflow-hidden"
          {...sectionDelayShow(0.2)}
        >
          {/* 頭像區塊 */}
          <div className="p-6 flex flex-col items-center">
            <h3 className="text-xl font-semibold text-theme-primary mb-4">{t('accountPage.avatarTitle')}</h3>
            <div className="profile-image-wrapper w-40 h-40 mb-6">
              <div className="profile-image-inner flex items-center justify-center">
                {imageStatus === 'failed' ? (
                  <span className="text-6xl font-bold text-theme-primary select-none">
                    {username.substring(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <img
                    key={previewAvatarUrl}
                    src={previewAvatarUrl || userProfile.avatarUrl}
                    alt={t('accountPage.currentAvatarAlt')}
                    className={`w-full h-full rounded-full object-cover transition-opacity duration-300 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
              </div>
            </div>
            {!isUploadingAvatar && uploadProgress === 100 ? (
              <div className="mb-3 text-green-400 font-semibold text-sm text-center">
                {t('accountPage.avatarUploadSuccess')}
              </div>
            ) : null}
            <div className="w-full max-w-sm flex justify-center">
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <label
                htmlFor="avatarUpload"
                role="button"
                tabIndex={0}
                className={`cursor-pointer inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-md text-zinc-900 ${ACCENT_BG_COLOR} ${ACCENT_BG_HOVER_COLOR} transition-all duration-300 shadow-md ${ACCENT_FOCUS_RING_CLASS}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    document.getElementById('avatarUpload')?.click();
                  }
                }}
              >
                {t('accountPage.avatarLabel')}
              </label>
            </div>
          </div>
          
          <hr className="border-theme-primary mx-6 md:mx-8" />
          
          {/* 個人資訊區塊 */}
          <div className="p-6 md:p-8">
            <h3 className="text-xl font-semibold text-theme-primary mb-6">{t('accountPage.profileInfoTitle')}</h3>
            <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-theme-secondary mb-1">
                            {t('accountPage.usernameLabel')}
                        </label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required
                            className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1">
                            {t('accountPage.emailLabel')}
                        </label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} />
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-theme-secondary mb-1">{t('accountPage.genderLabel')}</label>
                        <div className="relative">
                            <select 
                                id="gender" 
                                value={gender || ''} 
                                onChange={handleGenderChange}
                                className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} ${ACCENT_FOCUS_RING_CLASS} custom-select-text appearance-none`}
                            >
                                <option value="">{t('accountPage.selectGender')}</option>
                                <option value="MALE">{t('accountPage.genderMale')}</option>
                                <option value="FEMALE">{t('accountPage.genderFemale')}</option>
                                <option value="NOT_SPECIFIED">{t('accountPage.genderNotSpecified')}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-primary">
                                <ChevronDownIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="birthday" className="block text-sm font-medium text-theme-secondary mb-1">{t('accountPage.birthdayLabel')}</label>
                        <input
                          id="birthday"
                          type={birthdayInputType}
                          value={birthday ? birthday.replace(/\//g, '-') : ''}
                          onChange={(e) => setBirthday(e.target.value ? e.target.value.replace(/-/g, '/') : '')}
                          onFocus={() => setIsBirthdayInputFocused(true)}
                          onBlur={() => setIsBirthdayInputFocused(false)}
                          placeholder={t('accountPage.birthdayPlaceholder')}
                          className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS} custom-select-text`}
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-theme-secondary mb-1">{t('accountPage.phoneLabel')}</label>
                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)}
                        className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                        placeholder={t('accountPage.phonePlaceholder')} />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-theme-secondary mb-1">{t('accountPage.addressLabel')}</label>
                    <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)}
                        className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                        placeholder={t('accountPage.addressPlaceholder')} />
                </div>
            </div>
          </div>
          
          <hr className="border-theme-primary mx-6 md:mx-8" />

          {/* 安全設定區塊 */}
          <div className="p-6 md:p-8">
            <h3 className="text-xl font-semibold text-theme-primary mb-6">{t('accountPage.securityTitle')}</h3>
            <div className="space-y-6">
                <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-theme-secondary mb-1">{t('accountPage.newPasswordLabel')}</label>
                    <div className="relative">
                        <input
                            type={showNewPassword ? 'text' : 'password'}
                            id="new_password" value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            onFocus={() => setIsNewPasswordFocused(true)}
                            onBlur={() => setIsNewPasswordFocused(false)}
                            minLength={6}
                            className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                            placeholder={t('accountPage.newPasswordPlaceholder')} />
                        <AnimatePresence>
                          {(isNewPasswordFocused || newPassword) && (
                            <motion.button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3"
                              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                                {showNewPassword ? (<EyeSlashIcon className="h-5 w-5 text-custom-cyan" />) : (<EyeIcon className="h-5 w-5 text-custom-cyan" />)}
                            </motion.button>
                          )}
                        </AnimatePresence>
                    </div>
                </div>
                <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-theme-secondary mb-1">{t('accountPage.confirmPasswordLabel')}</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirm_password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            onFocus={() => setIsConfirmPasswordFocused(true)}
                            onBlur={() => setIsConfirmPasswordFocused(false)}
                            minLength={6}
                            className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 pr-10 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`}
                            placeholder={t('accountPage.confirmPasswordPlaceholder')} />
                        <AnimatePresence>
                          {(isConfirmPasswordFocused || confirmPassword) && (
                            <motion.button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                                {showConfirmPassword ? (<EyeSlashIcon className="h-5 w-5 text-custom-cyan" />) : (<EyeIcon className="h-5 w-5 text-custom-cyan" />)}
                            </motion.button>
                          )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-4 mt-8 border-t border-theme-primary">
                {submitStatus !== 'idle' && statusMessage && (
                  <p className={`text-sm ${submitStatus === 'success' ? 'text-green-400' : 'text-red-400'} mr-auto`} role="alert">{statusMessage}</p>
                )}
                <button
                    type="submit"
                    disabled={!isDirty || isSubmitting || !isAuthenticated}
                    className={`w-full sm:w-auto ${ACCENT_BG_COLOR} text-zinc-900 font-semibold py-2.5 px-6 rounded-md ${ACCENT_BG_HOVER_COLOR} transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isSubmitting ? t('accountPage.updatingButton') : t('accountPage.updateAllButton')}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isDirty || isSubmitting}
                    className="w-full sm:w-auto button-theme-neutral font-semibold py-2.5 px-6 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('accountPage.resetChangesButton')}
                </button>
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default AccountPage;