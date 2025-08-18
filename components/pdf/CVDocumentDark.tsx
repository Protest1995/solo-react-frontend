

// 引入 React 相關鉤子
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入圖標組件
import BriefcaseIconWork from '../icons/BriefcaseIconWork';
import AcademicCapIcon from '../icons/AcademicCapIcon';
import RocketIcon from '../icons/RocketIcon';
import WrenchScrewdriverIcon from '../icons/WrenchScrewdriverIcon';
// 引入類型定義
import { TimelineItem, Skill as SkillType } from '../../types';

// PDF 專用的數據，與淺色模式版本相同
const experienceDataForPdf: Omit<TimelineItem, 'date'>[] = [ { titleKey: 'resumePage.exp1Title', institutionKey: 'resumePage.exp1Institution', descriptionKey: 'resumePage.exp1Description', }, ];
const experienceDatesForPdf = ['2024 - 2023'];
const educationDataForPdf: Omit<TimelineItem, 'date'>[] = [ { titleKey: 'resumePage.edu1Title', institutionKey: 'resumePage.edu1Institution', descriptionKey: 'resumePage.edu1Description', }, { titleKey: 'resumePage.edu2Title', institutionKey: 'resumePage.edu2Institution', descriptionKey: 'resumePage.edu2Description', }, ];
const educationDatesForPdf = ['2017 - 2013', '2013 - 2010'];
const devSkills: SkillType[] = [ { nameKey: 'resumePage.skillApiDev', level: 95 }, { nameKey: 'resumePage.skillReportDesign', level: 90 }, { nameKey: 'resumePage.skillUiDesign', level: 92 }, { nameKey: 'resumePage.skillDbMaint', level: 85 }, ];
const videoSkills: SkillType[] = [ { nameKey: 'resumePage.skillVideoPhoto', level: 88 }, { nameKey: 'resumePage.skillColor', level: 85 }, { nameKey: 'resumePage.skillScriptStory', level: 82 }, { nameKey: 'resumePage.skillEditSub', level: 92 }, ];
const skillsDataForPdf: SkillType[] = [...devSkills, ...videoSkills];
const devTools: { nameKey: string }[] = [ { nameKey: 'resumePage.toolVsCode' }, { nameKey: 'resumePage.toolIdea' }, { nameKey: 'resumePage.toolAndroidStudio' }, { nameKey: 'resumePage.toolGit' }, { nameKey: 'resumePage.toolPostman' }, { nameKey: 'resumePage.toolStimulsoft' }, { nameKey: 'resumePage.toolObsidian' }, ];
const videoTools: { nameKey: string }[] = [ { nameKey: 'resumePage.toolLightroom' }, { nameKey: 'resumePage.toolPhotoshop' }, { nameKey: 'resumePage.toolDavinci' }, { nameKey: 'resumePage.toolPremiere' }, { nameKey: 'resumePage.toolArctime' }, ];
const toolsDataForPdf: { nameKey: string }[] = [...devTools, ...videoTools];

/**
 * 用於生成深色模式 PDF 的 React 組件。
 * 這個組件會被 html2canvas 渲染成圖片，然後放入 PDF 中。
 * @param {object} props - 組件屬性。
 * @param {string} props.language - 當前語言 ('en' 或 'zh-Hant')。
 */
export default function CVDocumentDark({ language }: { language: string }) {
  const { t, i18n } = useTranslation();

  // 確保 i18n 實例使用傳入的語言
  React.useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);
  
  // 獲取個人頭像的 URL
  const profileImageUrl = `${window.location.origin}/images/cv.jpg`;
  // 定義主題色
  const accentColor = '#70ffff';
  
  // 根據語言選擇顯示的姓名
  const profileName = language === 'zh-Hant' ? '黃正德' : t('sidebar.profileName', { lng: language });

  // 渲染履歷描述的輔助函數，支持多段落和列表格式
  const renderCVDescription = (description: string) => {
    if (!description) return null;
    const parts = description.split('\n\n');
    return parts.map((part, partIndex) => {
      const lines = part.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) return null;
      const isHeaderSection = !lines[0].trim().startsWith('•');
      if (isHeaderSection) {
        return (
          <div key={partIndex} style={{ marginTop: partIndex === 0 ? '0px' : '10px' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '4px', paddingBottom: '3px' }}>
              <strong style={{ fontSize: language === 'en' ? '13px' : '14px' }}>{lines[0]}</strong>
              <span style={{ position: 'absolute', bottom: '-4px', left: '0', width: 'calc(100% - 14px)', height: '1.5px', backgroundColor: accentColor }}></span>
            </div>
            {lines.slice(1).map((line, lineIndex) => ( <div key={lineIndex} style={{ marginTop: '2px', textAlign: 'left' }}>{line}</div> ))}
          </div>
        );
      } else {
        return (
          <div key={partIndex} style={{ marginTop: '5px' }}>
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} style={{ display: 'flex', marginTop: '3px', textAlign: 'left' }}>
                  <span style={{ width: '12px', flexShrink: 0 }}>•</span>
                  <span style={{ flex: 1 }}>{line.substring(line.indexOf('•') + 1).trim()}</span>
              </div>
            ))}
          </div>
        );
      }
    });
  };

  return (
    <div className="cv-document-wrapper">
      {/* 內聯樣式定義了 PDF 的整體外觀 (深色模式) */}
      <style>{`
        /* ... 此處省略大量 CSS 樣式定義，其功能與 class 名稱對應，但顏色值已針對深色模式調整 ... */
        .cv-document-wrapper { background-color: #18181b; color: #e4e4e7; font-family: 'Inter', 'Noto Sans TC', sans-serif; padding: 18px; width: 780px; box-sizing: border-box; line-height: 1.45; }
        .cv-document-wrapper * { box-sizing: border-box; text-align: left; }
        .cv-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1.5px solid ${accentColor}; }
        .cv-header-image-container { width: 70px; height: 70px; margin-right: 16px; overflow: hidden; flex-shrink: 0; border-radius: 50%; }
        .cv-header-image { width: 100%; height: 100%; object-fit: cover; }
        .cv-header-text-content { display: flex; justify-content: space-between; flex-grow: 1; align-items: flex-start; }
        .cv-header-identity { display: flex; flex-direction: column; justify-content: center; margin-left: 12px; margin-top: 6px; }
        .cv-profile-name { font-size: 34px; color: #f3f4f6; margin-bottom: 3px; font-weight: bold; }
        .cv-profile-title { font-size: 16px; color: ${accentColor}; font-weight: 500; }
        .cv-header-contact-details { text-align: right; font-size: 12.5px; color: #a1a1aa; line-height: 1.4; padding-top: 20px; }
        .cv-header-contact-details span { display: block; margin-bottom: 2px; }
        .cv-main-content { display: flex; justify-content: space-between; margin-top: 17px; gap: 22px; margin-bottom: 5px; }
        .cv-column { flex: 1; min-width: 0; }
        .cv-section-title-container { display: flex; align-items: center; margin-bottom: 11px; color: #f3f4f6; }
        .cv-section-title-icon { width: 19px; height: 19px; margin-right: 9px; color: ${accentColor}; flex-shrink: 0; position: relative; top: 1px; }
        .cv-section-title-text { font-size: 21px; font-weight: bold; position: relative; top: -5px; }
        .cv-timeline-container { position: relative; padding-left: 20px; border-left: 1.5px solid ${accentColor}; top: 6px; }
        .cv-timeline-item { position: relative; margin-bottom: 12px; padding: 0px 12px 6px; background-color: #27272a; border-radius: 4px; border: 1px solid #3f3f46; }
        .cv-timeline-item:last-child { margin-bottom: 0; }
        .cv-timeline-date { font-size: 12px; color: ${accentColor}; font-weight: 600; margin-bottom: 3px; text-transform: uppercase; position: relative; top: -4px; }
        .cv-timeline-title { font-size: ${language === 'en' ? '14.5px' : '16px'}; color: #f3f4f6; font-weight: bold; margin-bottom: 2px; position: relative; top: -4px; }
        .cv-timeline-institution { font-size: ${language === 'en' ? '13px' : '14px'}; color: #a1a1aa; margin-bottom: 5px; position: relative; top: -4px; }
        .cv-timeline-description { font-size: 13px; color: #d1d5db; line-height: 1.4; position: relative; top: -4px; }
        .cv-timeline-description strong { font-weight: bold; color: #f3f4f6; }
        .cv-skills-section, .cv-tools-section { margin-top: 18px; }
        .cv-skills-section .cv-section-title-container, .cv-tools-section .cv-section-title-container { margin-bottom: 10px; }
        .cv-skills-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 14px; padding-top: 2px; }
        .cv-skill-bar-info { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
        .cv-skill-name { color: #e4e4e7; font-weight: 500; }
        .cv-skill-level-text { color: ${accentColor}; }
        .cv-skill-bar-bg { width: 100%; background-color: #3f3f46; border-radius: 4px; height: 7px; position: relative; top: 6px; }
        .cv-skill-bar-fill { background-color: ${accentColor}; height: 7px; border-radius: 4px; }
        .cv-tools-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px 24px; padding-top: 2px; }
        .cv-tool-item { font-size: 13px; color: #e4e4e7; font-weight: 600; padding: 3px 0; position: relative; padding-left: 22px; text-align: left; }
        .cv-tool-item::before { content: '•'; position: absolute; left: 6px; color: ${accentColor}; font-size: 1em; line-height: 1; }
      `}</style>
      
      {/* CV 頭部 (結構與淺色模式相同) */}
      <div className="cv-header">
        <div className="cv-header-image-container"> <img src={profileImageUrl} alt={profileName} className="cv-header-image" /> </div>
        <div className="cv-header-text-content">
            <div className="cv-header-identity"> <div className="cv-profile-name">{profileName}</div> </div>
            <div className="cv-header-contact-details">
              <span>{t('contactPage.emailLabel', { lng: language })}: {t('contactPage.emailValue', {lng: language})}</span>
              <span>{t('contactPage.phoneLabel', { lng: language })}: {t('contactPage.phoneValue', {lng: language})}</span>
              <span>{t('contactPage.addressLabel', { lng: language })}: {t('contactPage.addressValue', {lng: language})}</span>
            </div>
        </div>
      </div>

      {/* CV 主體內容 (結構與淺色模式相同) */}
      <div className="cv-main-content">
        <div className="cv-column">
          <div className="cv-section-title-container"> <BriefcaseIconWork className="cv-section-title-icon" /> <span className="cv-section-title-text">{t('resumePage.experience', { lng: language })}</span> </div>
          <div className="cv-timeline-container">
            {experienceDataForPdf.map((item, index) => ( <div key={`exp-${index}`} className="cv-timeline-item"> <div className="cv-timeline-date">{experienceDatesForPdf[index]}</div> <div className="cv-timeline-title">{t(item.titleKey, { lng: language })}</div> <div className="cv-timeline-institution">{t(item.institutionKey, { lng: language })}</div> <div className="cv-timeline-description">{renderCVDescription(t(item.descriptionKey, { lng: language }))}</div> </div> ))}
          </div>
        </div>
        <div className="cv-column">
          <div className="cv-section-title-container"> <AcademicCapIcon className="cv-section-title-icon" /> <span className="cv-section-title-text">{t('resumePage.education', { lng: language })}</span> </div>
          <div className="cv-timeline-container">
            {educationDataForPdf.map((item, index) => ( <div key={`edu-${index}`} className="cv-timeline-item"> <div className="cv-timeline-date">{educationDatesForPdf[index]}</div> <div className="cv-timeline-title">{t(item.titleKey, { lng: language })}</div> <div className="cv-timeline-institution">{t(item.institutionKey, { lng: language })}</div> <div className="cv-timeline-description">{renderCVDescription(t(item.descriptionKey, { lng: language }))}</div> </div> ))}
          </div>
        </div>
      </div>

      {/* 技能與工具區塊 (結構與淺色模式相同) */}
      <div className="cv-skills-section">
        <div className="cv-section-title-container"> <RocketIcon className="cv-section-title-icon" /> <span className="cv-section-title-text">{t('resumePage.skillsSubTitle', { lng: language })}</span> </div>
        <div className="cv-skills-grid">
          {skillsDataForPdf.map(skill => ( <div key={skill.nameKey} className="cv-skill-bar-container"> <div className="cv-skill-bar-info"> <span className="cv-skill-name">{t(skill.nameKey, { lng: language })}</span> <span className="cv-skill-level-text">{skill.level}%</span> </div> <div className="cv-skill-bar-bg"> <div className="cv-skill-bar-fill" style={{ width: `${skill.level}%` }}></div> </div> </div> ))}
        </div>
      </div>
      <div className="cv-tools-section">
        <div className="cv-section-title-container"> <WrenchScrewdriverIcon className="cv-section-title-icon" /> <span className="cv-section-title-text">{t('resumePage.toolsSubTitle', { lng: language })}</span> </div>
        <div className="cv-tools-list">
          {toolsDataForPdf.map(tool => ( <div key={tool.nameKey} className="cv-tool-item"> {t(tool.nameKey, { lng: language })} </div> ))}
        </div>
      </div>
    </div>
  );
}
