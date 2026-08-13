import { Moon, Sun } from 'lucide-react';
import { TABS, type TabType, type FontSize } from '../types';

interface Props {
  tab: TabType;
  articleCount: number;
  onToggleTheme: () => void;
  isDark: boolean;
  fontSize: FontSize;
  onCycleFontSize: () => void;
}

const FONT_LABEL: Record<FontSize, string> = {
  normal: 'A',
  large: 'A+',
  xl: 'A++',
};

export default function Header({
  tab,
  articleCount,
  onToggleTheme,
  isDark,
  fontSize,
  onCycleFontSize,
}: Props) {
  const label = TABS.find((t) => t.id === tab)?.label ?? tab;

  return (
    <header style={{ background: 'var(--accent)', color: '#fff' }}>
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-xl font-bold tracking-tight shrink-0">Atlas Daily Digest</h1>
          <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-sm font-semibold">
            Beta
          </span>
          <span className="hidden sm:block text-sm text-orange-100 truncate">
            {articleCount > 0 ? `${articleCount} ${label.toLowerCase()} today` : 'Loading...'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCycleFontSize}
            className="rounded-lg bg-white/15 px-2.5 py-1.5 text-base font-semibold text-orange-100 hover:bg-white/25 transition-colors"
            aria-label={`Text size: ${FONT_LABEL[fontSize]}. Click to increase.`}
            title="Text size"
          >
            {FONT_LABEL[fontSize]}
          </button>

          <button
            onClick={onToggleTheme}
            className="rounded-lg p-2 text-orange-100 hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </header>
  );
}
