import { describe, expect, it } from 'vitest';
import { matchedLine, matchesQuery, splitByQuery } from './search';

describe('matchesQuery', () => {
  it('검색어가 비어 있으면 모두 일치한다', () => {
    expect(matchesQuery('아무 글', '')).toBe(true);
    expect(matchesQuery('아무 글', '   ')).toBe(true);
  });

  it('글 안에 검색어가 있으면 일치한다', () => {
    expect(matchesQuery('한강에서 산책했다', '산책')).toBe(true);
    expect(matchesQuery('한강에서 산책했다', '커피')).toBe(false);
  });

  it('영문은 대소문자를 구분하지 않는다', () => {
    expect(matchesQuery('Went to the Park', 'park')).toBe(true);
  });

  it('여러 줄에 걸친 글도 찾는다', () => {
    expect(matchesQuery('첫째 줄\n둘째 줄 커피', '커피')).toBe(true);
  });
});

describe('matchedLine', () => {
  it('검색어가 들어 있는 첫 줄을 돌려준다', () => {
    expect(matchedLine('아침\n점심 커피\n저녁', '커피')).toBe('점심 커피');
  });

  it('검색어가 없으면 비어 있지 않은 첫 줄을 돌려준다', () => {
    expect(matchedLine('\n아침\n점심', '')).toBe('아침');
  });
});

describe('splitByQuery', () => {
  it('일치하는 부분만 표시한다', () => {
    expect(splitByQuery('커피와 커피', '커피')).toEqual([
      { text: '커피', match: true },
      { text: '와 ', match: false },
      { text: '커피', match: true },
    ]);
  });

  it('검색어가 없으면 통째로 돌려준다', () => {
    expect(splitByQuery('그냥 글', '')).toEqual([{ text: '그냥 글', match: false }]);
  });

  it('일치하는 게 없어도 글을 잃지 않는다', () => {
    expect(splitByQuery('그냥 글', '없음')).toEqual([{ text: '그냥 글', match: false }]);
  });
});
