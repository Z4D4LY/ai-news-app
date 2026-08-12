import { type TagFilter } from '../types';

interface Props {
  tags: readonly string[];
  selected: TagFilter;
  onChange: (tag: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  'AI/ML': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Frontend': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Backend': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'DevOps': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Security': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Open Source': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'Politics': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Tech & Science': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Business': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Health': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'Climate': 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  'General': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function TopicFilter({ tags, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(tag)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
            selected === tag
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : tag === 'All'
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                : `${TAG_COLORS[tag] ?? ''} hover:opacity-80`
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}