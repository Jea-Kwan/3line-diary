import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { DB_BLOCKED_EVENT, DB_READY_EVENT } from './db/db';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/backup']}>
      <App />
    </MemoryRouter>
  );
}

describe('App 업데이트 막힘 안내', () => {
  it('평소에는 안내를 보여주지 않는다', async () => {
    renderApp();
    await screen.findByText('백업');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('다른 창 때문에 업그레이드가 막히면 안내하고, 풀리면 사라진다', async () => {
    renderApp();
    await screen.findByText('백업');

    act(() => {
      window.dispatchEvent(new Event(DB_BLOCKED_EVENT));
    });
    expect(screen.getByRole('alert').textContent).toContain('다른 창에서 세줄일기가 열려 있어');

    act(() => {
      window.dispatchEvent(new Event(DB_READY_EVENT));
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('주제 관리 화면 경로가 연결되어 있다', async () => {
    render(
      <MemoryRouter initialEntries={['/topics']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('주제 관리')).toBeDefined();
  });

  it('새 일기 경로(/new/:date)가 연결되어 있다', async () => {
    render(
      <MemoryRouter initialEntries={['/new/2026-08-05']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('일기 쓰기')).toBeDefined();
  });
});
