import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { jsPDF as JsPDF } from 'jspdf';
import { BookPage } from '../components/BookPage';
import { ChipOption, ChipRow } from '../components/ChipRow';
import { InAppBrowserNotice } from '../components/InAppBrowserNotice';
import { TopicChip } from '../components/TopicChip';
import { useThumbURLs } from '../hooks/useThumbURLs';
import { listEntries, listTopics } from '../db/db';
import { DiaryEntry, Topic } from '../types';
import { PAGE_H, PAGE_W } from '../utils/bookLayout';
import { formatKorean, todayISO } from '../utils/date';
import { downloadBlob } from '../utils/download';
import { isInAppBrowser } from '../utils/inAppBrowser';
import { firstLine } from '../utils/text';
import { NO_TOPIC_COLOR, NO_TOPIC_LABEL, topicMap } from '../utils/topics';

const ALL = 'all';
const NONE = 'none';

function inBook(entry: DiaryEntry, book: string): boolean {
  if (book === ALL) return true;
  if (book === NONE) return entry.topicId === null;
  return entry.topicId === book;
}

function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '일기';
}

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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [book, setBook] = useState(ALL);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const chronological = (list: DiaryEntry[], key: string) =>
    list
      .filter((e) => inBook(e, key))
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  useEffect(() => {
    Promise.all([listEntries(), listTopics()]).then(([list, t]) => {
      // 책은 주제별 한 권이 기본: 가장 최근에 쓴 주제부터 보여준다.
      const latestWithTopic = list.find((e) => e.topicId !== null)?.topicId ?? ALL;
      setEntries(list);
      setTopics(t);
      setBook(latestWithTopic);
      setSelected(new Set(chronological(list, latestWithTopic).map((e) => e.id)));
      setLoading(false);
    });
  }, []);

  function changeBook(key: string) {
    setBook(key);
    setSelected(new Set(chronological(entries, key).map((e) => e.id)));
    setStatus(null);
    setError(null);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const topicsById = useMemo(() => topicMap(topics), [topics]);
  const bookEntries = useMemo(() => chronological([...entries], book), [entries, book]);
  const selectedEntries = bookEntries.filter((e) => selected.has(e.id));
  const photoURLs = useThumbURLs(bookEntries);
  const inApp = isInAppBrowser();

  const bookOptions: ChipOption[] = useMemo(() => {
    const counts = new Map<string | null, number>();
    for (const e of entries) counts.set(e.topicId, (counts.get(e.topicId) ?? 0) + 1);
    const options: ChipOption[] = [];
    for (const t of topics) {
      if (counts.get(t.id)) options.push({ key: t.id, label: t.name, color: t.color, count: counts.get(t.id) });
    }
    if (counts.get(null)) {
      options.push({ key: NONE, label: NO_TOPIC_LABEL, color: NO_TOPIC_COLOR, count: counts.get(null) });
    }
    options.push({ key: ALL, label: '전체', count: entries.length });
    return options;
  }, [entries, topics]);

  const bookLabel =
    book === ALL ? '전체' : book === NONE ? NO_TOPIC_LABEL : (topicsById.get(book)?.name ?? '일기');

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
      downloadBlob(doc.output('blob'), `세줄일기-${safeFileName(bookLabel)}-${todayISO()}.pdf`);
      setStatus(`“${bookLabel}” A5 PDF ${pages.length}페이지를 저장했어요.`);
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
        <p className="page-subtitle">주제를 고르면 그 주제의 일기를 한 권(A5 PDF)으로 만들어요</p>
      </header>

      {entries.length === 0 ? (
        <p className="empty-message">인쇄할 일기가 아직 없어요.</p>
      ) : (
        <>
          <ChipRow options={bookOptions} value={book} onChange={changeBook} ariaLabel="책 주제" />

          <ul className="book-select-list">
            {bookEntries.map((entry) => (
              <li key={entry.id} className="book-select-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggle(entry.id)}
                  />
                  <span className="book-select-date">{formatKorean(entry.date)}</span>
                  {book === ALL && entry.topicId && topicsById.get(entry.topicId) && (
                    <TopicChip topic={topicsById.get(entry.topicId)} />
                  )}
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
              : `“${bookLabel}” ${selectedEntries.length}개 페이지 PDF로 저장`}
          </button>
          {status && <p className="backup-status">{status}</p>}
          {error && <p className="backup-status backup-status-error">{error}</p>}

          <p className="book-preview-label">미리보기 (A5)</p>
          <div className="book-preview-list">
            {selectedEntries.map((entry) => (
              <PagePreview key={entry.id}>
                <BookPage
                  entry={entry}
                  photoURL={photoURLs[entry.id] ?? null}
                  topicLabel={book === ALL && entry.topicId ? topicsById.get(entry.topicId)?.name : undefined}
                />
              </PagePreview>
            ))}
          </div>

          {generating && (
            <div className="book-capture" ref={captureRef} aria-hidden="true">
              {selectedEntries.map((entry) => (
                <BookPage
                  key={entry.id}
                  entry={entry}
                  photoURL={photoURLs[entry.id] ?? null}
                  topicLabel={book === ALL && entry.topicId ? topicsById.get(entry.topicId)?.name : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
