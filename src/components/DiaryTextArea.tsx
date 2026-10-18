import { useEffect, useRef } from 'react';
import { MAX_CHARS, MAX_LINES, countLines, limitLines } from '../utils/text';

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

  const lines = countLines(text);
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
        onChange={(e) => onChange(limitLines(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && lines >= MAX_LINES) {
            e.preventDefault();
          }
        }}
      />
      <p className={'diary-counter' + (over ? ' diary-counter-over' : full ? ' diary-counter-full' : '')}>
        {text.length} / {MAX_CHARS}자 · {lines} / {MAX_LINES}줄
      </p>
    </div>
  );
}
