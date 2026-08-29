import { toISO } from './date';

export interface CalendarCell {
  date: string; // "YYYY-MM-DD"
  day: number;
  inMonth: boolean;
}

export interface YearMonth {
  year: number;
  month: number; // 1-12
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 해당 월을 일요일 시작의 주 단위 격자로 만든다. 앞뒤로 이웃 달 날짜가 채워진다. */
export function buildMonthGrid(year: number, month: number): CalendarCell[][] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);

  const cursor = new Date(first);
  cursor.setDate(1 - first.getDay());

  const weeks: CalendarCell[][] = [];
  do {
    const week: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: toISO(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month - 1 && cursor.getFullYear() === year,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  } while (cursor <= last);

  return weeks;
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function monthLabel({ year, month }: YearMonth): string {
  return `${year}년 ${month}월`;
}

export function currentYearMonth(today = new Date()): YearMonth {
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}
