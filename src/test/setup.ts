import 'fake-indexeddb/auto';

/*
 * jsdom 환경에는 structuredClone이 없고, Node가 가진 구현은 jsdom의 Blob을 복제하지 못한다.
 * fake-indexeddb가 값을 저장할 때 쓰므로 이 앱이 저장하는 모양(원시값·배열·평범한 객체·Blob)만
 * 다루는 최소 구현을 넣는다. Blob은 불변이라 같은 참조를 그대로 넘겨도 안전하다.
 */
function cloneValue(value: unknown): unknown {
  if (value instanceof Blob) return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, cloneValue(v)])
    );
  }
  return value;
}

globalThis.structuredClone = cloneValue as typeof structuredClone;

// jsdom의 Blob에는 브라우저에 있는 arrayBuffer()/text()가 없다.
function readBlob<T>(blob: Blob, read: (reader: FileReader) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as T);
    reader.onerror = () => reject(reader.error);
    read(reader);
  });
}

const blobProto = Blob.prototype as unknown as Record<string, unknown>;

if (typeof blobProto.arrayBuffer !== 'function') {
  blobProto.arrayBuffer = function (this: Blob) {
    return readBlob<ArrayBuffer>(this, (reader) => reader.readAsArrayBuffer(this));
  };
}

if (typeof blobProto.text !== 'function') {
  blobProto.text = function (this: Blob) {
    return readBlob<string>(this, (reader) => reader.readAsText(this));
  };
}
