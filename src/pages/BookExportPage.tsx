import { useEffect, useRef, useState } from 'react';
import type { jsPDF as JsPDF } from 'jspdf';
import { listEntries } from '../db/db';
import { DiaryEntry } from '../types';
import { formatKorean, todayISO } from '../utils/date';
import { blobToObjectURL } from '../utils/image';
import { firstLine } from '../utils/text';

export function BookExportPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

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

  // 브라우저 인쇄(window.print())는 홈 화면에 설치된 PWA(standalone 모드)에서
  // 인쇄창 자체를 띄우지 못해 눌러도 반응이 없다. 그래서 화면에 보이는 미리보기를
  // 그대로 캡처해 진짜 PDF 파일로 만들어 내려받게 한다 — 어디서든 동일하게 동작한다.
  async function handleGeneratePdf() {
    const container = printAreaRef.current;
    if (!container || selectedEntries.length === 0) return;
    setError(null);
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const pages = Array.from(container.querySelectorAll<HTMLElement>('.book-page'));
      let doc: JsPDF | null = null;
      for (const page of pages) {
        const canvas = await html2canvas(page, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (!doc) {
          doc = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
        } else {
          doc.addPage([canvas.width, canvas.height]);
        }
        doc.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      }
      doc?.save(`세줄일기-책-${todayISO()}.pdf`);
    } catch (err) {
      setError((err as Error).message || 'PDF를 만들지 못했습니다.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return null;

  return (
    <div className="page book-export-page">
      <header className="page-header">
        <h1>책 만들기</h1>
        <p className="page-subtitle">일기를 골라 PDF로 저장하고 책으로 인쇄해보세요</p>
      </header>

      {entries.length === 0 ? (
        <p className="empty-message">인쇄할 일기가 아직 없어요.</p>
      ) : (
        <>
          <ul className="book-select-list">
            {entries.map((entry) => (
              <li key={entry.date} className="book-select-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(entry.date)}
                    onChange={() => toggle(entry.date)}
                  />
                  <span>{formatKorean(entry.date)}</span>
                  <span className="book-select-preview">{firstLine(entry.text)}</span>
                </label>
              </li>
            ))}
          </ul>

          <button
            className="save-button"
            onClick={handleGeneratePdf}
            disabled={selectedEntries.length === 0 || generating}
          >
            {generating
              ? 'PDF 만드는 중...'
              : `선택한 ${selectedEntries.length}개 페이지 PDF로 저장`}
          </button>
          {error && <p className="backup-status backup-status-error">{error}</p>}

          <p className="book-preview-label">미리보기</p>
          <div className="book-print-area" ref={printAreaRef}>
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
                <p className="book-page-text">{entry.text}</p>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
