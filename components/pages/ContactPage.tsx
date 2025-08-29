import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import emailjs from '@emailjs/browser';
import SectionTitle from '../ui/SectionTitle';
import { ACCENT_COLOR, ACCENT_BG_COLOR, ACCENT_BG_HOVER_COLOR, ACCENT_BORDER_COLOR, ACCENT_FOCUS_RING_CLASS } from '../../constants';
import PhoneIcon from '../icons/PhoneIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import MapPinIcon from '../icons/MapPinIcon';
import PaperAirplaneIcon from '../icons/PaperAirplaneIcon';
import ClockIcon from '../icons/ClockIcon';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import IdentificationIcon from '../icons/IdentificationIcon';
import Footer from '../ui/Footer';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

/**
 * 「聯絡我」頁面組件 (ContactPage)。
 * 此組件提供一個聯絡表單，讓訪客可以發送訊息。表單數據通過 EmailJS 服務進行處理。
 * 同時，頁面右側會顯示詳細的聯絡資訊。
 */
const ContactPage: React.FC = () => {
  // --- 鉤子 (Hooks) ---
  const { t } = useTranslation();
  
  // --- 狀態管理 (useState) ---
  const form = useRef<HTMLFormElement>(null); // 用於引用表單 DOM 元素
  const [isSubmitting, setIsSubmitting] = useState(false); // 標記表單是否正在提交中
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle'); // 追蹤提交的結果狀態
  const [submitMessage, setSubmitMessage] = useState(''); // 顯示給用戶的提交結果消息

  // --- 處理函數 ---
  
  /**
   * 處理聯絡表單的提交事件。
   * @param {React.FormEvent<HTMLFormElement>} e - 表單提交事件對象。
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 防止瀏覽器默認的表單提交行為
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    // 從環境變數中獲取 EmailJS 的憑證
    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;    

    // 開發時檢查：確保憑證已設置
    if (!serviceID || !templateID || !publicKey) {
      console.warn(t('contactPage.emailjsInfo'));
      setSubmitMessage(t('contactPage.emailjsSetupNeededError'));
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    if (!form.current) {
        setIsSubmitting(false);
        return;
    }

    try {
      // 使用 emailjs.sendForm 發送表單數據
      await emailjs.sendForm(serviceID, templateID, form.current, publicKey);
      setSubmitStatus('success');
      setSubmitMessage(t('contactPage.messageSentSuccess'));
      form.current.reset(); // 成功後清空表單
    } catch (error) {
      console.error('EmailJS send failed:', error);
      setSubmitStatus('error');
      setSubmitMessage(t('contactPage.messageSentError'));
    } finally {
      setIsSubmitting(false); // 無論成功或失敗，都結束提交狀態
    }
  };

  // 定義表單項目動畫的交錯延遲時間
  const formItemDelay = 0.05;

  // --- 渲染 (JSX) ---
  return (
    <div className="space-y-12">
      {/* 頁面標題 */}
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="contactPage.title" subtitleKey="contactPage.subtitle" />
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* 左側：聯絡表單 */}
        <motion.div 
          className="md:col-span-2 bg-theme-secondary p-8 rounded-lg shadow-xl"
          {...sectionDelayShow(0.2)}
        >
          <motion.h3 
            className="text-2xl font-semibold text-theme-primary mb-6"
            variants={fadeInUpItemVariants} initial="initial" animate="animate"
          >
            {t('contactPage.sendMessageTitle')}
          </motion.h3>
          <motion.form 
            ref={form}
            onSubmit={handleSubmit} 
            className="space-y-6"
            variants={staggerContainerVariants(formItemDelay)}
            initial="initial"
            animate="animate"
          >
            {/* 姓名和 Email 輸入框 */}
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div variants={fadeInUpItemVariants}>
                <label htmlFor="name" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.fullNameLabel')}</label>
                <input type="text" name="name" id="name" required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.fullNamePlaceholder')} />
              </motion.div>
              <motion.div variants={fadeInUpItemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.emailAddressLabel')}</label>
                <input type="email" name="email" id="email" required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.emailAddressPlaceholder')} />
              </motion.div>
            </div>
            {/* 主旨輸入框 */}
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="subject" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.subjectLabel')}</label>
              <input type="text" name="subject" id="subject" required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.subjectPlaceholder')} />
            </motion.div>
            {/* 訊息內容輸入框 */}
            <motion.div variants={fadeInUpItemVariants}>
              <label htmlFor="message" className="block text-sm font-medium text-theme-secondary mb-1">{t('contactPage.messageLabel')}</label>
              <textarea name="message" id="message" rows={5} required className={`w-full bg-theme-tertiary border border-theme-secondary text-theme-primary rounded-md p-3 focus:${ACCENT_BORDER_COLOR} placeholder-theme ${ACCENT_FOCUS_RING_CLASS}`} placeholder={t('contactPage.messagePlaceholder')}></textarea>
            </motion.div>
            {/* 提交按鈕 */}
            <motion.div variants={fadeInUpItemVariants}>
              <button type="submit" disabled={isSubmitting} className={`button-theme-accent font-semibold py-3 px-6 rounded-md transition-all duration-300 shadow-md flex items-center disabled:opacity-70 disabled:cursor-not-allowed`}>
                <PaperAirplaneIcon className="w-5 h-5 mr-2 transform -rotate-45" />
                {isSubmitting ? t('contactPage.sendingMessage') : t('contactPage.sendMessageButton')}
              </button>
            </motion.div>
            {/* 顯示提交狀態訊息 */}
            {submitMessage && (
              <motion.p variants={fadeInUpItemVariants} className={`mt-4 text-sm ${submitStatus === 'success' ? 'text-green-400' : 'text-red-400'}`} aria-live="assertive">
                {submitMessage}
              </motion.p>
            )}
          </motion.form>
        </motion.div>

        {/* 右側：聯絡資訊 */}
        <motion.div className="space-y-6" {...sectionDelayShow(0.3)} >
            <motion.h3 className="text-2xl font-semibold text-theme-primary mb-6 flex items-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
              <IdentificationIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
              {t('contactPage.contactInfoTitle')}
            </motion.h3>
            <motion.div className="bg-theme-secondary p-6 rounded-lg shadow-xl space-y-4" variants={staggerContainerVariants(0.1)} initial="initial" animate="animate">
                <motion.div className="flex items-start" variants={fadeInUpItemVariants}>
                    <MapPinIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                    <div>
                        <h4 className="font-semibold text-theme-primary">{t('contactPage.addressLabel')}</h4>
                        <p className="text-theme-secondary">{t('contactPage.addressValue')}</p>
                    </div>
                </motion.div>
                 <motion.div className="flex items-start" variants={fadeInUpItemVariants}>
                    <PhoneIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                    <div>
                        <h4 className="font-semibold text-theme-primary">{t('contactPage.phoneLabel')}</h4>
                        <p className="text-theme-secondary">{t('contactPage.phoneValue')}</p>
                    </div>
                </motion.div>
                 <motion.div className="flex items-start" variants={fadeInUpItemVariants}>
                    <EnvelopeIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                    <div>
                        <h4 className="font-semibold text-theme-primary">{t('contactPage.emailLabel')}</h4>
                        <p className="text-theme-secondary break-all">{t('contactPage.emailValue')}</p>
                    </div>
                </motion.div>
            </motion.div>
            <motion.div className="bg-theme-secondary p-6 rounded-lg shadow-xl" variants={fadeInUpItemVariants} initial="initial" animate="animate">
              <div className="flex items-start">
                  <ClockIcon className={`w-6 h-6 ${ACCENT_COLOR} mr-4 mt-1 flex-shrink-0`} />
                  <div>
                      <h4 className="font-semibold text-theme-primary">{t('contactPage.workingHoursTitle')}</h4>
                      <p className="text-theme-secondary">{t('contactPage.workingHoursDays')}</p>
                      <p className="text-theme-secondary">{t('contactPage.workingHoursWeekend')}</p>
                  </div>
              </div>
            </motion.div>
        </motion.div>
      </div>
    <Footer navigateTo={() => {}} isVisible={true} />
    </div>
  );
};

export default ContactPage;