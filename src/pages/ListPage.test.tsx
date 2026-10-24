import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPage } from './ListPage';
import { deleteEntry, listEntries, saveEntry } from '../db/db';

beforeEach(async () => {
  for (const entry of await listEntries()) await deleteEntry(entry.date);
  await saveEntry('2026-08-01', '한강에서 산책했다', null);
  await saveEntry('2026-08-02', '친구와 커피를 마셨다', null);
  await saveEntry('2026-08-03', '집에서 책을 읽었다\n커피도 한 잔', null);
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/list']}>
      <ListPage />
    </MemoryRouter>
  );
}

describe('ListPage 검색', () => {
  it('검색어가 들어간 일기만 보여주고 개수를 알려준다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');

    await userEvent.type(screen.getByLabelText('일기 내용 검색'), '커피');
    expect(screen.getByText('2개 검색됨 (전체 3개)')).toBeDefined();
    expect(screen.queryByText(/한강에서/)).toBeNull();
    expect(screen.getAllByText('커피', { selector: 'mark' })).toHaveLength(2);
  });

  it('둘째 줄에만 검색어가 있어도 그 줄을 보여준다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    await userEvent.type(screen.getByLabelText('일기 내용 검색'), '한 잔');
    expect(screen.getByText('커피도', { exact: false })).toBeDefined();
    expect(screen.queryByText(/집에서 책/)).toBeNull();
  });

  it('일치하는 일기가 없으면 안내한다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    await userEvent.type(screen.getByLabelText('일기 내용 검색'), '없는말');
    expect(screen.getByText(/없는말.*들어간 일기가 없어요/)).toBeDefined();
  });
});

describe('ListPage 선택 삭제', () => {
  it('두 개 이상을 골라 한꺼번에 삭제한다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');

    await userEvent.click(screen.getByText('선택'));
    await userEvent.click(screen.getByLabelText('2026년 8월 1일 (토) 선택'));
    await userEvent.click(screen.getByLabelText('2026년 8월 3일 (월) 선택'));
    expect(screen.getByText('2개 선택됨')).toBeDefined();

    await userEvent.click(screen.getByText('선택한 2개 삭제'));
    expect(screen.getByText(/선택한 2개의 일기를 삭제할까요/)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(screen.getByText('1개의 기록')).toBeDefined());
    expect((await listEntries()).map((e) => e.date)).toEqual(['2026-08-02']);
    expect(screen.queryByText('선택한 2개 삭제')).toBeNull();
  });

  it('확인 단계에서 취소하면 아무것도 지우지 않는다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    await userEvent.click(screen.getByText('선택'));
    await userEvent.click(screen.getByText('전체 선택'));
    expect(screen.getByText('3개 선택됨')).toBeDefined();

    await userEvent.click(screen.getByText('선택한 3개 삭제'));
    const confirmBox = screen.getByText(/삭제할까요/).closest('.delete-confirm') as HTMLElement;
    await userEvent.click(within(confirmBox).getByRole('button', { name: '취소' }));
    expect(await listEntries()).toHaveLength(3);
    expect(screen.getByText('선택한 3개 삭제')).toBeDefined();
  });

  it('검색 중에는 보이는 일기만 전체 선택·삭제된다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    await userEvent.type(screen.getByLabelText('일기 내용 검색'), '커피');
    await userEvent.click(screen.getByText('선택'));
    await userEvent.click(screen.getByText('전체 선택'));
    expect(screen.getByText('2개 선택됨')).toBeDefined();

    await userEvent.click(screen.getByText('선택한 2개 삭제'));
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(async () => expect(await listEntries()).toHaveLength(1));
    expect((await listEntries())[0].date).toBe('2026-08-01');
  });

  it('선택 모드에서 취소하면 일반 목록으로 돌아간다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    await userEvent.click(screen.getByText('선택'));
    expect(screen.getByText('0개 선택됨')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByText('0개 선택됨')).toBeNull();
    expect(screen.getByText('선택')).toBeDefined();
  });
});
