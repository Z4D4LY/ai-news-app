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
          className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
            selected === tag
              ? 'bg-accent text-white'
              : 'bg-bg-card text-text-dim hover:bg-bg-hover hover:text-text-primary border border-border'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}