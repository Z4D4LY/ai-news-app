import { Clock, ExternalLink } from 'lucide-react';
import type { Article } from '../types';

const SOURCE_LABEL: Record<string, string> = {
  hackernews: 'HN',
  reddit: 'Reddit',
  devto: 'Dev.to',
  googlenews: 'News',
  bbc: 'BBC',
  npr: 'NPR',
};

const SOURCE_COLOR: Record<string, string> = {
  hackernews: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  reddit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  devto: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  googlenews: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  bbc: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  npr: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

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

const TAG_BORDER: Record<string, string> = {
  'AI/ML': 'border-l-purple-500 dark:border-l-purple-400',
  'Frontend': 'border-l-blue-500 dark:border-l-blue-400',
  'Backend': 'border-l-green-500 dark:border-l-green-400',
  'DevOps': 'border-l-orange-500 dark:border-l-orange-400',
  'Security': 'border-l-red-500 dark:border-l-red-400',
  'Open Source': 'border-l-teal-500 dark:border-l-teal-400',
  'Politics': 'border-l-amber-500 dark:border-l-amber-400',
  'Tech & Science': 'border-l-cyan-500 dark:border-l-cyan-400',
  'Business': 'border-l-emerald-500 dark:border-l-emerald-400',
  'Health': 'border-l-rose-500 dark:border-l-rose-400',
  'Climate': 'border-l-lime-500 dark:border-l-lime-400',
  'General': 'border-l-gray-300 dark:border-l-gray-600',
};

interface Props {
  article: Article;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ArticleCard({ article, isBookmarked, onToggleBookmark }: Props) {
  return (
    <article className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 border-l-2 ${TAG_BORDER[article.tag] ?? TAG_BORDER['General']} transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${SOURCE_COLOR[article.source] ?? ''}`}>
              {SOURCE_LABEL[article.source]}
            </span>
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${TAG_COLORS[article.tag] ?? TAG_COLORS['General']}`}>
              {article.tag}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(article.date)}
            </span>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1 text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="line-clamp-2">{article.title}</span>
            <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        <button
          onClick={() => onToggleBookmark(article.id)}
          className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
            isBookmarked
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-300 dark:text-gray-700 hover:text-indigo-400'
          }`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <svg
            className="h-5 w-5"
            fill={isBookmarked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      <p className="mt-3 text-base leading-relaxed text-gray-700 dark:text-gray-300">
        {article.summary === 'No summary available.'
          ? 'Click to read the full article.'
          : article.summary}
      </p>
    </article>
  );
}