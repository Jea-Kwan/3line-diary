import { useEffect, useState } from 'react';
import { DiaryEntry } from '../types';

/** 일기 id별 사진 미리보기 주소. 일기 목록이 바뀌면 이전 주소는 해제한다. */
export function useThumbURLs(entries: DiaryEntry[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.photo) next[entry.id] = URL.createObjectURL(entry.photo);
    }
    setUrls(next);
    return () => Object.values(next).forEach((url) => URL.revokeObjectURL(url));
  }, [entries]);

  return urls;
}
