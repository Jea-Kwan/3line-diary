import { useEffect, useRef } from 'react';

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

  return (
    <textarea
      ref={ref}
      className="diary-textarea"
      value={text}
      placeholder="오늘 있었던 일, 느낀 점, 다짐을 자유롭게 적어보세요"
      rows={4}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
