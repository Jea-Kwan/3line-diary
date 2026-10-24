import { openDB } from 'idb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DB_NAME = 'three-line-diary';

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

// v1: 키가 날짜(하루 1개), 레코드는 text 또는 세 칸 시절의 lines
async function createV1Database(records: unknown[]) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(d) {
      const store = d.createObjectStore('entries', { keyPath: 'date' });
      store.createIndex('by-date', 'date');
    },
  });
  for (const r of records) await db.put('entries', r as never);
  db.close();
}

describe('v1 → v2 저장소 변환', () => {
  beforeEach(async () => {
    // db.ts가 열어 둔 연결과 캐시를 버리고 처음부터 시작한다.
    vi.resetModules();
    await deleteDatabase();
  });

  it('옛 일기를 하나도 잃지 않고 새 구조(주제 없음)로 옮긴다', async () => {
    await createV1Database([
      { id: 'a', date: '2026-10-20', photo: new Blob(['사진'], { type: 'image/jpeg' }), text: '자유 서술', createdAt: 1000, updatedAt: 1500 },
      { id: 'b', date: '2026-10-21', photo: null, lines: ['세 칸', '입력 시절', '일기'], createdAt: 2000, updatedAt: 2000 },
    ]);

    const { listEntries, listTopics } = await import('./db');
    const entries = await listEntries();

    expect(entries).toHaveLength(2);
    const [newer, older] = entries;
    expect(newer).toMatchObject({ id: 'b', date: '2026-10-21', topicId: null, text: '세 칸\n입력 시절\n일기', createdAt: 2000 });
    expect(older).toMatchObject({ id: 'a', date: '2026-10-20', topicId: null, text: '자유 서술', createdAt: 1000, updatedAt: 1500 });
    expect(await older.photo!.text()).toBe('사진');
    expect(await listTopics()).toEqual([]);
  });

  it('변환 뒤에는 같은 날 일기를 더 쓸 수 있다', async () => {
    await createV1Database([{ id: 'a', date: '2026-10-20', photo: null, text: '옛 일기', createdAt: 1, updatedAt: 1 }]);
    const { saveEntry, listEntriesByDate } = await import('./db');
    await saveEntry({ date: '2026-10-20', topicId: null, text: '같은 날 두 번째', photo: null });
    expect((await listEntriesByDate('2026-10-20')).map((e) => e.text).sort()).toEqual(['같은 날 두 번째', '옛 일기']);
  });

  it('기록이 없는 처음 설치도 정상적으로 열린다', async () => {
    const { listEntries, listTopics, saveEntry } = await import('./db');
    expect(await listEntries()).toEqual([]);
    expect(await listTopics()).toEqual([]);
    await expect(saveEntry({ date: '2026-10-20', topicId: null, text: '첫 일기', photo: null })).resolves.toBeDefined();
  });

  it('옛 창이 연결을 열어 둔 채면 막힘을 알리고, 그 창이 닫히면 이어서 변환한다', async () => {
    const oldDb = await openDB(DB_NAME, 1, {
      upgrade(d) {
        const store = d.createObjectStore('entries', { keyPath: 'date' });
        store.createIndex('by-date', 'date');
      },
    });
    await oldDb.put('entries', { id: 'a', date: '2026-10-20', photo: null, text: '옛 일기', createdAt: 1, updatedAt: 1 });

    const events: string[] = [];
    const onBlocked = () => events.push('blocked');
    const onReady = () => events.push('ready');
    window.addEventListener('diary-db-blocked', onBlocked);
    window.addEventListener('diary-db-ready', onReady);

    try {
      const { listEntries } = await import('./db');
      const pending = listEntries();
      await new Promise((r) => setTimeout(r, 50));
      expect(events).toEqual(['blocked']);

      oldDb.close();
      const entries = await pending;
      expect(entries.map((e) => e.id)).toEqual(['a']);
      expect(entries[0].text).toBe('옛 일기');
      expect(events).toEqual(['blocked', 'ready']);
    } finally {
      window.removeEventListener('diary-db-blocked', onBlocked);
      window.removeEventListener('diary-db-ready', onReady);
    }
  });

  it('id가 없던 아주 옛 레코드에도 id를 붙여 준다', async () => {
    await createV1Database([{ date: '2026-10-20', photo: null, lines: ['가', '나', '다'], createdAt: 1, updatedAt: 1 }]);
    const { listEntries } = await import('./db');
    const [entry] = await listEntries();
    expect(entry.id).toBeTruthy();
    expect(entry.text).toBe('가\n나\n다');
  });
});
