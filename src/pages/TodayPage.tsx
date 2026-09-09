import { useEffect, useState } from 'react';
import { PhotoPicker } from '../components/PhotoPicker';
import { DiaryTextArea } from '../components/DiaryTextArea';
import { getEntryByDate, saveEntry } from '../db/db';
import { todayISO, formatKorean } from '../utils/date';

export function TodayPage() {
  const date = todayISO();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEntryByDate(date).then((entry) => {
      if (entry) {
        setText(entry.text);
        setPhoto(entry.photo);
      }
      setLoading(false);
    });
  }, [date]);

  useEffect(() => {
    setSaved(false);
  }, [text, photo]);

  async function handleSave() {
    await saveEntry(date, text, photo);
    setSaved(true);
  }

  const hasContent = text.trim() !== '' || !!photo;

  if (loading) return null;

  return (
    <div className="page today-page">
      <header className="page-header">
        <h1>오늘의 세줄일기</h1>
        <p className="page-subtitle">{formatKorean(date)}</p>
      </header>

      <PhotoPicker photo={photo} onChange={setPhoto} />
      <DiaryTextArea text={text} onChange={setText} />

      <button className="save-button" onClick={handleSave} disabled={!hasContent}>
        {saved ? '저장됨 ✓' : '저장하기'}
      </button>
    </div>
  );
}
