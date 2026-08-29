import { describe, expect, it } from 'vitest';
import { formatKorean, toISO, todayISO } from './date';

describe('toISO', () => {
  it('한 자리 월과 일을 0으로 채운다', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('두 자리 월과 일을 그대로 쓴다', () => {
    expect(toISO(new Date(2026, 10, 30))).toBe('2026-11-30');
  });

  it('UTC가 아닌 지역 시간을 기준으로 한다', () => {
    // 자정 직후는 UTC로 바꾸면 전날이 될 수 있다.
    expect(toISO(new Date(2026, 7, 29, 0, 30))).toBe('2026-08-29');
  });
});

describe('todayISO', () => {
  it('YYYY-MM-DD 형식을 돌려준다', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatKorean', () => {
  it('요일까지 붙여 한국어로 표시한다', () => {
    expect(formatKorean('2026-08-29')).toBe('2026년 8월 29일 (토)');
  });

  it('앞의 0을 떼고 표시한다', () => {
    expect(formatKorean('2026-01-05')).toBe('2026년 1월 5일 (월)');
  });

  it('윤년 2월 29일을 처리한다', () => {
    expect(formatKorean('2024-02-29')).toBe('2024년 2월 29일 (목)');
  });
});
