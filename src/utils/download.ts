/**
 * Blob을 파일로 내려받는다. iOS 사파리는 링크가 문서에 붙어 있어야 내려받고,
 * 모바일에서는 바로 revoke하면 다운로드가 시작되기 전에 끊길 수 있어 지연시킨다.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
