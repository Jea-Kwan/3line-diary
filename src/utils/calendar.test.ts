import { describe, expect, it } from 'vitest';
import { addMonths, buildMonthGrid, currentYearMonth, monthLabel } from './calendar';

describe('buildMonthGrid', () => {
  it('모든 주가 일요일에 시작하는 7일짜리다', () => {
    const weeks = buildMonthGrid(2026, 8);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
      expect(new Date(week[0].date + 'T00:00:00').getDay()).toBe(0);
    }
  });

  it('토요일에 시작하는 달은 앞을 이웃 달로 채운다', () => {
    const weeks = buildMonthGrid(2026, 8); // 2026-08-01은 토요일
    const firstWeek = weeks[0];
    expect(firstWeek.slice(0, 6).every((c) => !c.inMonth)).toBe(true);
    expect(firstWeek[6]).toMatchObject({ date: '2026-08-01', day: 1, inMonth: true });
    expect(firstWeek[0].date).toBe('2026-07-26');
  });

  it('일요일에 시작하고 28일인 달은 정확히 4주가 된다', () => {
    const weeks = buildMonthGrid(2026, 2); // 2026-02-01 일요일, 28일
    expect(weeks).toHaveLength(4);
    expect(weeks[0][0].date).toBe('2026-02-01');
    expect(weeks[3][6].date).toBe('2026-02-28');
    expect(weeks.flat().every((c) => c.inMonth)).toBe(true);
  });

  it('그 달의 모든 날짜를 한 번씩만 담는다', () => {
    const inMonth = buildMonthGrid(2026, 8)
      .flat()
      .filter((c) => c.inMonth)
      .map((c) => c.date);
    expect(inMonth).toHaveLength(31);
    expect(new Set(inMonth).size).toBe(31);
    expect(inMonth[0]).toBe('2026-08-01');
    expect(inMonth[30]).toBe('2026-08-31');
  });

  it('윤년 2월의 29일을 포함한다', () => {
    const dates = buildMonthGrid(2024, 2)
      .flat()
      .filter((c) => c.inMonth)
      .map((c) => c.date);
    expect(dates).toHaveLength(29);
    expect(dates).toContain('2024-02-29');
  });

  it('격자는 이어지는 날짜로 빈틈없이 채워진다', () => {
    const cells = buildMonthGrid(2026, 11).flat();
    for (let i = 1; i < cells.length; i++) {
      const prev = new Date(cells[i - 1].date + 'T00:00:00');
      prev.setDate(prev.getDate() + 1);
      expect(cells[i].day).toBe(prev.getDate());
    }
  });
});

describe('addMonths', () => {
  it('연말을 넘어간다', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('연초에서 뒤로 간다', () => {
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('여러 달을 한 번에 옮긴다', () => {
    expect(addMonths({ year: 2026, month: 3 }, -14)).toEqual({ year: 2025, month: 1 });
  });

  it('0을 더하면 그대로다', () => {
    expect(addMonths({ year: 2026, month: 8 }, 0)).toEqual({ year: 2026, month: 8 });
  });
});

describe('monthLabel / currentYearMonth', () => {
  it('한국어 라벨을 만든다', () => {
    expect(monthLabel({ year: 2026, month: 8 })).toBe('2026년 8월');
  });

  it('오늘이 속한 연·월을 돌려준다', () => {
    expect(currentYearMonth(new Date(2026, 7, 29))).toEqual({ year: 2026, month: 8 });
  });
});
