import { useEffect, useState } from 'react';
import { listEntries } from '../db/db';
import { DiaryEntry } from '../types';
import { formatKorean } from '../utils/date';
import { blobToObjectURL } from '../utils/image';

export function BookExportPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEntries().then((list) => {
      const chronological = [...list].sort((a, b) => a.date.localeCompare(b.date));
      setEntries(chronological);
      setSelected(new Set(chronological.map((e) => e.date)));
      setLoading(false);
    });
  }, []);

  function toggle(date: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  const selectedEntries = entries.filter((e) => selected.has(e.date));

  if (loading) return null;

  return (
    <div className="page book-export-page">
      <header className="page-header no-print">
        <h1>책 만들기</h1>
        <p className="page-subtitle">인쇄할 일기를 선택하고 인쇄해서 책으로 묶어보세요</p>
      </header>

      {entries.length === 0 ? (
        <p className="empty-message no-print">인쇄할 일기가 아직 없어요.</p>
      ) : (
        <>
          <ul className="book-select-list no-print">
            {entries.map((entry) => (
              <li key={entry.date} className="book-select-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(entry.date)}
                    onChange={() => toggle(entry.date)}
                  />
                  <span>{formatKorean(entry.date)}</span>
                  <span className="book-select-preview">{entry.lines[0]}</span>
                </label>
              </li>
            ))}
          </ul>

          <button
            className="save-button no-print"
            onClick={() => window.print()}
            disabled={selectedEntries.length === 0}
          >
            선택한 {selectedEntries.length}개 페이지 인쇄/PDF로 저장
          </button>

          <div className="book-print-area">
            {selectedEntries.map((entry) => (
              <section className="book-page" key={entry.date}>
                <div className="book-page-photo">
                  {entry.photo ? (
                    <img src={blobToObjectURL(entry.photo)} alt="" />
                  ) : (
                    <div className="book-page-photo-empty" />
                  )}
                </div>
                <div className="book-page-date">{formatKorean(entry.date)}</div>
                <ol className="book-page-lines">
                  {entry.lines.map((line, i) => (
                    <li key={i}>{line || ' '}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
