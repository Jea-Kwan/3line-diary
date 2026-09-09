import { DiaryEntry } from '../types';

export const BACKUP_APP_ID = 'three-line-diary';
export const BACKUP_VERSION = 2;

export interface BackupEntry {
  date: string;
  text: string;
  photo: string | null; // data URL
  createdAt: number;
  updatedAt: number;
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  entries: BackupEntry[];
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('사진을 읽지 못했습니다.'));
    reader.readAsDataURL(blob);
  });
}

export function dataURLToBlob(dataURL: string): Blob {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataURL);
  if (!match) throw new Error('사진 데이터 형식이 올바르지 않습니다.');
  const [, mime, isBase64, payload] = match;
  if (!isBase64) {
    return new Blob([decodeURIComponent(payload)], { type: mime || 'text/plain' });
  }
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime || 'application/octet-stream' });
}

export async function buildBackup(entries: DiaryEntry[], now = new Date()): Promise<BackupFile> {
  const backupEntries: BackupEntry[] = [];
  for (const entry of entries) {
    backupEntries.push({
      date: entry.date,
      text: entry.text,
      photo: entry.photo ? await blobToDataURL(entry.photo) : null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }
  backupEntries.sort((a, b) => a.date.localeCompare(b.date));
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    entries: backupEntries,
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 백업 JSON 문자열을 검증하며 파싱한다. 형식이 어긋나면 한국어 메시지와 함께 throw. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('JSON 파일을 읽을 수 없습니다.');
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('백업 파일 형식이 올바르지 않습니다.');
  }
  const file = raw as Partial<BackupFile>;
  if (file.app !== BACKUP_APP_ID) {
    throw new Error('세줄일기 백업 파일이 아닙니다.');
  }
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    throw new Error('더 최신 버전의 백업 파일입니다. 앱을 업데이트해 주세요.');
  }
  if (!Array.isArray(file.entries)) {
    throw new Error('백업 파일에 일기 목록이 없습니다.');
  }

  const entries: BackupEntry[] = file.entries.map((item, index) => {
    // 예전 백업 파일(버전 1)은 세 줄이 lines 배열로 나뉘어 있었다. 하나로 합쳐서 받아들인다.
    const e = item as Partial<BackupEntry> & { lines?: unknown };
    if (typeof e.date !== 'string' || !DATE_RE.test(e.date)) {
      throw new Error(`${index + 1}번째 일기의 날짜가 올바르지 않습니다.`);
    }
    let text: string;
    if (typeof e.text === 'string') {
      text = e.text;
    } else if (
      Array.isArray(e.lines) &&
      e.lines.length === 3 &&
      e.lines.every((l) => typeof l === 'string')
    ) {
      text = (e.lines as string[]).join('\n');
    } else {
      throw new Error(`${e.date} 일기의 내용이 올바르지 않습니다.`);
    }
    if (e.photo != null && typeof e.photo !== 'string') {
      throw new Error(`${e.date} 일기의 사진 데이터가 올바르지 않습니다.`);
    }
    return {
      date: e.date,
      text,
      photo: e.photo ?? null,
      createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : Date.now(),
    };
  });

  return {
    app: BACKUP_APP_ID,
    version: file.version,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
    entries,
  };
}

export function backupFileName(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `세줄일기-백업-${y}${m}${d}.json`;
}
