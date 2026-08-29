import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteEntry,
  getEntryByDate,
  importEntries,
  listEntries,
  saveEntry,
} from './db';

const LINES: [string, string, string] = ['아침', '점심', '저녁'];

async function clearAll() {
  for (const entry of await listEntries()) {
    await deleteEntry(entry.date);
  }
}

beforeEach(clearAll);

describe('saveEntry / getEntryByDate', () => {
  it('저장한 일기를 날짜로 다시 읽는다', async () => {
    await saveEntry('2026-08-29', LINES, null);
    const entry = await getEntryByDate('2026-08-29');
    expect(entry?.lines).toEqual(LINES);
    expect(entry?.photo).toBeNull();
    expect(entry?.id).toBeTruthy();
  });

  it('없는 날짜는 undefined다', async () => {
    expect(await getEntryByDate('1999-01-01')).toBeUndefined();
  });

  it('다시 저장해도 id와 최초 작성 시각을 유지한다', async () => {
    const first = await saveEntry('2026-08-29', LINES, null);
    const second = await saveEntry('2026-08-29', ['새', '내용', '이야'], null);
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.updatedAt).toBeGreaterThanOrEqual(first.updatedAt);
    expect(second.lines).toEqual(['새', '내용', '이야']);
  });

  it('사진을 넘기지 않으면 이미 있던 사진을 지우지 않는다', async () => {
    const photo = new Blob(['사진'], { type: 'image/jpeg' });
    await saveEntry('2026-08-29', LINES, photo);
    const updated = await saveEntry('2026-08-29', ['글만', '바꾼다', '사진은 그대로'], null);
    expect(updated.photo).not.toBeNull();
  });

  it('사진을 새로 넘기면 교체한다', async () => {
    await saveEntry('2026-08-29', LINES, new Blob(['옛날'], { type: 'image/jpeg' }));
    const updated = await saveEntry('2026-08-29', LINES, new Blob(['새것'], { type: 'image/jpeg' }));
    expect(await updated.photo!.text()).toBe('새것');
  });
});

describe('listEntries', () => {
  it('최신 날짜가 먼저 오도록 정렬한다', async () => {
    await saveEntry('2026-01-02', LINES, null);
    await saveEntry('2026-08-29', LINES, null);
    await saveEntry('2026-05-10', LINES, null);
    expect((await listEntries()).map((e) => e.date)).toEqual([
      '2026-08-29',
      '2026-05-10',
      '2026-01-02',
    ]);
  });

  it('비어 있으면 빈 배열이다', async () => {
    expect(await listEntries()).toEqual([]);
  });
});

describe('deleteEntry', () => {
  it('해당 날짜만 지운다', async () => {
    await saveEntry('2026-08-28', LINES, null);
    await saveEntry('2026-08-29', LINES, null);
    await deleteEntry('2026-08-29');
    expect(await getEntryByDate('2026-08-29')).toBeUndefined();
    expect(await getEntryByDate('2026-08-28')).toBeDefined();
  });

  it('없는 날짜를 지워도 오류가 나지 않는다', async () => {
    await expect(deleteEntry('1999-01-01')).resolves.toBeUndefined();
  });
});

describe('importEntries', () => {
  function item(date: string, overrides = {}) {
    return {
      date,
      lines: LINES,
      photo: null,
      createdAt: 1000,
      updatedAt: 2000,
      ...overrides,
    };
  }

  it('새로 들어온 일기와 덮어쓴 일기 수를 센다', async () => {
    await saveEntry('2026-08-29', ['원래', '있던', '일기'], null);
    const result = await importEntries([item('2026-08-29'), item('2026-08-30')]);
    expect(result).toEqual({ added: 1, updated: 1 });
  });

  it('덮어쓸 때도 원래 id를 유지한다', async () => {
    const before = await saveEntry('2026-08-29', ['원래', '있던', '일기'], null);
    await importEntries([item('2026-08-29', { lines: ['가져온', '내용', '이다'] })]);
    const after = await getEntryByDate('2026-08-29');
    expect(after?.id).toBe(before.id);
    expect(after?.lines).toEqual(['가져온', '내용', '이다']);
  });

  it('최초 작성 시각은 더 이른 쪽을 남긴다', async () => {
    await saveEntry('2026-08-29', LINES, null); // createdAt = 현재 시각
    await importEntries([item('2026-08-29', { createdAt: 1 })]);
    expect((await getEntryByDate('2026-08-29'))?.createdAt).toBe(1);
  });

  it('사진도 함께 복원한다', async () => {
    await importEntries([item('2026-08-29', { photo: new Blob(['사진'], { type: 'image/jpeg' }) })]);
    const entry = await getEntryByDate('2026-08-29');
    expect(await entry!.photo!.text()).toBe('사진');
  });

  it('빈 목록을 가져와도 아무 일도 없다', async () => {
    await saveEntry('2026-08-29', LINES, null);
    expect(await importEntries([])).toEqual({ added: 0, updated: 0 });
    expect(await listEntries()).toHaveLength(1);
  });
});
