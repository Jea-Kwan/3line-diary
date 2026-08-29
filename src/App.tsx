import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { TodayPage } from './pages/TodayPage';
import { ListPage } from './pages/ListPage';
import { EntryEditPage } from './pages/EntryEditPage';
import { BookExportPage } from './pages/BookExportPage';

export function App() {
  return (
    <div className="app">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/entry/:date" element={<EntryEditPage />} />
          <Route path="/book" element={<BookExportPage />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
