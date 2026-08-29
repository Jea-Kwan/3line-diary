import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PhotoPicker } from '../components/PhotoPicker';
import { LineInputs } from '../components/LineInputs';
import { deleteEntry, getEntryByDate, saveEntry } from '../db/db';
import { formatKorean } from '../utils/date';

export function EntryEditPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [lines, setLines] = useState<[string, string, string]>(['', '', '']);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!date) return;
    getEntryByDate(date).then((entry) => {
      if (entry) {
        setLines(entry.lines);
        setPhoto(entry.photo);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [date]);

  async function handleSave() {
    if (!date) return;
    await saveEntry(date, lines, photo);
    navigate('/list');
  }

  async function handleDelete() {
    if (!date) return;
    if (!confirm('이 일기를 삭제할까요?')) return;
    await deleteEntry(date);
    navigate('/list');
  }

  if (loading) return null;
  if (notFound) return <div className="page">해당 날짜의 일기를 찾을 수 없어요.</div>;

  return (
    <div className="page entry-edit-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/list')}>
          ← 목록
        </button>
        <h1>일기 수정</h1>
        <p className="page-subtitle">{date && formatKorean(date)}</p>
      </header>

      <PhotoPicker photo={photo} onChange={setPhoto} />
      <LineInputs lines={lines} onChange={setLines} />

      <button className="save-button" onClick={handleSave}>
        저장하기
      </button>
      <button className="delete-button" onClick={handleDelete}>
        삭제하기
      </button>
    </div>
  );
}
