import { useState } from 'react';
import { externalBrowserUrl, isInAppBrowser } from '../utils/inAppBrowser';

export function InAppBrowserNotice() {
  const [copied, setCopied] = useState(false);
  if (!isInAppBrowser()) return null;

  const openUrl = externalBrowserUrl(location.href);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(location.href.split('#')[0]);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="inapp-notice">
      <p>
        지금은 앱 안의 임시 브라우저라서 파일 저장이 안 돼요. 크롬이나 삼성 인터넷 같은
        브라우저에서 열어주세요.
      </p>
      <div className="inapp-notice-actions">
        {openUrl && (
          <a className="inapp-notice-open" href={openUrl}>
            기본 브라우저로 열기
          </a>
        )}
        <button className="inapp-notice-copy" onClick={copyAddress}>
          {copied ? '복사했어요' : '주소 복사'}
        </button>
      </div>
    </div>
  );
}
