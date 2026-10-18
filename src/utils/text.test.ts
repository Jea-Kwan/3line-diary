import { describe, expect, it } from 'vitest';
import { countLines, firstLine, limitLines, MAX_CHARS, MAX_LINES } from './text';

describe('firstLine', () => {
  it('비어 있지 않은 첫 줄을 돌려준다', () => {
    expect(firstLine('\n\n둘째\n셋째')).toBe('둘째');
    expect(firstLine('')).toBe('');
  });
});

describe('countLines', () => {
  it('엔터 기준으로 줄 수를 센다', () => {
    expect(countLines('')).toBe(1);
    expect(countLines('a\nb\nc')).toBe(3);
    expect(countLines('a\n')).toBe(2);
  });
});

describe('limitLines', () => {
  it('한도 안이면 그대로 둔다', () => {
    expect(limitLines('a\nb')).toBe('a\nb');
  });

  it('한도를 넘으면 앞쪽 줄만 남긴다', () => {
    expect(limitLines('1\n2\n3\n4\n5\n6\n7\n8')).toBe('1\n2\n3\n4\n5\n6');
  });
});

describe('한도 값', () => {
  it('180자 6줄이다', () => {
    expect(MAX_CHARS).toBe(180);
    expect(MAX_LINES).toBe(6);
  });
});
