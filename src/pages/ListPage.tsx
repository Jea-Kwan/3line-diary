import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteEntries, listEntries } from '../db/db';
import { DiaryEntry } from '../types';
import { formatKorean } from '../utils/date';
import { blobToObjectURL } from '../utils/image';
import { matchedLine, matchesQuery, splitByQuery } from '../utils/search';

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitByQuery(text, query).map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <Fragment key={i}>{part.text}</Fragment>
      )}
    </>
  );
}

export function ListPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [thumbURLs, setThumbURLs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listEntries().then((list) => {
      setEntries(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.photo) urls[entry.date] = blobToObjectURL(entry.photo);
    }
    setThumbURLs(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [entries]);

  const visible = useMemo(
    () => entries.filter((entry) => matchesQuery(entry.text, query)),
    [entries, query]
  );
  const selectedVisible = visible.filter((entry) => selected.has(entry.date));
  const allSelected = visible.length > 0 && selectedVisible.length === visible.length;
  const searching = query.trim() !== '';

  function startSelecting() {
    setSelecting(true);
    setSelected(new Set());
    setConfirming(false);
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
    setConfirming(false);
  }

  function toggle(date: string) {
    setConfirming(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleAll() {
    setConfirming(false);
    setSelected(allSelected ? new Set() : new Set(visible.map((entry) => entry.date)));
  }

  async function handleDelete() {
    const dates = selectedVisible.map((entry) => entry.date);
    if (dates.length === 0) return;
    setBusy(true);
    try {
      await deleteEntries(dates);
      const removed = new Set(dates);
      setEntries((prev) => prev.filter((entry) => !removed.has(entry.date)));
      stopSelecting();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className={'page list-page' + (selecting ? ' list-page-selecting' : '')}>
      <header className="page-header list-header">
        <div>
          <h1>내 일기 목록</h1>
          <p className="page-subtitle">
            {searching
              ? `${visible.length}개 검색됨 (전체 ${entries.length}개)`
              : `${entries.length}개의 기록`}
          </p>
        </div>
        {entries.length > 0 &&
          (selecting ? (
            <button className="list-text-button" onClick={stopSelecting}>
              취소
            </button>
          ) : (
            <button className="list-text-button" onClick={startSelecting}>
              선택
            </button>
          ))}
      </header>

      {entries.length > 0 && (
        <div className="list-search">
          <input
            type="search"
            value={query}
            placeholder="일기 내용 검색"
            aria-label="일기 내용 검색"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {selecting && (
        <div className="list-select-bar">
          <button className="list-text-button" onClick={toggleAll} disabled={visible.length === 0}>
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
          <span>{selectedVisible.length}개 선택됨</span>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="empty-message">아직 작성한 일기가 없어요. 오늘 첫 일기를 써보세요!</p>
      ) : visible.length === 0 ? (
        <p className="empty-message">“{query.trim()}”이(가) 들어간 일기가 없어요.</p>
      ) : (
        <ul className="entry-list">
          {visible.map((entry) => {
            const isSelected = selected.has(entry.date);
            return (
              <li
                key={entry.date}
                className={'entry-list-item' + (isSelected ? ' entry-list-item-selected' : '')}
                onClick={() => (selecting ? toggle(entry.date) : navigate(`/entry/${entry.date}`))}
              >
                {selecting && (
                  <input
                    type="checkbox"
                    className="entry-check"
                    checked={isSelected}
                    readOnly
                    aria-label={`${formatKorean(entry.date)} 선택`}
                  />
                )}
                <div className="entry-thumb">
                  {thumbURLs[entry.date] ? (
                    <img src={thumbURLs[entry.date]} alt="" />
                  ) : (
                    <div className="entry-thumb-empty">📔</div>
                  )}
                </div>
                <div className="entry-summary">
                  <div className="entry-date">{formatKorean(entry.date)}</div>
                  <div className="entry-first-line">
                    <Highlight text={matchedLine(entry.text, query) || '(내용 없음)'} query={query} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selecting && (
        <div className="list-action-bar">
          {confirming ? (
            <div className="delete-confirm">
              <p>선택한 {selectedVisible.length}개의 일기를 삭제할까요? 되돌릴 수 없어요.</p>
              <div className="delete-confirm-actions">
                <button
                  className="delete-confirm-cancel"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                >
                  취소
                </button>
                <button className="delete-confirm-ok" onClick={handleDelete} disabled={busy}>
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button
              className="list-delete-button"
              onClick={() => setConfirming(true)}
              disabled={selectedVisible.length === 0}
            >
              선택한 {selectedVisible.length}개 삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}
