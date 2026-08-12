import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Article } from '../types';

const SOURCE_DOT: Record<string, string> = {
  hackernews: 'text-orange-500',
  devto: 'text-sky-500',
  googlenews: 'text-slate-500',
  bbc: 'text-red-500',
  npr: 'text-blue-500',
};

interface Props {
  article: Article;
  onBack: () => void;
}

export default function ArticlePage({ article, onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(article.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ color: 'var(--text)' }}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
        style={{ color: 'var(--text-dim)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </button>

      <article>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${SOURCE_DOT[article.source] ?? 'text-gray-400'}`} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>
              {article.source === 'hackernews' ? 'Hacker News' : article.source === 'devto' ? 'Dev.to' : article.source === 'googlenews' ? 'Google News' : article.source === 'bbc' ? 'BBC' : 'NPR'}
            </span>
          </div>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
          >
            {article.tag}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h1 className="text-xl font-bold leading-snug mb-4">{article.title}</h1>

        <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-dim)' }}>
          {article.summary === 'No summary available.'
            ? 'Click to read the full article.'
            : article.summary}
        </p>

        <div className="flex items-center gap-3">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
          >
            Read full article <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{ color: 'var(--text-dim)', background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </article>
    </div>
  );
}