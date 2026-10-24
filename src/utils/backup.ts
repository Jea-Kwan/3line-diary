import { DiaryEntry, Topic } from '../types';

export const BACKUP_APP_ID = 'three-line-diary';
// 1: 세 칸(lines) / 2: 자유 서술(text) / 3: 하루 여러 개 + 주제(topics, id, topicId)
export const BACKUP_VERSION = 3;

export interface BackupTopic {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface BackupEntry {
  id?: string; // 버전 2 이하 백업에는 없다
  date: string;
  topicId: string | null;
  text: string;
  photo: string | null; // data URL
  createdAt: number;
  updatedAt: number;
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  topics: BackupTopic[];
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

export async function buildBackup(
  entries: DiaryEntry[],
  topics: Topic[],
  now = new Date()
): Promise<BackupFile> {
  const backupEntries: BackupEntry[] = [];
  for (const entry of entries) {
    backupEntries.push({
      id: entry.id,
      date: entry.date,
      topicId: entry.topicId,
      text: entry.text,
      photo: entry.photo ? await blobToDataURL(entry.photo) : null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }
  backupEntries.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    topics: topics.map(({ id, name, color, createdAt }) => ({ id, name, color, createdAt })),
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

  // 버전 2 이하 백업에는 주제가 없다.
  const rawTopics: unknown[] = file.topics === undefined ? [] : file.topics;
  if (!Array.isArray(rawTopics)) {
    throw new Error('백업 파일의 주제 목록이 올바르지 않습니다.');
  }
  const topics: BackupTopic[] = rawTopics.map((item, index) => {
    const t = item as Partial<BackupTopic>;
    if (typeof t.id !== 'string' || typeof t.name !== 'string' || t.name.trim() === '') {
      throw new Error(`${index + 1}번째 주제 정보가 올바르지 않습니다.`);
    }
    return {
      id: t.id,
      name: t.name,
      color: typeof t.color === 'string' ? t.color : '#8a8378',
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
    };
  });

  const entries: BackupEntry[] = file.entries.map((item, index) => {
    // 버전 1 백업은 세 줄이 lines 배열로 나뉘어 있었다. 하나로 합쳐서 받아들인다.
    const e = item as Partial<BackupEntry> & { lines?: unknown };
    if (typeof e.date !== 'string' || !DATE_RE.test(e.date)) {
      throw new Error(`${index + 1}번째 일기의 날짜가 올바르지 않습니다.`);
    }
    let entryText: string;
    if (typeof e.text === 'string') {
      entryText = e.text;
    } else if (
      Array.isArray(e.lines) &&
      e.lines.length === 3 &&
      e.lines.every((l) => typeof l === 'string')
    ) {
      entryText = (e.lines as string[]).join('\n');
    } else {
      throw new Error(`${e.date} 일기의 내용이 올바르지 않습니다.`);
    }
    if (e.photo != null && typeof e.photo !== 'string') {
      throw new Error(`${e.date} 일기의 사진 데이터가 올바르지 않습니다.`);
    }
    return {
      id: typeof e.id === 'string' ? e.id : undefined,
      date: e.date,
      topicId: typeof e.topicId === 'string' ? e.topicId : null,
      text: entryText,
      photo: e.photo ?? null,
      createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : Date.now(),
    };
  });

  return {
    app: BACKUP_APP_ID,
    version: file.version,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
    topics,
    entries,
  };
}

/** 가져오면 기존 일기를 덮어쓰게 될 백업 일기의 수 (db.importData의 짝짓기 규칙과 같다). */
export function countOverwrites(items: BackupEntry[], existing: DiaryEntry[]): number {
  return items.filter((item) =>
    item.id
      ? existing.some((e) => e.id === item.id)
      : existing.some((e) => e.date === item.date && e.topicId === null)
  ).length;
}

export function backupFileName(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `세줄일기-백업-${y}${m}${d}.json`;
}
