import { describe, expect, it } from 'vitest';
import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  backupFileName,
  blobToDataURL,
  buildBackup,
  dataURLToBlob,
  parseBackup,
} from './backup';
import { DiaryEntry } from '../types';

function entry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: 'id-1',
    date: '2026-08-29',
    photo: null,
    text: '첫 줄\n둘째 줄\n셋째 줄',
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  };
}

const PHOTO_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

describe('blobToDataURL / dataURLToBlob', () => {
  it('바이트를 그대로 되돌린다', async () => {
    const blob = new Blob([PHOTO_BYTES], { type: 'image/jpeg' });
    const restored = dataURLToBlob(await blobToDataURL(blob));
    expect(restored.type).toBe('image/jpeg');
    expect(new Uint8Array(await restored.arrayBuffer())).toEqual(PHOTO_BYTES);
  });

  it('형식이 아닌 문자열은 거부한다', () => {
    expect(() => dataURLToBlob('그냥 문자열')).toThrow('사진 데이터 형식');
  });
});

describe('buildBackup', () => {
  it('날짜 오름차순으로 정렬한다', async () => {
    const backup = await buildBackup([
      entry({ date: '2026-08-29' }),
      entry({ date: '2026-01-02' }),
      entry({ date: '2026-05-10' }),
    ]);
    expect(backup.entries.map((e) => e.date)).toEqual(['2026-01-02', '2026-05-10', '2026-08-29']);
  });

  it('앱 이름과 버전, 내보낸 시각을 기록한다', async () => {
    const backup = await buildBackup([entry()], new Date('2026-08-29T12:00:00Z'));
    expect(backup.app).toBe(BACKUP_APP_ID);
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportedAt).toBe('2026-08-29T12:00:00.000Z');
  });

  it('사진이 없으면 null로 남긴다', async () => {
    const backup = await buildBackup([entry({ photo: null })]);
    expect(backup.entries[0].photo).toBeNull();
  });

  it('일기가 없으면 빈 목록을 만든다', async () => {
    expect((await buildBackup([])).entries).toEqual([]);
  });
});

describe('내보내기 → 가져오기 왕복', () => {
  it('사진을 포함해 내용이 그대로 보존된다', async () => {
    const original = entry({
      photo: new Blob([PHOTO_BYTES], { type: 'image/jpeg' }),
      text: '비 오는 날\n우산을 잃어버렸다\n내일은 챙기자',
    });

    const parsed = parseBackup(JSON.stringify(await buildBackup([original])));
    expect(parsed.entries).toHaveLength(1);

    const restored = parsed.entries[0];
    expect(restored.date).toBe(original.date);
    expect(restored.text).toBe(original.text);
    expect(restored.createdAt).toBe(original.createdAt);
    expect(restored.updatedAt).toBe(original.updatedAt);

    const photo = dataURLToBlob(restored.photo!);
    expect(new Uint8Array(await photo.arrayBuffer())).toEqual(PHOTO_BYTES);
  });
});

describe('parseBackup 검증', () => {
  function file(overrides: Record<string, unknown> = {}) {
    return JSON.stringify({
      app: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      exportedAt: '2026-08-29T00:00:00.000Z',
      entries: [{ date: '2026-08-29', text: '자유롭게 적은 하루', photo: null }],
      ...overrides,
    });
  }

  it('JSON이 아니면 거부한다', () => {
    expect(() => parseBackup('{ 망가진')).toThrow('JSON 파일을 읽을 수 없습니다.');
  });

  it('다른 앱의 파일을 거부한다', () => {
    expect(() => parseBackup(file({ app: 'other-diary' }))).toThrow('세줄일기 백업 파일이 아닙니다.');
  });

  it('더 최신 버전을 거부한다', () => {
    expect(() => parseBackup(file({ version: BACKUP_VERSION + 1 }))).toThrow('최신 버전');
  });

  it('entries가 배열이 아니면 거부한다', () => {
    expect(() => parseBackup(file({ entries: null }))).toThrow('일기 목록이 없습니다.');
  });

  it('날짜 형식이 틀리면 몇 번째인지 알려준다', () => {
    expect(() => parseBackup(file({ entries: [{ date: '2026/08/29', text: '내용' }] })))
      .toThrow('1번째 일기의 날짜가 올바르지 않습니다.');
  });

  it('내용이 없으면 거부한다', () => {
    expect(() => parseBackup(file({ entries: [{ date: '2026-08-29' }] })))
      .toThrow('일기의 내용이 올바르지 않습니다.');
  });

  it('사진이 문자열이 아니면 거부한다', () => {
    expect(() =>
      parseBackup(file({ entries: [{ date: '2026-08-29', text: '내용', photo: 42 }] }))
    ).toThrow('사진 데이터가 올바르지 않습니다.');
  });

  it('시각 정보가 없으면 채워 넣는다', () => {
    const parsed = parseBackup(file());
    expect(typeof parsed.entries[0].createdAt).toBe('number');
    expect(typeof parsed.entries[0].updatedAt).toBe('number');
  });

  it('예전 버전(1, 세 줄 배열)도 하나의 텍스트로 합쳐서 받아들인다', () => {
    const parsed = parseBackup(
      file({ version: 1, entries: [{ date: '2026-08-29', lines: ['하나', '둘', '셋'] }] })
    );
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].text).toBe('하나\n둘\n셋');
  });
});

describe('backupFileName', () => {
  it('날짜가 들어간 json 이름을 만든다', () => {
    expect(backupFileName(new Date(2026, 7, 9))).toBe('세줄일기-백업-20260809.json');
  });
});
