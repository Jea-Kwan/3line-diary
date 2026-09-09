import { useEffect, useRef, useState } from 'react';
import { importEntries, listEntries } from '../db/db';
import { DiaryEntry } from '../types';
import {
  BackupFile,
  backupFileName,
  buildBackup,
  dataURLToBlob,
  parseBackup,
} from '../utils/backup';

type Status = { kind: 'ok' | 'error'; message: string } | null;
type PendingImport = { backup: BackupFile; overwrites: number };

export function BackupPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reload() {
    return listEntries().then((list) => {
      setEntries(list);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleExport() {
    setBusy(true);
    setStatus(null);
    try {
      const backup = await buildBackup(entries);
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName();
      // iOS 사파리는 링크가 문서에 붙어 있어야 내려받는다.
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 곧바로 해제하면 내려받기가 시작되기 전에 끊길 수 있다.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus({ kind: 'ok', message: `${backup.entries.length}개의 일기를 내보냈어요.` });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setStatus(null);
    try {
      const backup = parseBackup(await file.text());
      const existing = new Set(entries.map((entry) => entry.date));
      const overwrites = backup.entries.filter((entry) => existing.has(entry.date)).length;
      setPendingImport({ backup, overwrites });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  }

  async function confirmImport() {
    if (!pendingImport) return;
    const { backup } = pendingImport;
    setBusy(true);
    try {
      const result = await importEntries(
        backup.entries.map((entry) => ({
          date: entry.date,
          text: entry.text,
          photo: entry.photo ? dataURLToBlob(entry.photo) : null,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }))
      );
      await reload();
      setStatus({
        kind: 'ok',
        message: `새 일기 ${result.added}개, 덮어쓴 일기 ${result.updated}개를 가져왔어요.`,
      });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
      setPendingImport(null);
    }
  }

  if (loading) return null;

  return (
    <div className="page backup-page">
      <header className="page-header">
        <h1>백업</h1>
        <p className="page-subtitle">일기 {entries.length}개가 이 기기에 저장되어 있어요</p>
      </header>

      <section className="backup-section">
        <h2>내보내기</h2>
        <p className="backup-desc">
          사진까지 포함해 JSON 파일 하나로 저장합니다. 기기를 바꾸거나 앱 데이터를 지우기 전에
          받아두세요.
        </p>
        <button
          className="save-button"
          onClick={handleExport}
          disabled={busy || entries.length === 0}
        >
          백업 파일 내려받기
        </button>
      </section>

      <section className="backup-section">
        <h2>가져오기</h2>
        <p className="backup-desc">
          백업 파일을 불러옵니다. 같은 날짜의 일기가 이미 있으면 파일 쪽 내용으로 덮어씁니다.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          hidden
        />
        <button className="delete-button" onClick={() => fileRef.current?.click()} disabled={busy}>
          백업 파일 불러오기
        </button>

        {pendingImport && (
          <div className="delete-confirm">
            <p>
              {pendingImport.overwrites > 0
                ? `일기 ${pendingImport.backup.entries.length}개를 가져옵니다. 그중 ${pendingImport.overwrites}개는 이미 있는 날짜라 덮어써집니다. 계속할까요?`
                : `일기 ${pendingImport.backup.entries.length}개를 가져올까요?`}
            </p>
            <div className="delete-confirm-actions">
              <button
                className="delete-confirm-cancel"
                onClick={() => setPendingImport(null)}
                disabled={busy}
              >
                취소
              </button>
              <button className="delete-confirm-ok" onClick={confirmImport} disabled={busy}>
                가져오기
              </button>
            </div>
          </div>
        )}
      </section>

      {status && (
        <p className={status.kind === 'ok' ? 'backup-status' : 'backup-status backup-status-error'}>
          {status.message}
        </p>
      )}

      <p className="backup-note">
        일기는 이 브라우저 안에만 저장됩니다. 브라우저 데이터를 지우면 함께 사라지니 가끔 백업해
        주세요.
      </p>
    </div>
  );
}
