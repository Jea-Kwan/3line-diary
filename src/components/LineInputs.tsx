interface Props {
  lines: [string, string, string];
  onChange: (lines: [string, string, string]) => void;
}

const PLACEHOLDERS = ['오늘 있었던 일', '느낀 점', '내일의 다짐'];

export function LineInputs({ lines, onChange }: Props) {
  function setLine(index: number, value: string) {
    const next = [...lines] as [string, string, string];
    next[index] = value;
    onChange(next);
  }

  return (
    <div className="line-inputs">
      {lines.map((line, i) => (
        <div className="line-input-row" key={i}>
          <span className="line-number">{i + 1}</span>
          <input
            type="text"
            value={line}
            placeholder={PLACEHOLDERS[i]}
            maxLength={60}
            onChange={(e) => setLine(i, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
