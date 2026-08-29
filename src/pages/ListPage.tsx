import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEntries } from '../db/db';
import { DiaryEntry } from '../types';
import { formatKorean } from '../utils/date';
import { blobToObjectURL } from '../utils/image';

export function ListPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [thumbURLs, setThumbURLs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listEntries().then((list) => {
      setEntries(list);
      const urls: Record<string, string> = {};
      for (const entry of list) {
        if (entry.photo) urls[entry.date] = blobToObjectURL(entry.photo);
      }
      setThumbURLs(urls);
      setLoading(false);
    });
    return () => {
      setThumbURLs((current) => {
        Object.values(current).forEach((url) => URL.revokeObjectURL(url));
        return current;
      });
    };
  }, []);

  if (loading) return null;

  return (
    <div className="page list-page">
      <header className="page-header">
        <h1>내 일기 목록</h1>
        <p className="page-subtitle">{entries.length}개의 기록</p>
      </header>

      {entries.length === 0 ? (
        <p className="empty-message">아직 작성한 일기가 없어요. 오늘 첫 일기를 써보세요!</p>
      ) : (
        <ul className="entry-list">
          {entries.map((entry) => (
            <li
              key={entry.date}
              className="entry-list-item"
              onClick={() => navigate(`/entry/${entry.date}`)}
            >
              <div className="entry-thumb">
                {thumbURLs[entry.date] ? (
                  <img src={thumbURLs[entry.date]} alt="" />
                ) : (
                  <div className="entry-thumb-empty">📔</div>
                )}
              </div>
              <div className="entry-summary">
                <div className="entry-date">{formatKorean(entry.date)}</div>
                <div className="entry-first-line">{entry.lines[0] || '(내용 없음)'}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
