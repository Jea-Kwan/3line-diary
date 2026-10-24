import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPage } from './ListPage';
import { deleteEntry, deleteTopic, listEntries, listTopics, saveEntry, saveTopic } from '../db/db';

function write(date: string, text: string, topicId: string | null = null) {
  return saveEntry({ date, topicId, text, photo: null });
}

let familyId = '';

beforeEach(async () => {
  for (const entry of await listEntries()) await deleteEntry(entry.id);
  for (const topic of await listTopics()) await deleteTopic(topic.id);
  const family = await saveTopic({ name: '가족', color: '#d97757' });
  familyId = family.id;
  await write('2026-08-01', '한강에서 산책했다');
  await write('2026-08-02', '친구와 커피를 마셨다');
  await write('2026-08-03', '집에서 책을 읽었다\n커피도 한 잔', familyId);
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
    expect(screen.getByText('2개 찾음 (전체 3개)')).toBeDefined();
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
    expect(screen.getByText('조건에 맞는 일기가 없어요.')).toBeDefined();
  });
});

describe('ListPage 주제', () => {
  it('주제가 있는 일기에는 주제 이름을 보여준다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    const item = screen.getByText(/집에서 책/).closest('li') as HTMLElement;
    expect(within(item).getByText('가족')).toBeDefined();
    const noTopic = screen.getByText(/한강에서/).closest('li') as HTMLElement;
    expect(within(noTopic).queryByText('가족')).toBeNull();
  });

  it('주제 칩으로 걸러 보고, 개수를 표시한다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    const group = screen.getByRole('group', { name: '주제로 걸러 보기' });
    expect(within(group).getByRole('button', { name: /^전체\s*3$/ })).toBeDefined();

    await userEvent.click(within(group).getByRole('button', { name: /가족/ }));
    expect(screen.getByText('1개 찾음 (전체 3개)')).toBeDefined();
    expect(screen.getByText(/집에서 책/)).toBeDefined();
    expect(screen.queryByText(/한강에서/)).toBeNull();

    await userEvent.click(within(group).getByRole('button', { name: /주제 없음/ }));
    expect(screen.getByText('2개 찾음 (전체 3개)')).toBeDefined();
    expect(screen.queryByText(/집에서 책/)).toBeNull();
  });

  it('주제 걸러 보기와 검색을 함께 쓸 수 있다', async () => {
    renderPage();
    await screen.findByText('3개의 기록');
    const group = screen.getByRole('group', { name: '주제로 걸러 보기' });
    await userEvent.click(within(group).getByRole('button', { name: /주제 없음/ }));
    await userEvent.type(screen.getByLabelText('일기 내용 검색'), '커피');
    expect(screen.getByText('1개 찾음 (전체 3개)')).toBeDefined();
    expect(screen.getByText(/친구와/)).toBeDefined();
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

  it('같은 날 쓴 일기도 하나씩 따로 골라 지울 수 있다', async () => {
    await write('2026-08-03', '같은 날 두 번째');
    renderPage();
    await screen.findByText('4개의 기록');
    await userEvent.click(screen.getByText('선택'));
    const checks = screen.getAllByLabelText('2026년 8월 3일 (월) 선택');
    expect(checks).toHaveLength(2);
    await userEvent.click(checks[0]);
    await userEvent.click(screen.getByText('선택한 1개 삭제'));
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(async () => expect(await listEntries()).toHaveLength(3));
    expect((await listEntries()).filter((e) => e.date === '2026-08-03')).toHaveLength(1);
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
