import { describe, expect, it } from 'vitest';
import { Topic } from '../types';
import {
  MAX_PER_DAY,
  NO_TOPIC_COLOR,
  NO_TOPIC_LABEL,
  TOPIC_COLORS,
  hasTopicName,
  topicColor,
  topicMap,
  topicName,
} from './topics';

const A: Topic = { id: 'a', name: 'Work', color: '#111', createdAt: 1 };
const B: Topic = { id: 'b', name: '가족', color: '#222', createdAt: 2 };

describe('topics', () => {
  it('하루에 쓸 수 있는 일기는 3개다', () => {
    expect(MAX_PER_DAY).toBe(3);
  });

  it('주제가 없으면 회색 계열과 "주제 없음"을 쓴다', () => {
    expect(topicColor(undefined)).toBe(NO_TOPIC_COLOR);
    expect(topicColor(null)).toBe(NO_TOPIC_COLOR);
    expect(topicName(undefined)).toBe(NO_TOPIC_LABEL);
    expect(topicColor(B)).toBe('#222');
    expect(topicName(B)).toBe('가족');
  });

  it('id로 주제를 찾는 맵을 만든다', () => {
    expect(topicMap([A, B]).get('b')).toBe(B);
  });

  it('이름이 같은지는 대소문자와 앞뒤 공백을 무시한다', () => {
    expect(hasTopicName([A, B], '  work ')).toBe(true);
    expect(hasTopicName([A, B], '운동')).toBe(false);
  });

  it('고치는 중인 주제 자신은 같은 이름으로 치지 않는다', () => {
    expect(hasTopicName([A, B], 'Work', 'a')).toBe(false);
    expect(hasTopicName([A, B], 'Work', 'b')).toBe(true);
  });

  it('색 팔레트에 중복이 없다', () => {
    expect(new Set(TOPIC_COLORS).size).toBe(TOPIC_COLORS.length);
  });
});
