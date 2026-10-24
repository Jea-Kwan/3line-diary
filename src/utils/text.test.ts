import { describe, expect, it } from 'vitest';
import { fitText, firstLine, MAX_CHARS, MAX_LINES } from './text';

// 테스트용 줄 수 계산: 엔터로 나뉜 줄마다 10자씩 넘으면 한 줄 더 (끝의 빈 줄도 한 줄)
const count = (text: string) =>
  text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 10)), 0);

describe('firstLine', () => {
  it('비어 있지 않은 첫 줄을 돌려준다', () => {
    expect(firstLine('\n\n둘째\n셋째')).toBe('둘째');
    expect(firstLine('')).toBe('');
  });
});

describe('fitText', () => {
  it('한도 안이면 입력한 글을 그대로 둔다', () => {
    expect(fitText('가나다', '가나', count)).toBe('가나다');
  });

  it('줄 수가 한도를 넘는 입력은 이전 글로 되돌린다', () => {
    const prev = '1\n2\n3\n4\n5\n6';
    expect(fitText(prev + '\n', prev, count)).toBe(prev);
  });

  it('긴 줄이 꺾여서 한도를 넘으면 막는다 (엔터 줄 수는 6줄이어도)', () => {
    const prev = '1\n2\n3\n4\n5\n' + '가'.repeat(10);
    expect(count(prev)).toBe(6);
    expect(fitText(prev + '나', prev, count)).toBe(prev);
  });

  it('끝에 붙여넣은 글이 넘치면 들어가는 앞부분만 남긴다', () => {
    expect(fitText('1\n2\n3\n4\n5\n6\n7\n8', '', count)).toBe('1\n2\n3\n4\n5\n6');
  });

  it('중간에 넣은 글이 넘치면 입력을 받지 않는다', () => {
    const prev = '1\n2\n3\n4\n5\n6';
    expect(fitText('1\n2\n가\n3\n4\n5\n6', prev, count)).toBe(prev);
  });

  it('한도를 넘겨 쓴 옛 일기도 줄을 늘리지 않는 수정은 허용한다', () => {
    const old = '가'.repeat(100);
    expect(count(old)).toBeGreaterThan(MAX_LINES);
    expect(fitText('가'.repeat(99), old, count)).toBe('가'.repeat(99));
  });

  it('한도를 넘긴 옛 일기에는 더 늘리는 입력을 받지 않는다', () => {
    const old = '가'.repeat(100);
    expect(fitText(old + '나', old, count)).toBe(old);
  });
});

describe('한도 값', () => {
  it('180자 6줄이다', () => {
    expect(MAX_CHARS).toBe(180);
    expect(MAX_LINES).toBe(6);
  });
});
