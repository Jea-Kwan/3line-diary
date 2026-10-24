import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { DB_BLOCKED_EVENT, DB_READY_EVENT } from './db/db';
import { TodayPage } from './pages/TodayPage';
import { CalendarPage } from './pages/CalendarPage';
import { ListPage } from './pages/ListPage';
import { EntryEditPage } from './pages/EntryEditPage';
import { BookExportPage } from './pages/BookExportPage';
import { BackupPage } from './pages/BackupPage';
import { TopicsPage } from './pages/TopicsPage';

export function App() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const onBlocked = () => setBlocked(true);
    const onReady = () => setBlocked(false);
    window.addEventListener(DB_BLOCKED_EVENT, onBlocked);
    window.addEventListener(DB_READY_EVENT, onReady);
    return () => {
      window.removeEventListener(DB_BLOCKED_EVENT, onBlocked);
      window.removeEventListener(DB_READY_EVENT, onReady);
    };
  }, []);

  return (
    <div className="app">
      <main className="app-content">
        {blocked && (
          <p className="update-blocked-banner" role="alert">
            새 버전으로 바꾸는 중인데, 다른 창에서 세줄일기가 열려 있어 멈춰 있어요. 크롬 탭이나
            다른 세줄일기 창을 모두 닫으면 이어서 진행돼요. 일기는 지워지지 않아요.
          </p>
        )}
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/entry/:id" element={<EntryEditPage />} />
          <Route path="/new/:date" element={<EntryEditPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/book" element={<BookExportPage />} />
          <Route path="/backup" element={<BackupPage />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
