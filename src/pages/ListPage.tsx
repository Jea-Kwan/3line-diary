import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChipRow, ChipOption } from '../components/ChipRow';
import { TopicChip } from '../components/TopicChip';
import { useThumbURLs } from '../hooks/useThumbURLs';
import { deleteEntries, listEntries, listTopics } from '../db/db';
import { DiaryEntry, Topic } from '../types';
import { formatKorean } from '../utils/date';
import { matchedLine, matchesQuery, splitByQuery } from '../utils/search';
import { NO_TOPIC_COLOR, NO_TOPIC_LABEL, topicMap } from '../utils/topics';

const ALL = 'all';
const NONE = 'none';

function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitByQuery(text, query).map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <Fragment key={i}>{part.text}</Fragment>
      )}
    </>
  );
}

function inTopic(entry: DiaryEntry, filter: string): boolean {
  if (filter === ALL) return true;
  if (filter === NONE) return entry.topicId === null;
  return entry.topicId === filter;
}

export function ListPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(ALL);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const thumbURLs = useThumbURLs(entries);

  useEffect(() => {
    Promise.all([listEntries(), listTopics()]).then(([e, t]) => {
      setEntries(e);
      setTopics(t);
      setLoading(false);
    });
  }, []);

  const topicsById = useMemo(() => topicMap(topics), [topics]);
  const visible = useMemo(
    () => entries.filter((e) => inTopic(e, filter) && matchesQuery(e.text, query)),
    [entries, filter, query]
  );
  const selectedVisible = visible.filter((e) => selected.has(e.id));
  const allSelected = visible.length > 0 && selectedVisible.length === visible.length;
  const searching = query.trim() !== '' || filter !== ALL;

  const filterOptions: ChipOption[] = useMemo(() => {
    const counts = new Map<string | null, number>();
    for (const e of entries) counts.set(e.topicId, (counts.get(e.topicId) ?? 0) + 1);
    const options: ChipOption[] = [{ key: ALL, label: '전체', count: entries.length }];
    for (const t of topics) options.push({ key: t.id, label: t.name, color: t.color, count: counts.get(t.id) ?? 0 });
    if (counts.get(null)) {
      options.push({ key: NONE, label: NO_TOPIC_LABEL, color: NO_TOPIC_COLOR, count: counts.get(null) });
    }
    return options;
  }, [entries, topics]);

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

  function toggle(id: string) {
    setConfirming(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setConfirming(false);
    setSelected(allSelected ? new Set() : new Set(visible.map((e) => e.id)));
  }

  async function handleDelete() {
    const ids = selectedVisible.map((e) => e.id);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      await deleteEntries(ids);
      const removed = new Set(ids);
      setEntries((prev) => prev.filter((e) => !removed.has(e.id)));
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
              ? `${visible.length}개 찾음 (전체 ${entries.length}개)`
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
        <>
          <div className="list-search">
            <input
              type="search"
              value={query}
              placeholder="일기 내용 검색"
              aria-label="일기 내용 검색"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filterOptions.length > 1 && (
            <ChipRow
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              ariaLabel="주제로 걸러 보기"
            />
          )}
        </>
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
        <p className="empty-message">조건에 맞는 일기가 없어요.</p>
      ) : (
        <ul className="entry-list">
          {visible.map((entry) => {
            const isSelected = selected.has(entry.id);
            const topic = entry.topicId ? topicsById.get(entry.topicId) : undefined;
            return (
              <li
                key={entry.id}
                className={'entry-list-item' + (isSelected ? ' entry-list-item-selected' : '')}
                onClick={() => (selecting ? toggle(entry.id) : navigate(`/entry/${entry.id}`))}
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
                  {thumbURLs[entry.id] ? (
                    <img src={thumbURLs[entry.id]} alt="" />
                  ) : (
                    <div className="entry-thumb-empty">📔</div>
                  )}
                </div>
                <div className="entry-summary">
                  <div className="entry-date">
                    <span className="entry-date-text">{formatKorean(entry.date)}</span>
                    {topic && <TopicChip topic={topic} />}
                  </div>
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
