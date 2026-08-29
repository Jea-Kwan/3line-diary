import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarPage } from './CalendarPage';
import { deleteEntry, listEntries, saveEntry } from '../db/db';

const LINES: [string, string, string] = ['아침', '점심', '저녁'];

beforeEach(async () => {
  for (const entry of await listEntries()) await deleteEntry(entry.date);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0)); // 2026-08-15
});

afterEach(() => {
  vi.useRealTimers();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/calendar']}>
      <CalendarPage />
    </MemoryRouter>
  );
}

describe('CalendarPage', () => {
  it('이번 달을 열고 기록 개수를 알려준다', async () => {
    await saveEntry('2026-08-03', LINES, null);
    await saveEntry('2026-08-11', LINES, null);
    await saveEntry('2026-07-30', LINES, null); // 지난달은 세지 않는다
    renderPage();

    expect(await screen.findByText('2026년 8월')).toBeDefined();
    expect(screen.getByText('이번 달에 2개의 기록')).toBeDefined();
  });

  it('일기가 있는 날에 표시를 남긴다', async () => {
    await saveEntry('2026-08-03', LINES, null);
    renderPage();

    const marked = await screen.findByLabelText('2026-08-03 일기 있음');
    expect(marked.className).toContain('calendar-cell-has-entry');
    expect(screen.getByLabelText('2026-08-04').className).not.toContain('calendar-cell-has-entry');
  });

  it('아직 오지 않은 날은 누를 수 없다', async () => {
    renderPage();
    await screen.findByText('2026년 8월');

    expect((screen.getByLabelText('2026-08-16') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('2026-08-15') as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText('2026-08-14') as HTMLButtonElement).disabled).toBe(false);
  });

  it('이전 달과 다음 달로 넘길 수 있다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await screen.findByText('2026년 8월');

    await user.click(screen.getByLabelText('이전 달'));
    expect(screen.getByText('2026년 7월')).toBeDefined();

    await user.click(screen.getByLabelText('다음 달'));
    await user.click(screen.getByLabelText('다음 달'));
    expect(screen.getByText('2026년 9월')).toBeDefined();
  });

  it('달 이름을 누르면 이번 달로 돌아온다', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await screen.findByText('2026년 8월');

    await user.click(screen.getByLabelText('이전 달'));
    await user.click(screen.getByText('2026년 7월'));
    expect(screen.getByText('2026년 8월')).toBeDefined();
  });
});
