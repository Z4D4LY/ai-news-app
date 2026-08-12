import { ExternalLink } from 'lucide-react';
import type { Article } from '../types';

const SOURCE_LABEL: Record<string, string> = {
  hackernews: 'HN',
  devto: 'Dev.to',
  googlenews: 'News',
  bbc: 'BBC',
  npr: 'NPR',
};

const SOURCE_DOT: Record<string, string> = {
  hackernews: 'text-orange-400',
  devto: 'text-sky-400',
  googlenews: 'text-slate-400',
  bbc: 'text-red-400',
  npr: 'text-blue-400',
};

interface Props {
  article: Article;
  index: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'now';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatScore(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return String(score);
}

export default function ArticleCard({ article, index, isBookmarked, onToggleBookmark }: Props) {
  return (
    <div className="group flex gap-3 py-3 px-1 -mx-1 rounded hover:bg-bg-hover transition-colors">
      <span className="shrink-0 w-6 text-right text-sm text-text-dim font-mono pt-0.5 select-none">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_DOT[article.source] ?? 'text-gray-400'}`} />
            <span className="text-xs font-medium text-text-dim">
              {SOURCE_LABEL[article.source] ?? article.source}
            </span>
          </div>
          {article.score > 0 && (
            <span className="text-xs text-text-dim">
              ▲{formatScore(article.score)}
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
            {article.tag}
          </span>
          <span className="text-xs text-text-dim ml-auto">
            {timeAgo(article.date)}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link text-[15px] font-medium text-text-primary hover:text-accent transition-colors leading-snug"
          >
            <span className="line-clamp-2">{article.title}</span>
            <ExternalLink className="inline ml-1 h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity align-baseline" />
          </a>

          <button
            onClick={() => onToggleBookmark(article.id)}
            className={`shrink-0 mt-0.5 p-0.5 rounded transition-colors ${
              isBookmarked
                ? 'text-accent'
                : 'text-text-dim opacity-0 group-hover:opacity-100 hover:text-accent'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <svg className="h-3.5 w-3.5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        <p className="mt-0.5 text-[13px] leading-relaxed text-text-dim line-clamp-2">
          {article.summary === 'No summary available.'
            ? 'Click to read the full article.'
            : article.summary}
        </p>
      </div>
    </div>
  );
}