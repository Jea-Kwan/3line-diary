export interface DiaryEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  photo: Blob | null;
  lines: [string, string, string];
  createdAt: number;
  updatedAt: number;
}
