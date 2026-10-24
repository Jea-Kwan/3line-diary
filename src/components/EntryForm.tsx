import { useState } from 'react';
import { Topic } from '../types';
import { DiaryTextArea } from './DiaryTextArea';
import { PhotoPicker } from './PhotoPicker';
import { TopicPicker } from './TopicPicker';

export interface EntryFormValues {
  topicId: string | null;
  text: string;
  photo: Blob | null;
}

interface Props {
  topics: Topic[];
  initial?: Partial<EntryFormValues>;
  submitLabel: string;
  onSubmit: (values: EntryFormValues) => Promise<void>;
}

export function EntryForm({ topics, initial, submitLabel, onSubmit }: Props) {
  const [topicId, setTopicId] = useState<string | null>(initial?.topicId ?? null);
  const [text, setText] = useState(initial?.text ?? '');
  const [photo, setPhoto] = useState<Blob | null>(initial?.photo ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasContent = text.trim() !== '' || !!photo;

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ topicId, text, photo });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopicPicker topics={topics} value={topicId} onChange={setTopicId} />
      <PhotoPicker photo={photo} onChange={setPhoto} />
      <DiaryTextArea text={text} onChange={setText} />
      {error && <p className="backup-status backup-status-error">{error}</p>}
      <button className="save-button" onClick={handleSubmit} disabled={!hasContent || busy}>
        {submitLabel}
      </button>
    </>
  );
}
