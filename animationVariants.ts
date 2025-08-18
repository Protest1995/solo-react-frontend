// 定義一個動畫緩動效果的常數。
const easeInOutAnimation = "easeInOut" as const;

// 頁面切換的動畫變體。
// 用於 AnimatePresence 組件，以實現頁面淡入淡出效果。
export const pageTransitionVariants = {
  initial: { opacity: 0 }, // 初始狀態：透明
  animate: { opacity: 1, transition: { duration: 0.4, ease: easeInOutAnimation } }, // 動畫狀態：淡入
  exit: { opacity: 0, transition: { duration: 0.4, ease: easeInOutAnimation } } // 離開狀態：淡出
};

/**
 * 創建一個帶有延遲顯示效果的區塊動畫變體。
 * 元素會從下方 20px 處淡入。
 * @param delay 延遲時間（秒），預設為 0。
 * @returns Framer Motion 動畫變體對象。
 */
export const sectionDelayShow = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 }, // 初始狀態：透明且在下方 20px
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeInOutAnimation,
      delay: delay // 明確指定延遲
    }
  }
});

/**
 * 創建一個容器動畫變體，使其子元素交錯顯示。
 * @param staggerAmount 子元素之間的交錯延遲（秒）。
 * @param containerDelay 容器本身的動畫延遲（秒）。
 * @param childrenInitialDelay 第一個子元素開始動畫前的延遲（秒）。
 * @returns Framer Motion 動畫變體對象。
 */
export const staggerContainerVariants = (
  staggerAmount: number = 0.1,
  containerDelay: number = 0.2,
  childrenInitialDelay: number = 0.2
) => ({
  initial: { opacity: 0, y: 20 }, // 初始狀態
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: containerDelay, // 容器延遲
      duration: 0.5,
      ease: easeInOutAnimation,
      staggerChildren: staggerAmount, // 子元素交錯延遲
      delayChildren: childrenInitialDelay // 子元素初始延遲
    }
  }
});

// 子項目的淡入並向上移動的動畫變體。
export const fadeInUpItemVariants = {
  initial: { opacity: 0, y: 20 }, // 初始狀態：透明且在下方 20px
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeInOutAnimation
    }
  }
};

// 子項目的原地淡入動畫變體。
export const fadeInItemVariants = {
  initial: { opacity: 0 }, // 初始狀態：透明
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: easeInOutAnimation
    }
  }
};