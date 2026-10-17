// 카카오톡·네이버·인스타그램 같은 앱 안의 임시 브라우저(WebView)는 파일 다운로드를 지원하지 않는다.
const IN_APP_RE = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|\bLine\//i;

export function isInAppBrowser(ua: string = navigator.userAgent): boolean {
  return IN_APP_RE.test(ua);
}

/** 기본 브라우저로 이 페이지를 열어주는 주소. 방법이 없으면 null. */
export function externalBrowserUrl(url: string, ua: string = navigator.userAgent): string | null {
  if (/KAKAOTALK/i.test(ua)) {
    return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
  }
  if (/android/i.test(ua)) {
    const u = new URL(url);
    // intent 주소에서는 #이 옵션 구분자라 원래 주소의 #은 뺀다.
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;end`;
  }
  return null;
}
