import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEntries } from '../db/db';
import { DiaryEntry } from '../types';
import { todayISO } from '../utils/date';
import {
  addMonths,
  buildMonthGrid,
  currentYearMonth,
  monthLabel,
  WEEKDAY_LABELS,
  YearMonth,
} from '../utils/calendar';

export function CalendarPage() {
  const [cursor, setCursor] = useState<YearMonth>(() => currentYearMonth());
  const [entries, setEntries] = useState<Map<string, DiaryEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const today = todayISO();

  useEffect(() => {
    listEntries().then((list) => {
      setEntries(new Map(list.map((e) => [e.date, e])));
      setLoading(false);
    });
  }, []);

  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const monthCount = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.month).padStart(2, '0')}`;
    return [...entries.keys()].filter((d) => d.startsWith(prefix)).length;
  }, [entries, cursor]);

  if (loading) return null;

  return (
    <div className="page calendar-page">
      <header className="page-header">
        <h1>달력</h1>
        <p className="page-subtitle">이번 달에 {monthCount}개의 기록</p>
      </header>

      <div className="calendar-nav">
        <button
          type="button"
          className="calendar-nav-button"
          aria-label="이전 달"
          onClick={() => setCursor((c) => addMonths(c, -1))}
        >
          ‹
        </button>
        <button
          type="button"
          className="calendar-nav-label"
          onClick={() => setCursor(currentYearMonth())}
        >
          {monthLabel(cursor)}
        </button>
        <button
          type="button"
          className="calendar-nav-button"
          aria-label="다음 달"
          onClick={() => setCursor((c) => addMonths(c, 1))}
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {weeks.flat().map((cell) => {
          const entry = entries.get(cell.date);
          const isFuture = cell.date > today;
          const classes = ['calendar-cell'];
          if (!cell.inMonth) classes.push('calendar-cell-outside');
          if (cell.date === today) classes.push('calendar-cell-today');
          if (entry) classes.push('calendar-cell-has-entry');

          return (
            <button
              key={cell.date}
              type="button"
              className={classes.join(' ')}
              disabled={isFuture}
              aria-label={`${cell.date}${entry ? ' 일기 있음' : ''}`}
              onClick={() => navigate(`/entry/${cell.date}`)}
            >
              <span className="calendar-day">{cell.day}</span>
              <span className="calendar-dot">{entry ? '•' : ''}</span>
            </button>
          );
        })}
      </div>

      <p className="calendar-hint">날짜를 눌러 그날의 일기를 쓰거나 고칠 수 있어요.</p>
    </div>
  );
}
