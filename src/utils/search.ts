import { firstLine } from './text';

export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === '' || text.toLowerCase().includes(q);
}

/** 검색 중에는 검색어가 들어 있는 첫 줄을, 아니면 비어 있지 않은 첫 줄을 보여준다. */
export function matchedLine(text: string, query: string): string {
  const q = query.trim().toLowerCase();
  if (q) {
    const line = text.split('\n').find((l) => l.toLowerCase().includes(q));
    if (line !== undefined) return line;
  }
  return firstLine(text);
}

export interface TextPart {
  text: string;
  match: boolean;
}

/** 검색어와 일치하는 부분을 표시할 수 있게 글을 조각낸다. */
export function splitByQuery(text: string, query: string): TextPart[] {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const parts: TextPart[] = [];
  let i = 0;
  while (i < text.length) {
    const j = lower.indexOf(q, i);
    if (j < 0) {
      parts.push({ text: text.slice(i), match: false });
      break;
    }
    if (j > i) parts.push({ text: text.slice(i, j), match: false });
    parts.push({ text: text.slice(j, j + q.length), match: true });
    i = j + q.length;
  }
  return parts;
}
