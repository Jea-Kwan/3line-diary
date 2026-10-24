import { useEffect, useRef } from 'react';
import { MAX_CHARS, MAX_LINES, fitText } from '../utils/text';
import { countVisualLines } from '../utils/visualLines';

interface Props {
  text: string;
  onChange: (text: string) => void;
}

export function DiaryTextArea({ text, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const lines = countVisualLines(text);
  const full = text.length >= MAX_CHARS || lines >= MAX_LINES;
  const over = text.length > MAX_CHARS || lines > MAX_LINES;

  return (
    <div className="diary-field">
      <textarea
        ref={ref}
        className="diary-textarea"
        value={text}
        placeholder="오늘 있었던 일, 느낀 점, 다짐을 자유롭게 적어보세요"
        rows={4}
        maxLength={MAX_CHARS}
        onChange={(e) => {
          // 값이 그대로면 React가 입력창을 이전 글로 되돌린다.
          const fitted = fitText(e.target.value, text);
          if (fitted !== text) onChange(fitted);
        }}
      />
      <div className="diary-meta">
        <span>줄 수는 책(A5 페이지) 기준이에요</span>
        <span className={over ? 'diary-counter-over' : full ? 'diary-counter-full' : ''}>
          {text.length} / {MAX_CHARS}자 · {lines} / {MAX_LINES}줄
        </span>
      </div>
    </div>
  );
}
