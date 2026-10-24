import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { jsPDF as JsPDF } from 'jspdf';
import { BookPage } from '../components/BookPage';
import { InAppBrowserNotice } from '../components/InAppBrowserNotice';
import { listEntries } from '../db/db';
import { DiaryEntry } from '../types';
import { PAGE_H, PAGE_W } from '../utils/bookLayout';
import { formatKorean, todayISO } from '../utils/date';
import { downloadBlob } from '../utils/download';
import { isInAppBrowser } from '../utils/inAppBrowser';
import { firstLine } from '../utils/text';

// 화면 폭에 맞춰 A5 페이지를 축소해서 보여주는 미리보기 틀
function PagePreview({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PAGE_W);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="book-preview-frame" style={{ height: PAGE_H * scale }}>
      <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

export function BookExportPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [photoURLs, setPhotoURLs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let urls: Record<string, string> = {};
    listEntries().then((list) => {
      const chronological = [...list].sort((a, b) => a.date.localeCompare(b.date));
      for (const entry of chronological) {
        if (entry.photo) urls[entry.date] = URL.createObjectURL(entry.photo);
      }
      setPhotoURLs(urls);
      setEntries(chronological);
      setSelected(new Set(chronological.map((e) => e.date)));
      setLoading(false);
    });
    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
      urls = {};
    };
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
  const inApp = isInAppBrowser();

  // 미리보기는 화면에 맞춰 축소되어 있으므로, 캡처는 축소되지 않은 A5 크기 페이지를
  // 화면 밖에 따로 그려서 한다. 브라우저 인쇄(window.print())는 설치형 앱에서
  // 동작하지 않아, 캡처한 이미지로 진짜 PDF 파일을 만들어 내려받는다.
  async function handleGeneratePdf() {
    if (selectedEntries.length === 0) return;
    setError(null);
    setStatus(null);
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      // 화면 밖 페이지가 그려지고 글자 크기 맞춤이 끝날 때까지 기다린다.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const container = captureRef.current;
      if (!container) return;
      const images = Array.from(container.querySelectorAll('img'));
      await Promise.all(images.map((img) => img.decode().catch(() => undefined)));

      const pages = Array.from(container.querySelectorAll<HTMLElement>('.book-sheet'));
      let doc: JsPDF | null = null;
      for (const page of pages) {
        const canvas = await html2canvas(page, { scale: 2.25, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (!doc) {
          doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
        } else {
          doc.addPage('a5', 'portrait');
        }
        doc.addImage(imgData, 'JPEG', 0, 0, 148, 210);
      }
      if (!doc) return;
      // jsPDF의 save()는 만든 blob URL을 곧바로 해제해서, 느린 모바일
      // 환경에서는 "내려받는 중" 표시만 뜨고 실제 파일은 저장되지 않는 경우가 있다.
      // blob을 직접 꺼내 지연 해제되는 downloadBlob으로 내려받는다.
      downloadBlob(doc.output('blob'), `세줄일기-책-${todayISO()}.pdf`);
      setStatus(`A5 PDF ${pages.length}페이지를 저장했어요.`);
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
        <p className="page-subtitle">일기를 골라 A5 PDF로 저장하고 책으로 인쇄해보세요</p>
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
                  <span className="book-select-date">{formatKorean(entry.date)}</span>
                  <span className="book-select-preview">{firstLine(entry.text)}</span>
                </label>
              </li>
            ))}
          </ul>

          <InAppBrowserNotice />
          <button
            className="save-button"
            onClick={handleGeneratePdf}
            disabled={selectedEntries.length === 0 || generating || inApp}
          >
            {generating
              ? 'PDF 만드는 중...'
              : `선택한 ${selectedEntries.length}개 페이지 PDF로 저장`}
          </button>
          {status && <p className="backup-status">{status}</p>}
          {error && <p className="backup-status backup-status-error">{error}</p>}

          <p className="book-preview-label">미리보기 (A5)</p>
          <div className="book-preview-list">
            {selectedEntries.map((entry) => (
              <PagePreview key={entry.date}>
                <BookPage entry={entry} photoURL={photoURLs[entry.date] ?? null} />
              </PagePreview>
            ))}
          </div>

          {generating && (
            <div className="book-capture" ref={captureRef} aria-hidden="true">
              {selectedEntries.map((entry) => (
                <BookPage key={entry.date} entry={entry} photoURL={photoURLs[entry.date] ?? null} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
