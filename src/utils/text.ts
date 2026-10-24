import { countVisualLines } from './visualLines';

export const MAX_CHARS = 180;
export const MAX_LINES = 6;

export function firstLine(text: string): string {
  return text.split('\n').find((line) => line.trim() !== '') ?? '';
}

/**
 * 입력된 글(next)이 책 페이지의 MAX_LINES줄을 넘으면 막는다.
 * - 줄 수가 늘지 않는 수정(지우기 등)은 항상 허용한다. 한도를 넘겨 쓴 옛 일기도 고칠 수 있다.
 * - 끝에 덧붙인 글이 넘치면 한도 안에 들어가는 앞부분만 남긴다.
 * - 그 밖의 위치에서 넘치면 입력을 받지 않고 이전 글(prev)로 되돌린다.
 */
export function fitText(
  next: string,
  prev: string,
  count: (text: string) => number = countVisualLines
): string {
  const lines = count(next);
  if (lines <= MAX_LINES || lines <= count(prev)) return next;
  if (!next.startsWith(prev)) return prev;

  let lo = prev.length;
  let hi = next.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (count(next.slice(0, mid)) <= MAX_LINES) lo = mid;
    else hi = mid - 1;
  }
  return next.slice(0, lo);
}
