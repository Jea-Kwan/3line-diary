import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EntryCard } from '../components/EntryCard';
import { EntryForm, EntryFormValues } from '../components/EntryForm';
import { useThumbURLs } from '../hooks/useThumbURLs';
import { listEntriesByDate, listTopics, saveEntry } from '../db/db';
import { DiaryEntry, Topic } from '../types';
import { todayISO, formatKorean } from '../utils/date';
import { MAX_PER_DAY, topicMap } from '../utils/topics';

export function TodayPage() {
  const date = todayISO();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const thumbURLs = useThumbURLs(entries);

  const load = useCallback(async () => {
    const [t, e] = await Promise.all([listTopics(), listEntriesByDate(date)]);
    setTopics(t);
    setEntries(e);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  async function handleSubmit(values: EntryFormValues) {
    await saveEntry({ date, ...values });
    setFormKey((k) => k + 1);
    setSaved(true);
    await load();
  }

  if (loading) return null;

  const topicsById = topicMap(topics);
  const full = entries.length >= MAX_PER_DAY;

  return (
    <div className="page today-page">
      <header className="page-header">
        <h1>오늘의 세줄일기</h1>
        <p className="page-subtitle">
          {formatKorean(date)} · 오늘 {entries.length} / {MAX_PER_DAY}개
        </p>
      </header>

      {full ? (
        <p className="day-full-notice">
          오늘은 {MAX_PER_DAY}개를 모두 썼어요. 아래에서 일기를 눌러 고칠 수 있어요.
        </p>
      ) : (
        <EntryForm
          key={formKey}
          topics={topics}
          submitLabel={entries.length === 0 ? '저장하기' : '일기 추가하기'}
          onSubmit={handleSubmit}
        />
      )}
      {saved && <p className="backup-status">저장했어요.</p>}

      {entries.length > 0 && (
        <section className="today-entries">
          <h2 className="section-title">오늘 쓴 일기</h2>
          <ul className="entry-list">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                topic={entry.topicId ? topicsById.get(entry.topicId) : undefined}
                thumbURL={thumbURLs[entry.id]}
                onClick={() => navigate(`/entry/${entry.id}`)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
