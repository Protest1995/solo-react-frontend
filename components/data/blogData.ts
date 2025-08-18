
import { CategoryInfo } from '../../types';

// 定義部落格的分類結構。
// 每個對象代表一個大的分類，可以包含多個子分類鍵。
export const blogCategoryDefinitions: CategoryInfo[] = [
    // 攝影大分類，包含攝影、自然、人像等子分類
    { titleKey: 'blogPage.categoryPhotography', categoryKeys: ['blogPage.categoryPhotography', 'blogPage.categoryNature', 'blogPage.categoryPortraits'], isEditable: true },
    // "一個人的練功房" 大分類，包含此分類和生活風格子分類
    // Solo學習日記
    { titleKey: 'blogPage.categorySoloLearningDiary', categoryKeys: ['blogPage.categorySoloLearningDiary', 'blogPage.categoryLifestyle'], isEditable: true },
    // 工具分享
    { titleKey: 'blogPage.categoryToolSharing', categoryKeys: ['blogPage.categoryToolSharing'], isEditable: true },
];

/**
 * 根據給定的分類鍵（categoryKey），從 `blogCategoryDefinitions` 中查找並返回對應的分類資訊。
 * @param categoryKey - 要查找的分類鍵字符串。
 * @returns {CategoryInfo | null} 如果找到，返回對應的 CategoryInfo 對象；否則返回 null。
 */
export const getCategoryInfoFromKey = (categoryKey: string | undefined): CategoryInfo | null => {
  if (!categoryKey) return null; // 如果沒有提供 key，直接返回 null
  // 遍歷所有定義好的大分類
  for (const def of blogCategoryDefinitions) {
      // 檢查當前大分類的子分類鍵列表中是否包含傳入的 key
      if (def.categoryKeys.includes(categoryKey)) {
          return def; // 如果包含，返回這個大分類的資訊
      }
  }
  return null; // 如果遍歷完都沒找到，返回 null
}
