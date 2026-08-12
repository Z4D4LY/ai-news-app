import { Bookmark } from 'lucide-react';

interface Props {
  onToggleSaved: () => void;
  showSaved: boolean;
  tab: 'dev' | 'world';
  articleCount: number;
}

export default function Header({ onToggleSaved, showSaved, tab, articleCount }: Props) {
  return (
    <header className="bg-accent text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-bold tracking-tight shrink-0">DevNews AI</h1>
          <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
            Beta
          </span>
          <span className="hidden sm:block text-xs text-orange-100 truncate">
            {articleCount > 0 ? `${articleCount} ${tab === 'dev' ? 'tech' : 'world'} today` : 'Loading...'}
          </span>
        </div>

        <button
          onClick={onToggleSaved}
          className={`rounded-lg p-2 transition-colors shrink-0 ${
            showSaved
              ? 'bg-white/20 text-white'
              : 'text-orange-100 hover:bg-white/10'
          }`}
          aria-label="Saved articles"
        >
          <Bookmark className="h-5 w-5" fill={showSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </header>
  );
}