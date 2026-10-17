import { describe, expect, it } from 'vitest';
import { externalBrowserUrl, isInAppBrowser } from './inAppBrowser';

const KAKAO_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36 KAKAOTALK/10.4.0';
const CHROME_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const URL_ = 'https://jea-kwan.github.io/3line-diary/#/book';

describe('isInAppBrowser', () => {
  it('카카오톡 인앱 브라우저를 알아본다', () => {
    expect(isInAppBrowser(KAKAO_UA)).toBe(true);
  });

  it('인스타그램·네이버 인앱 브라우저도 알아본다', () => {
    expect(isInAppBrowser('Mozilla/5.0 Instagram 300.0 Android')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 NAVER(inapp; search; 1000; 12.0)')).toBe(true);
  });

  it('일반 크롬은 인앱이 아니다', () => {
    expect(isInAppBrowser(CHROME_UA)).toBe(false);
  });
});

describe('externalBrowserUrl', () => {
  it('카카오톡에서는 openExternal 주소를 만든다', () => {
    expect(externalBrowserUrl(URL_, KAKAO_UA)).toBe(
      `kakaotalk://web/openExternal?url=${encodeURIComponent(URL_)}`
    );
  });

  it('다른 안드로이드 인앱에서는 크롬 intent 주소를 만든다', () => {
    expect(externalBrowserUrl(URL_, 'Mozilla/5.0 (Linux; Android 14) Instagram 300.0')).toBe(
      'intent://jea-kwan.github.io/3line-diary/#Intent;scheme=https;package=com.android.chrome;end'
    );
  });

  it('열 방법이 없으면 null이다', () => {
    expect(externalBrowserUrl(URL_, 'Mozilla/5.0 (iPhone) Instagram 300.0')).toBeNull();
  });
});
