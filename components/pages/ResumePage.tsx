import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion as motionTyped } from 'framer-motion';
import SectionTitle from '../ui/SectionTitle';
import SkillBar from '../ui/SkillBar';
import TimelineEvent from '../ui/TimelineEvent';
import { Skill, TimelineItem } from '../../types';
import AcademicCapIcon from '../icons/AcademicCapIcon';
import BriefcaseIconWork from '../icons/BriefcaseIconWork';
import RocketIcon from '../icons/RocketIcon';
import WrenchScrewdriverIcon from '../icons/WrenchScrewdriverIcon';
import { sectionDelayShow, staggerContainerVariants, fadeInUpItemVariants } from '../../animationVariants';
import { ACCENT_COLOR, ACCENT_SOLID_BG_COLOR } from '../../constants'; 

// 將 motionTyped 轉型為 any 以解決 Framer Motion 在某些情況下的類型推斷問題
const motion: any = motionTyped;

// --- 數據定義 ---
// 為了保持程式碼的清晰和可維護性，所有靜態數據都在組件外部定義。

// 工作經歷數據 (不含日期，日期單獨處理以保持結構清晰)
const experienceData: Omit<TimelineItem, 'date'>[] = [
  {
    titleKey: 'resumePage.exp1Title',
    institutionKey: 'resumePage.exp1Institution',
    descriptionKey: 'resumePage.exp1Description',
  },
];
const experienceDates = ['2024 - 2023']; // 與 `experienceData` 順序對應的日期

// 教育背景數據
const educationData: Omit<TimelineItem, 'date'>[] = [
  {
    titleKey: 'resumePage.edu1Title',
    institutionKey: 'resumePage.edu1Institution',
    descriptionKey: 'resumePage.edu1Description',
  },
  {
    titleKey: 'resumePage.edu2Title',
    institutionKey: 'resumePage.edu2Institution',
    descriptionKey: 'resumePage.edu2Description',
  },
];
const educationDates = ['2017 - 2013', '2013 - 2010']; // 與 `educationData` 順序對應的日期

// 技能數據
const devSkills: Skill[] = [
    { nameKey: 'resumePage.skillApiDev', level: 95 },
    { nameKey: 'resumePage.skillReportDesign', level: 90 },
    { nameKey: 'resumePage.skillUiDesign', level: 92 },
    { nameKey: 'resumePage.skillDbMaint', level: 85 },
];
const videoSkills: Skill[] = [
    { nameKey: 'resumePage.skillVideoPhoto', level: 88 },
    { nameKey: 'resumePage.skillColor', level: 85 },
    { nameKey: 'resumePage.skillScriptStory', level: 82 },
    { nameKey: 'resumePage.skillEditSub', level: 92 },
];
// 將所有技能合併到一個數組中以便渲染
const allSkills: Skill[] = [...devSkills, ...videoSkills];

// 工具數據
const devTools: { nameKey: string }[] = [ { nameKey: 'resumePage.toolVsCode' }, { nameKey: 'resumePage.toolIdea' }, { nameKey: 'resumePage.toolAndroidStudio' }, { nameKey: 'resumePage.toolGit' }, { nameKey: 'resumePage.toolPostman' }, { nameKey: 'resumePage.toolStimulsoft' }, { nameKey: 'resumePage.toolObsidian' }, ];
const videoTools: { nameKey: string }[] = [ { nameKey: 'resumePage.toolLightroom' }, { nameKey: 'resumePage.toolPhotoshop' }, { nameKey: 'resumePage.toolDavinci' }, { nameKey: 'resumePage.toolPremiere' }, { nameKey: 'resumePage.toolArctime' }, ];
// 將所有工具合併到一個數組中以便渲染
const allTools: { nameKey: string }[] = [...devTools, ...videoTools];

/**
 * 履歷頁面組件 (ResumePage)。
 * 此組件以結構化的方式展示個人履歷，分為以下幾個主要區塊：
 * - 工作經歷
 * - 教育背景
 * - 專業技能 (帶有進度條)
 * - 使用的工具
 * 頁面中的各個區塊都使用了 Framer Motion 來實現進入動畫效果。
 */
const ResumePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      {/* 頁面標題 */}
      <motion.div {...sectionDelayShow(0)}>
        <SectionTitle titleKey="resumePage.title" subtitleKey="resumePage.subtitle" />
      </motion.div>

      {/* 經歷與教育背景網格佈局 */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* 工作經歷區塊 */}
        <motion.div {...sectionDelayShow(0.2)}>
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-6 flex items-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
            <BriefcaseIconWork className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.experience')}
          </motion.h3>
          <motion.div className="relative" variants={staggerContainerVariants(0.2)} initial="initial" animate="animate">
            {/* 時間軸的垂直線，帶有動畫效果 */}
            <motion.div 
              className="absolute top-0 bottom-0 left-[1px] w-0.5 bg-custom-cyan origin-top" 
              initial={{ scaleY: 0 }} 
              animate={{ scaleY: 1 }} 
              transition={{ duration: 1.5, ease: 'circOut' }} 
              aria-hidden="true" 
            />
            <div className="pl-6">
              {experienceData.map((item, index) => (
                <motion.div key={item.titleKey} variants={fadeInUpItemVariants} className={index < experienceData.length - 1 ? 'mb-6' : ''}>
                  {/* 使用 TimelineEvent 子組件來渲染每個經歷項目 */}
                  <TimelineEvent date={experienceDates[index]} titleKey={item.titleKey} institutionKey={item.institutionKey} descriptionKey={item.descriptionKey} renderWithHeaders={true} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
        
        {/* 教育背景區塊 */}
        <motion.div {...sectionDelayShow(0.3)}> 
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-6 flex items-center" variants={fadeInUpItemVariants} initial="initial" animate="animate">
            <AcademicCapIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.education')}
          </motion.h3>
          <motion.div className="relative" variants={staggerContainerVariants(0.2)} initial="initial" animate="animate">
            <motion.div className="absolute top-0 bottom-0 left-[1px] w-0.5 bg-custom-cyan origin-top" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.5, ease: 'circOut' }} aria-hidden="true" />
            <div className="pl-6">
              {educationData.map((item, index) => (
                <motion.div key={item.titleKey} variants={fadeInUpItemVariants} className={index < educationData.length - 1 ? 'mb-6' : ''}>
                  <TimelineEvent date={educationDates[index]} titleKey={item.titleKey} institutionKey={item.institutionKey} descriptionKey={item.descriptionKey} renderWithHeaders={true} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="space-y-16">
        {/* 技能區塊 */}
        <div>
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-8 flex items-center" variants={fadeInUpItemVariants} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.8 }}>
            <RocketIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.skillsSubTitle')}
          </motion.h3>
          <motion.div className="grid sm:grid-cols-2 gap-x-8 gap-y-6" variants={staggerContainerVariants(0.1)} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }}>
            {allSkills.map((skill) => (
              <motion.div key={skill.nameKey} variants={fadeInUpItemVariants}>
                {/* 使用 SkillBar 子組件來渲染帶有動畫的進度條 */}
                <SkillBar nameKey={skill.nameKey} level={skill.level} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* 工具區塊 */}
        <div>
          <motion.h3 className="text-2xl font-semibold text-theme-primary mb-8 flex items-center" variants={fadeInUpItemVariants} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.8 }}>
            <WrenchScrewdriverIcon className={`w-7 h-7 mr-3 ${ACCENT_COLOR}`} />
            {t('resumePage.toolsSubTitle')}
          </motion.h3>
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3" variants={staggerContainerVariants(0.05)} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }}>
            {allTools.map((tool) => (
              <motion.div key={tool.nameKey} variants={fadeInUpItemVariants} className="flex items-center">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-3 ${ACCENT_SOLID_BG_COLOR}`}></span>
                <span className="text-theme-primary text-base font-medium">{t(tool.nameKey)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumePage;