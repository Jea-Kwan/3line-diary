import { Topic } from '../types';
import { topicColor, topicName } from '../utils/topics';

export function TopicChip({ topic }: { topic: Topic | null | undefined }) {
  return (
    <span className="topic-chip">
      <i className="topic-dot" style={{ background: topicColor(topic) }} />
      {topicName(topic)}
    </span>
  );
}
