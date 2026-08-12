import { Moon, Sun } from 'lucide-react';
import { TABS, type TabType } from '../types';

interface Props {
  tab: TabType;
  articleCount: number;
  onToggleTheme: () => void;
  isDark: boolean;
}

export default function Header({ tab, articleCount, onToggleTheme, isDark }: Props) {
  const label = TABS.find((t) => t.id === tab)?.label ?? tab;

  return (
    <header style={{ background: 'var(--accent)', color: '#fff' }}>
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-bold tracking-tight shrink-0">DevNews AI</h1>
          <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
            Beta
          </span>
          <span className="hidden sm:block text-xs text-orange-100 truncate">
            {articleCount > 0 ? `${articleCount} ${label.toLowerCase()} today` : 'Loading...'}
          </span>
        </div>

        <button
          onClick={onToggleTheme}
          className="rounded-lg p-2 text-orange-100 hover:bg-white/10 transition-colors shrink-0"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}