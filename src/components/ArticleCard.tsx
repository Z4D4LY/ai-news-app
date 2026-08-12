import type { Article } from '../types';

const SOURCE_LABEL: Record<string, string> = {
  hackernews: 'HN',
  devto: 'Dev.to',
  googlenews: 'News',
  bbc: 'BBC',
  npr: 'NPR',
};

const SOURCE_DOT: Record<string, string> = {
  hackernews: 'text-orange-500',
  devto: 'text-sky-500',
  googlenews: 'text-slate-500',
  bbc: 'text-red-500',
  npr: 'text-blue-500',
};

interface Props {
  article: Article;
  index: number;
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

export default function ArticleCard({ article, index }: Props) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 py-3.5 px-1 -mx-1 rounded no-underline transition-colors"
      style={{ background: 'transparent', color: 'var(--text)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span
        className="shrink-0 w-6 text-right text-sm font-mono pt-0.5 select-none"
        style={{ color: 'var(--text-dim)' }}
      >
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_DOT[article.source] ?? 'text-gray-400'}`} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
              {SOURCE_LABEL[article.source] ?? article.source}
            </span>
          </div>
          {article.score > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              ▲{formatScore(article.score)}
            </span>
          )}
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
          >
            {article.tag}
          </span>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
            {timeAgo(article.date)}
          </span>
        </div>

        <span className="text-base font-medium leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {article.title}
        </span>

        <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {article.summary === 'No summary available.'
            ? 'Click to read the full article.'
            : article.summary}
        </p>
      </div>
    </a>
  );
}