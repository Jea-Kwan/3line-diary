export interface ChipOption {
  key: string;
  label: string;
  color?: string;
  count?: number;
}

interface Props {
  options: ChipOption[];
  value: string;
  onChange: (key: string) => void;
  ariaLabel: string;
}

export function ChipRow({ options, value, onChange, ariaLabel }: Props) {
  return (
    <div className="chip-row" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={'chip' + (option.key === value ? ' chip-active' : '')}
          aria-pressed={option.key === value}
          onClick={() => onChange(option.key)}
        >
          {option.color && <i className="topic-dot" style={{ background: option.color }} />}
          {option.label}
          {option.count !== undefined && <span className="chip-count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
