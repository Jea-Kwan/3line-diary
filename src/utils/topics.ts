import { Topic } from '../types';

// 하루에 쓸 수 있는 일기 수. 하루 1~3개가 부담 없이 오래 쓰기 좋은 양이다.
export const MAX_PER_DAY = 3;
export const MAX_TOPICS = 12;
export const MAX_TOPIC_NAME = 12;

export const TOPIC_COLORS = [
  '#d97757', // 코랄
  '#c9a227', // 머스터드
  '#6a994e', // 올리브 그린
  '#2a9d8f', // 청록
  '#4a7fb5', // 파랑
  '#7b6cb5', // 보라
  '#c25b8a', // 핑크
  '#8a8378', // 회색
];

// 주제가 없는 일기를 표시하는 색
export const NO_TOPIC_COLOR = '#b9b2a6';
export const NO_TOPIC_LABEL = '주제 없음';

export function topicColor(topic: Topic | undefined | null): string {
  return topic?.color ?? NO_TOPIC_COLOR;
}

export function topicName(topic: Topic | undefined | null): string {
  return topic?.name ?? NO_TOPIC_LABEL;
}

export function topicMap(topics: Topic[]): Map<string, Topic> {
  return new Map(topics.map((t) => [t.id, t]));
}

/** 같은 이름(대소문자·앞뒤 공백 무시)의 주제가 이미 있는지 */
export function hasTopicName(topics: Topic[], name: string, exceptId?: string): boolean {
  const n = name.trim().toLowerCase();
  return topics.some((t) => t.id !== exceptId && t.name.trim().toLowerCase() === n);
}
