import { TAG_OPTIONS, type TagFilter } from '../types';

interface Props {
  selected: TagFilter;
  onChange: (tag: TagFilter) => void;
}

const TAG_COLORS: Record<string, string> = {
  'AI/ML': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Frontend': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Backend': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'DevOps': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Security': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Open Source': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'General': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function TopicFilter({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAG_OPTIONS.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(tag)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
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