export const MAX_CHARS = 180;
export const MAX_LINES = 6;

export function firstLine(text: string): string {
  return text.split('\n').find((line) => line.trim() !== '') ?? '';
}

export function countLines(text: string): number {
  return text.split('\n').length;
}

/** 붙여넣기 등으로 줄 수가 한도를 넘으면 앞쪽 MAX_LINES줄만 남긴다. */
export function limitLines(text: string): string {
  const lines = text.split('\n');
  return lines.length > MAX_LINES ? lines.slice(0, MAX_LINES).join('\n') : text;
}
