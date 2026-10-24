import { useLayoutEffect, useRef } from 'react';
import { DiaryEntry } from '../types';
import { BASE_FONT, PAGE_H, PAGE_W } from '../utils/bookLayout';
import { formatKorean } from '../utils/date';

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
