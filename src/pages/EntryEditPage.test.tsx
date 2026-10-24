import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { EntryEditPage } from './EntryEditPage';
import { deleteEntry, deleteTopic, getEntry, listEntries, listTopics, saveEntry, saveTopic } from '../db/db';
import { MAX_PER_DAY } from '../utils/topics';

beforeEach(async () => {
  for (const entry of await listEntries()) await deleteEntry(entry.id);
  for (const topic of await listTopics()) await deleteTopic(topic.id);
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={['/list', path]} initialIndex={1}>
      <Routes>
        <Route path="/list" element={<div>목록 화면</div>} />
        <Route path="/entry/:id" element={<EntryEditPage />} />
        <Route path="/new/:date" element={<EntryEditPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EntryEditPage 수정', () => {
  it('일기 내용과 주제를 불러와서 보여준다', async () => {
    const topic = await saveTopic({ name: '가족', color: '#d97757' });
    const e = await saveEntry({ date: '2026-08-10', topicId: topic.id, text: '옛 내용', photo: null });
    renderAt(`/entry/${e.id}`);

    expect(await screen.findByText('일기 수정')).toBeDefined();
    expect(screen.getByText('2026년 8월 10일 (월)')).toBeDefined();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('옛 내용');
    expect(screen.getByRole('button', { name: '가족' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('고쳐서 저장하면 같은 일기가 갱신되고 이전 화면으로 돌아간다', async () => {
    const e = await saveEntry({ date: '2026-08-10', topicId: null, text: '옛 내용', photo: null });
    renderAt(`/entry/${e.id}`);
    const box = await screen.findByRole('textbox');
    await userEvent.clear(box);
    await userEvent.type(box, '새 내용');
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }));

    expect(await screen.findByText('목록 화면')).toBeDefined();
    expect((await getEntry(e.id))?.text).toBe('새 내용');
    expect(await listEntries()).toHaveLength(1);
  });

  it('주제를 바꿔 저장할 수 있다', async () => {
    const topic = await saveTopic({ name: '운동', color: '#2a9d8f' });
    const e = await saveEntry({ date: '2026-08-10', topicId: null, text: '내용', photo: null });
    renderAt(`/entry/${e.id}`);
    await userEvent.click(await screen.findByRole('button', { name: '운동' }));
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }));
    await screen.findByText('목록 화면');
    expect((await getEntry(e.id))?.topicId).toBe(topic.id);
  });

  it('삭제하기는 앱 안 확인 단계를 거쳐 그 일기만 지운다', async () => {
    const keep = await saveEntry({ date: '2026-08-10', topicId: null, text: '남길 일기', photo: null });
    const gone = await saveEntry({ date: '2026-08-10', topicId: null, text: '지울 일기', photo: null });
    renderAt(`/entry/${gone.id}`);
    await userEvent.click(await screen.findByRole('button', { name: '삭제하기' }));
    expect(screen.getByText('이 일기를 삭제할까요? 되돌릴 수 없어요.')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('목록 화면')).toBeDefined();
    expect((await listEntries()).map((x) => x.id)).toEqual([keep.id]);
  });

  it('없는 일기는 찾을 수 없다고 알려준다', async () => {
    renderAt('/entry/없는-id');
    expect(await screen.findByText('해당 일기를 찾을 수 없어요.')).toBeDefined();
  });
});

describe('EntryEditPage 새 일기 (/new/:date)', () => {
  it('그 날짜로 새 일기를 저장한다', async () => {
    renderAt('/new/2026-08-05');
    expect(await screen.findByText('일기 쓰기')).toBeDefined();
    expect(screen.getByText('2026년 8월 5일 (수)')).toBeDefined();
    await userEvent.type(screen.getByRole('textbox'), '지난 날 일기');
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }));

    await screen.findByText('목록 화면');
    const [saved] = await listEntries();
    expect(saved).toMatchObject({ date: '2026-08-05', text: '지난 날 일기' });
  });

  it(`그 날이 이미 ${MAX_PER_DAY}개면 입력창 대신 안내한다`, async () => {
    for (let i = 0; i < MAX_PER_DAY; i++) {
      await saveEntry({ date: '2026-08-05', topicId: null, text: `${i}`, photo: null });
    }
    renderAt('/new/2026-08-05');
    expect(await screen.findByText(/모두 썼어요/)).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('날짜 형식이 잘못되면 찾을 수 없다고 알려준다', async () => {
    renderAt('/new/abc');
    expect(await screen.findByText('해당 일기를 찾을 수 없어요.')).toBeDefined();
  });
});
