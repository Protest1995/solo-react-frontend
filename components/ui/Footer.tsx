// 引入 React
import React from 'react';
// 引入翻譯鉤子
import { useTranslation } from 'react-i18next';
// 引入類型定義
import { Page } from '../../types';
// 引入圖標組件
import LinkedInIcon from '../icons/LinkedInIcon';
import GithubIcon from '../icons/GithubIcon';
import InstagramIcon from '../icons/InstagramIcon';
// 引入樣式常數
import { ACCENT_COLOR } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';

// 組件屬性介面
interface FooterProps {
  navigateTo: (page: Page) => void; // 導航函數 (目前未使用，保留供未來擴展)
  isVisible: boolean;
}

/**
 * 頁腳組件。
 * 顯示在部落格頁面底部，包含標題、描述和社交媒體連結。
 */
const Footer: React.FC<FooterProps> = ({ isVisible }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.footer
          className="bg-theme-primary"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div className="max-w-7xl mx-auto py-10 px-6 md:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-theme-primary mb-2">
                {/* 將標題分割，以便對 "Solo" 應用特殊顏色 */}
                {t('footer.title').split(' ').map((word, index) => 
                  word === 'Solo' ? (
                    <span key={index} className="text-custom-cyan">{word} </span>
                  ) : (
                    <span key={index}>{word} </span>
                  )
                )}
              </h2>
              <p className="text-theme-secondary mb-6 max-w-2xl mx-auto">
                {t('footer.description')}
              </p>
              <div className="flex justify-center space-x-6">
                <a href="https://www.linkedin.com/in/jason-huang-831802164/" target="_blank" rel="noopener noreferrer" className={`text-theme-secondary hover:${ACCENT_COLOR} transition-colors`} aria-label="LinkedIn">
                  <LinkedInIcon className="w-6 h-6" />
                </a>
                <a href="https://github.com/Protest1995" target="_blank" rel="noopener noreferrer" className={`text-theme-secondary hover:${ACCENT_COLOR} transition-colors`} aria-label="GitHub">
                  <GithubIcon className="w-6 h-6" />
                </a>
                <a href="https://www.instagram.com/tatw800722519/" target="_blank" rel="noopener noreferrer" className={`text-theme-secondary hover:${ACCENT_COLOR} transition-colors`} aria-label="Instagram">
                  <InstagramIcon className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
};

export default Footer;