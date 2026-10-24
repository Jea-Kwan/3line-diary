export interface Topic {
  id: string;
  name: string;
  color: string; // TOPIC_COLORS 중 하나
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  topicId: string | null; // null = 주제 없음
  photo: Blob | null;
  text: string;
  createdAt: number;
  updatedAt: number;
}
