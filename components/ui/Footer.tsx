// 引入 React
import React, { useEffect, useState } from 'react';
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
import { motion } from 'framer-motion';

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
  // Track whether footer has ever been shown to avoid re-running animation
  const [hasBeenShown, setHasBeenShown] = useState(false);
  // Play entrance animation only when it first becomes visible
  const [playEntrance, setPlayEntrance] = useState(false);
  // sentinel ref placed near page bottom; we only show footer when it intersects
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Observe sentinel: when it becomes visible AND isVisible prop is true, reveal footer once.
  useEffect(() => {
    if (hasBeenShown) return; // already done
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && isVisible) {
        setPlayEntrance(true);
        setHasBeenShown(true);
        // stop play after animation finishes
        const tmr = setTimeout(() => setPlayEntrance(false), 600);
        // clear timer when we unobserve
        // store on the element for cleanup closure
        (el as any).__footerTimer = tmr;
      }
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    obs.observe(el);
    return () => {
      obs.disconnect();
      // clear any leftover timer
      const t = (el as any).__footerTimer;
      if (t) clearTimeout(t);
    };
  }, [isVisible, hasBeenShown]);

  // Always render a small sentinel (so observer can detect when footer area scrolls into view).
  // The footer itself is only rendered when it's playing entrance (first time) or after it's been shown.
  return (
    <>
      <div ref={sentinelRef} style={{ width: '100%', height: 8 }} aria-hidden />

      {playEntrance ? (
        <motion.footer
          className="bg-theme-primary border-t-0"
          style={{ borderTop: 'none' }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div className="max-w-7xl mx-auto py-10 px-6 md:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-theme-primary mb-2">
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
      ) : hasBeenShown ? (
        <footer className="bg-theme-primary border-t-0" style={{ borderTop: 'none' }}>
          <div className="max-w-7xl mx-auto py-10 px-6 md:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-theme-primary mb-2">
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
        </footer>
      ) : null}
    </>
  );
};

export default Footer;