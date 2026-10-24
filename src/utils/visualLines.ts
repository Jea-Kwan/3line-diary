import { BASE_FONT, LINE_HEIGHT, TEXT_WIDTH } from './bookLayout';

let meter: HTMLDivElement | null = null;

/** 글이 A5 책 페이지에 실제로 찍힐 때 몇 줄이 되는지 (긴 줄이 꺾이는 것까지 센다). */
export function countVisualLines(text: string): number {
  if (typeof document === 'undefined') return text.split('\n').length;
  if (!meter) {
    meter = document.createElement('div');
    meter.setAttribute('aria-hidden', 'true');
    Object.assign(meter.style, {
      position: 'absolute',
      visibility: 'hidden',
      left: '-10000px',
      top: '0',
      width: `${TEXT_WIDTH}px`,
      fontSize: `${BASE_FONT}px`,
      lineHeight: String(LINE_HEIGHT),
      whiteSpace: 'pre-line',
      overflowWrap: 'anywhere',
      fontFamily: getComputedStyle(document.body).fontFamily,
    });
    document.body.appendChild(meter);
  }
  // 끝의 엔터로 만든 빈 줄도 한 줄로 세도록 보이지 않는 글자를 붙여서 잰다.
  meter.textContent = `${text}​`;
  return Math.max(1, Math.round(meter.offsetHeight / (BASE_FONT * LINE_HEIGHT)));
}
