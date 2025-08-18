/**
 * 從字串中移除 Markdown 和 HTML 格式，返回純文字。
 * @param markdown 包含 Markdown 和/或 HTML 的字串。
 * @returns 純文字字串。
 */
export const stripMarkdown = (markdown: string): string => {
  if (!markdown) {
    return '';
  }

  let plainText = markdown;

  // 步驟 1: 移除 HTML 標籤
  // 這個正則表達式會移除所有 <...> 形式的標籤，包括帶有屬性的標籤。
  plainText = plainText.replace(/<\/?[^>]+(>|$)/g, ' ');

  // 步驟 2: 移除 Markdown 語法
  // 圖片: ![alt text](url) -> 移除整個圖片標記
  plainText = plainText.replace(/!\[.*?\]\(.*?\)/g, '');
  // 連結: [link text](url) -> 只保留 link text
  plainText = plainText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  // 標題: #, ##, 等 -> 移除標題符號
  plainText = plainText.replace(/^#{1,6}\s+/gm, '');
  // 粗體: **text** 或 __text__ -> 只保留 text
  plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, '$2');
  // 斜體: *text* 或 _text_ -> 只保留 text
  plainText = plainText.replace(/(\*|_)(.*?)\1/g, '$2');
  // 刪除線: ~~text~~ -> 只保留 text
  plainText = plainText.replace(/~~(.*?)~~/g, '$1');
  // 引用區塊: > text -> 移除引用符號
  plainText = plainText.replace(/^>\s?/gm, '');
  // 無序列表: *, -, + -> 移除列表符號
  plainText = plainText.replace(/^[\s\t]*(\*|-|\+)\s+/gm, '');
  // 有序列表: 1., 2., 等 -> 移除數字列表符號
  plainText = plainText.replace(/^\s*\d+\.\s+/gm, '');
  // 分隔線: ---, ***, ___ -> 移除整行
  plainText = plainText.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '');
  // 程式碼區塊: ```...``` -> 移除整個程式碼區塊
  plainText = plainText.replace(/```[\s\S]*?```/g, '');
  // 行內程式碼: `code` -> 只保留 code
  plainText = plainText.replace(/`([^`]+)`/g, '$1');

  // 步驟 3: 清理空白字元
  // 將多個換行符替換為單個空格
  plainText = plainText.replace(/\n+/g, ' ');
  // 將多個空格替換為單個空格，並移除頭尾的空白
  plainText = plainText.replace(/\s+/g, ' ').trim();

  return plainText;
};