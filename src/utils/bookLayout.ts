// A5(148×210mm)를 96dpi로 환산한 크기. PDF로 만들 때도 이 크기 그대로 캡처한다.
// index.css의 .book-sheet(padding 45px)와 .book-sheet-textbox(14.67px, line-height 1.8)와 값이 같아야 한다.
export const PAGE_W = 559;
export const PAGE_H = 794;
export const PAGE_PADDING = 45;
export const TEXT_WIDTH = PAGE_W - PAGE_PADDING * 2;
export const BASE_FONT = 14.67; // 11pt
export const LINE_HEIGHT = 1.8;
