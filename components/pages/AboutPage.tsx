
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import SectionTitle from '../ui/SectionTitle';
import ServiceCard from '../ui/ServiceCard';
import { ACCENT_COLOR, ACCENT_TEXT_GRADIENT_COLOR } from '../../constants';
import CodeIcon from '../icons/CodeIcon';
import PaletteIcon from '../icons/PaletteIcon';
import CameraIcon from '../icons/CameraIcon'; 
import PlayIcon from '../icons/PlayIcon';     
import CakeIcon from '../icons/CakeIcon';
import MapPinIcon from '../icons/MapPinIcon';
import PhoneIcon from '../icons/PhoneIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import { ServiceItem } from '../../types';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import GlobeAltIcon from '../icons/GlobeAltIcon';
import HeartIcon from '../icons/HeartIcon';
import FilmIcon from '../icons/FilmIcon';
import WeightIcon from '../icons/WeightIcon';
import SparklesIcon from '../icons/SparklesIcon';
import UsersGroupIcon from '../icons/UsersGroupIcon';

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// "我的服務" 區塊的數據定義。
// Omit<ServiceItem, 'icon'> 表示我們在這裡只定義數據，圖標會在之後動態配對。
const servicesData: Omit<ServiceItem, 'icon'>[] = [
  {
    titleKey: 'aboutPage.serviceProgramDevelopmentTitle',
    descriptionKey: 'aboutPage.serviceProgramDevelopmentDesc',
  },
  {
    titleKey: 'aboutPage.serviceWebDesignTitle',
    descriptionKey: 'aboutPage.serviceWebDesignDesc',
  },
  {
    titleKey: 'aboutPage.servicePhotographyTitle',
    descriptionKey: 'aboutPage.servicePhotographyDesc',
  },
  {
    titleKey: 'aboutPage.serviceVideoPostProductionTitle',
    descriptionKey: 'aboutPage.serviceVideoPostProductionDesc',
  },
];

// 對應 "我的服務" 的圖標組件數組，順序必須與 servicesData 一致。
const serviceIcons = [
  <CodeIcon />,    
  <PaletteIcon />, 
  <CameraIcon />,  
  <PlayIcon />,    
];

// "我的愛好" 區塊的數據定義。
const hobbiesData: Omit<ServiceItem, 'icon'>[] = [
  {
    titleKey: 'aboutPage.hobbyFilmStudyTitle',
    descriptionKey: 'aboutPage.hobbyFilmStudyDesc',
  },
  {
    titleKey: 'aboutPage.hobbyFitnessSportsTitle',
    descriptionKey: 'aboutPage.hobbyFitnessSportsDesc',
  },
  {
    titleKey: 'aboutPage.hobbyTalentExplorationTitle',
    descriptionKey: 'aboutPage.hobbyTalentExplorationDesc',
  },
  {
    titleKey: 'aboutPage.hobbyCommunicationSharingTitle',
    descriptionKey: 'aboutPage.hobbyCommunicationSharingDesc',
  },
];

// 對應 "我的愛好" 的圖標組件數組，順序必須與 hobbiesData 一致。
const hobbyIcons = [
  <FilmIcon />,
  <WeightIcon />,
  <SparklesIcon />,
  <UsersGroupIcon />,
];

/**
 * 「關於我」頁面組件 (AboutPage)。
 * 此組件負責展示個人簡介、提供的服務以及個人興趣愛好。
 * 頁面內容分為三個主要區塊，並使用 Framer Motion 實現豐富的載入動畫。
 */
const AboutPage: React.FC = () => {
  // 使用 useTranslation 鉤子來獲取翻譯函數 t
  const { t } = useTranslation();

  return (
    // 頁面主容器，使用 space-y-16 在各個 section 之間創建間距
    <div className="space-y-16">
      {/* 關於我主要區塊，經過重新結構化並放大以突出顯示 */}
      <motion.section 
        // 設置最小高度，使其在各種螢幕尺寸下都佔據顯著位置
        className="flex flex-col justify-center min-h-[60vh] md:min-h-[70vh]"
        // 使用交錯容器動畫變體，使子元素依序出現
        variants={staggerContainerVariants(0.1, 0)}
        initial="initial"
        animate="animate"
      >
        {/* 頁面標題 */}
        <div className="mb-12">
            <SectionTitle titleKey="aboutPage.title" subtitleKey="aboutPage.subtitle" />
        </div>
        
        {/* 主要內容網格佈局 */}
        <div className="flex flex-col lg:grid lg:grid-cols-7 gap-x-12 gap-y-8 items-center">
            {/* 個人照片 - 在手機和中尺寸時在上方，大尺寸時在左側 */}
            <motion.div className="w-full max-w-md mx-auto lg:col-span-3 lg:max-w-none" variants={fadeInUpItemVariants}>
                {/* service-card-wrapper 用於實現動畫邊框效果 */}
                <div className="service-card-wrapper shadow-xl">
                    <div className="service-card-inner">
                       <img src="/images/about-me.jpg" alt={t('sidebar.profileName')} className="w-full h-full object-cover" />
                    </div>
                </div>
            </motion.div>

            {/* 個人資訊 - 在手機和中尺寸時在下方，大尺寸時在右側 */}
            <motion.div 
                className="w-full lg:col-span-4 text-theme-secondary space-y-6 text-lg"
                variants={fadeInUpItemVariants}
            >
                {/* 問候語和姓名 */}
                <h3 className="text-4xl md:text-5xl font-semibold text-theme-primary">
                    {t('aboutPage.greetingText')} <span className={ACCENT_TEXT_GRADIENT_COLOR}>{t('sidebar.profileName')}</span>
                </h3>
                {/* 個人簡介 */}
                <p className="leading-relaxed">{t('aboutPage.bioFull')}</p>
                {/* 詳細個人資料列表 */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 pt-4">
                    <li className="flex items-center">
                        <CakeIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div>
                            <strong className="text-theme-primary mr-2">{t('aboutPage.birthday')}:</strong> {t('aboutPage.birthdayValue', '1995/02/02')}
                        </div>
                    </li>
                    <li className="flex items-center">
                        <MapPinIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div>
                            <strong className="text-theme-primary mr-2">{t('aboutPage.address')}:</strong> {t('contactPage.addressValue')}
                        </div>
                    </li>
                    <li className="flex items-center">
                        <PhoneIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div>
                            <strong className="text-theme-primary mr-2">{t('aboutPage.phone')}:</strong> {t('contactPage.phoneValue')}
                        </div>
                    </li>
                    <li className="flex items-center">
                        <EnvelopeIcon className={`w-7 h-7 mr-4 flex-shrink-0 ${ACCENT_COLOR}`} />
                        <div className="break-all">
                            <strong className="text-theme-primary mr-2">{t('aboutPage.email')}:</strong> {t('contactPage.emailValue')}
                        </div>
                    </li>
                </ul>
            </motion.div>
        </div>
      </motion.section>
      
      {/* "我的服務" 區塊 */}
      <div>
        <motion.h3
          className="text-2xl font-semibold text-theme-primary mb-6 flex items-center justify-center"
          // 使用 fadeInUpItemVariants 實現淡入動畫
          variants={fadeInUpItemVariants}
          initial="initial"
          // 當元素進入視圖時觸發動畫
          whileInView="animate"
          viewport={{ once: true, amount: 0.8 }}
        >
            <GlobeAltIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('aboutPage.whatIDo')}
        </motion.h3>
        {/* 服務卡片網格佈局 */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainerVariants(0.15)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          {servicesData.map((service, index) => (
            <motion.div key={service.titleKey} variants={fadeInUpItemVariants} className="h-full">
              <ServiceCard 
                // 從圖標數組中取出對應的圖標並傳遞 props
                icon={React.cloneElement(serviceIcons[index], { className: `w-10 h-10 ${ACCENT_COLOR} mb-4` })}
                titleKey={service.titleKey}
                descriptionKey={service.descriptionKey}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* "我的愛好" 區塊 */}
      <div>
        <motion.h3
          className="text-2xl font-semibold text-theme-primary mb-6 flex items-center justify-center"
          variants={fadeInUpItemVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.8 }}
        >
            <HeartIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('aboutPage.myHobbies')}
        </motion.h3>
        {/* 愛好卡片網格佈局 */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainerVariants(0.15)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          {hobbiesData.map((hobby, index) => (
            <motion.div key={hobby.titleKey} variants={fadeInUpItemVariants} className="h-full">
              <ServiceCard 
                icon={React.cloneElement(hobbyIcons[index], { className: `w-10 h-10 ${ACCENT_COLOR} mb-4` })}
                titleKey={hobby.titleKey}
                descriptionKey={hobby.descriptionKey}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
