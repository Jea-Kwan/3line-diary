import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TodayPage } from './TodayPage';
import { deleteEntry, deleteTopic, listEntries, listTopics, saveEntry, saveTopic } from '../db/db';
import { MAX_PER_DAY } from '../utils/topics';

const TODAY = '2026-08-15';

beforeEach(async () => {
  for (const entry of await listEntries()) await deleteEntry(entry.id);
  for (const topic of await listTopics()) await deleteTopic(topic.id);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <TodayPage />
    </MemoryRouter>
  );
}

function userEv() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

async function writeToday(user: ReturnType<typeof userEv>, text: string, submit: string) {
  await user.type(screen.getByRole('textbox'), text);
  await user.click(screen.getByRole('button', { name: submit }));
}

describe('TodayPage', () => {
  it('처음에는 빈 입력창과 오늘 0 / 3개를 보여준다', async () => {
    renderPage();
    expect(await screen.findByText(`2026년 8월 15일 (토) · 오늘 0 / ${MAX_PER_DAY}개`)).toBeDefined();
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDefined();
    expect(screen.queryByText('오늘 쓴 일기')).toBeNull();
  });

  it('저장하면 입력창이 비워지고 오늘 쓴 일기에 나타난다', async () => {
    const user = userEv();
    renderPage();
    await screen.findByRole('textbox');
    await writeToday(user, '첫 번째 일기', '저장하기');

    expect(await screen.findByText('오늘 쓴 일기')).toBeDefined();
    expect(screen.getByText('첫 번째 일기')).toBeDefined();
    expect(screen.getByText(`2026년 8월 15일 (토) · 오늘 1 / ${MAX_PER_DAY}개`)).toBeDefined();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByRole('button', { name: '일기 추가하기' })).toBeDefined();
    expect(await listEntries()).toHaveLength(1);
  });

  it('주제를 골라 저장하면 일기에 주제가 붙는다', async () => {
    const user = userEv();
    const topic = await saveTopic({ name: '가족', color: '#d97757' });
    renderPage();
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: '가족' }));
    await writeToday(user, '가족 일기', '저장하기');
    await screen.findByText('오늘 쓴 일기');

    const [saved] = await listEntries();
    expect(saved.topicId).toBe(topic.id);
    const card = screen.getByText('가족 일기').closest('li') as HTMLElement;
    expect(within(card).getByText('가족')).toBeDefined();
  });

  it(`하루 ${MAX_PER_DAY}개를 다 쓰면 입력창이 사라지고 안내한다`, async () => {
    const user = userEv();
    renderPage();
    await screen.findByRole('textbox');

    await writeToday(user, '하나', '저장하기');
    await screen.findByRole('button', { name: '일기 추가하기' });
    vi.setSystemTime(new Date(Date.now() + 1000));
    await writeToday(user, '둘', '일기 추가하기');
    await screen.findByText(`2026년 8월 15일 (토) · 오늘 2 / ${MAX_PER_DAY}개`);
    vi.setSystemTime(new Date(Date.now() + 1000));
    await writeToday(user, '셋', '일기 추가하기');

    expect(await screen.findByText(/모두 썼어요/)).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(await listEntries()).toHaveLength(MAX_PER_DAY);
  });

  it('이미 쓴 오늘의 일기들을 불러와서 보여준다 (다른 날 일기는 제외)', async () => {
    await saveEntry({ date: TODAY, topicId: null, text: '오늘 쓴 거', photo: null });
    await saveEntry({ date: '2026-08-14', topicId: null, text: '어제 쓴 거', photo: null });
    renderPage();
    expect(await screen.findByText('오늘 쓴 거')).toBeDefined();
    expect(screen.queryByText('어제 쓴 거')).toBeNull();
  });
});
