export interface DiaryEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  photo: Blob | null;
  text: string;
  createdAt: number;
  updatedAt: number;
}
