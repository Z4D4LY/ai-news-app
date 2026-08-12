import { type TagFilter } from '../types';

interface Props {
  tags: readonly string[];
  selected: TagFilter;
  onChange: (tag: string) => void;
}

export default function TopicFilter({ tags, selected, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(tag)}
          className="rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors border"
          style={{
            background: selected === tag ? 'var(--accent)' : 'var(--bg-card)',
            color: selected === tag ? '#fff' : 'var(--text-dim)',
            borderColor: selected === tag ? 'var(--accent)' : 'var(--border)',
          }}
          onMouseEnter={(e) => {
            if (selected !== tag) {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text)';
            }
          }}
          onMouseLeave={(e) => {
            if (selected !== tag) {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)';
            }
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}