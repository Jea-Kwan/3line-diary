import { useEffect, useRef, useState } from 'react';
import { compressImage, blobToObjectURL } from '../utils/image';

interface Props {
  photo: Blob | null;
  onChange: (photo: Blob | null) => void;
}

export function PhotoPicker({ photo, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setPreviewURL(null);
      return;
    }
    const url = blobToObjectURL(photo);
    setPreviewURL(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    onChange(compressed);
    e.target.value = '';
  }

  return (
    <div className="photo-picker">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        hidden
      />
      {previewURL ? (
        <div className="photo-preview" onClick={() => inputRef.current?.click()}>
          <img src={previewURL} alt="일기 사진" />
          <button
            type="button"
            className="photo-remove"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button type="button" className="photo-empty" onClick={() => inputRef.current?.click()}>
          <span className="photo-empty-icon">📷</span>
          <span>사진 추가</span>
        </button>
      )}
    </div>
  );
}
