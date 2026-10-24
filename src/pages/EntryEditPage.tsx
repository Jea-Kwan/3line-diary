import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EntryForm, EntryFormValues } from '../components/EntryForm';
import {
  deleteEntry,
  getEntry,
  listEntriesByDate,
  listTopics,
  saveEntry,
} from '../db/db';
import { DiaryEntry, Topic } from '../types';
import { formatKorean } from '../utils/date';
import { MAX_PER_DAY } from '../utils/topics';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// /entry/:id → 있는 일기 고치기, /new/:date → 그 날짜에 새 일기 쓰기
export function EntryEditPage() {
  const { id, date: newDate } = useParams<{ id: string; date: string }>();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entry, setEntry] = useState<DiaryEntry | undefined>();
  const [dayFull, setDayFull] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isNew = !id;
  const date = entry?.date ?? newDate ?? '';

  useEffect(() => {
    (async () => {
      setTopics(await listTopics());
      if (id) {
        setEntry(await getEntry(id));
      } else if (newDate && DATE_RE.test(newDate)) {
        setDayFull((await listEntriesByDate(newDate)).length >= MAX_PER_DAY);
      }
      setLoading(false);
    })();
  }, [id, newDate]);

  async function handleSubmit(values: EntryFormValues) {
    await saveEntry({ id: entry?.id, date, ...values });
    navigate(-1);
  }

  async function handleDelete() {
    if (!entry) return;
    await deleteEntry(entry.id);
    navigate(-1);
  }

  if (loading) return null;

  const invalid = id ? !entry : !DATE_RE.test(newDate ?? '');
  if (invalid) {
    return (
      <div className="page">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <p className="empty-message">해당 일기를 찾을 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="page entry-edit-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <h1>{isNew ? '일기 쓰기' : '일기 수정'}</h1>
        <p className="page-subtitle">{formatKorean(date)}</p>
      </header>

      {isNew && dayFull ? (
        <p className="day-full-notice">
          이 날은 {MAX_PER_DAY}개를 모두 썼어요. 다른 일기를 고치려면 <Link to="/list">목록</Link>에서
          골라 주세요.
        </p>
      ) : (
        <EntryForm
          topics={topics}
          initial={
            entry ? { topicId: entry.topicId, text: entry.text, photo: entry.photo } : undefined
          }
          submitLabel="저장하기"
          onSubmit={handleSubmit}
        />
      )}

      {!isNew &&
        (confirmingDelete ? (
          <div className="delete-confirm">
            <p>이 일기를 삭제할까요? 되돌릴 수 없어요.</p>
            <div className="delete-confirm-actions">
              <button className="delete-confirm-cancel" onClick={() => setConfirmingDelete(false)}>
                취소
              </button>
              <button className="delete-confirm-ok" onClick={handleDelete}>
                삭제
              </button>
            </div>
          </div>
        ) : (
          <button className="delete-button" onClick={() => setConfirmingDelete(true)}>
            삭제하기
          </button>
        ))}
    </div>
  );
}
