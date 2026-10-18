import { useLayoutEffect, useRef } from 'react';
import { DiaryEntry } from '../types';
import { formatKorean } from '../utils/date';

// A5(148×210mm)를 96dpi로 환산한 크기. PDF로 만들 때도 이 크기 그대로 캡처한다.
export const PAGE_W = 559;
export const PAGE_H = 794;
const BASE_FONT = 14.67; // 11pt
const MIN_FONT = 8;

interface Props {
  entry: DiaryEntry;
  photoURL: string | null;
}

export function BookPage({ entry, photoURL }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);

  // 180자를 넘겨 쓴 옛 일기처럼 글이 한 페이지에 안 들어가면 글자 크기를 줄여 맞춘다.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let size = BASE_FONT;
    box.style.fontSize = `${size}px`;
    while (box.scrollHeight > box.clientHeight && size > MIN_FONT) {
      size -= 0.5;
      box.style.fontSize = `${size}px`;
    }
  }, [entry.text]);

  return (
    <section className="book-sheet" style={{ width: PAGE_W, height: PAGE_H }}>
      <div className="book-sheet-photo">
        {photoURL ? <img src={photoURL} alt="" /> : <div className="book-sheet-photo-empty" />}
      </div>
      <div className="book-sheet-date">{formatKorean(entry.date)}</div>
      <div className="book-sheet-textbox" ref={boxRef}>
        <p className="book-sheet-text">{entry.text}</p>
      </div>
    </section>
  );
}
