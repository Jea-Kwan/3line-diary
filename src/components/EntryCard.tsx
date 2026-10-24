import { DiaryEntry, Topic } from '../types';
import { firstLine } from '../utils/text';
import { TopicChip } from './TopicChip';

interface Props {
  entry: DiaryEntry;
  topic: Topic | undefined;
  thumbURL: string | undefined;
  onClick: () => void;
}

export function EntryCard({ entry, topic, thumbURL, onClick }: Props) {
  return (
    <li className="entry-list-item" onClick={onClick}>
      <div className="entry-thumb">
        {thumbURL ? <img src={thumbURL} alt="" /> : <div className="entry-thumb-empty">📔</div>}
      </div>
      <div className="entry-summary">
        {topic && (
          <div className="entry-topic">
            <TopicChip topic={topic} />
          </div>
        )}
        <div className="entry-first-line">{firstLine(entry.text) || '(내용 없음)'}</div>
      </div>
    </li>
  );
}
