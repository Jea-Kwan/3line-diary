import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PhotoPicker } from '../components/PhotoPicker';
import { DiaryTextArea } from '../components/DiaryTextArea';
import { deleteEntry, getEntryByDate, saveEntry } from '../db/db';
import { formatKorean } from '../utils/date';

export function EntryEditPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!date) return;
    getEntryByDate(date).then((entry) => {
      if (entry) {
        setText(entry.text);
        setPhoto(entry.photo);
      } else {
        setIsNew(true);
      }
      setLoading(false);
    });
  }, [date]);

  async function handleSave() {
    if (!date) return;
    await saveEntry(date, text, photo);
    navigate(-1);
  }

  async function handleDelete() {
    if (!date) return;
    await deleteEntry(date);
    navigate('/list');
  }

  const hasContent = text.trim() !== '' || !!photo;

  if (loading) return null;

  return (
    <div className="page entry-edit-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <h1>{isNew ? '일기 쓰기' : '일기 수정'}</h1>
        <p className="page-subtitle">{date && formatKorean(date)}</p>
      </header>

      <PhotoPicker photo={photo} onChange={setPhoto} />
      <DiaryTextArea text={text} onChange={setText} />

      <button className="save-button" onClick={handleSave} disabled={!hasContent}>
        저장하기
      </button>
      {!isNew && (
        confirmingDelete ? (
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
        )
      )}
    </div>
  );
}
