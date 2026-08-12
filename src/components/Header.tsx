import { Moon, Sun, Newspaper, Bookmark } from 'lucide-react';

interface Props {
  onToggleSaved: () => void;
  showSaved: boolean;
}

export default function Header({ onToggleSaved, showSaved }: Props) {
  const toggleDark = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-lg font-bold tracking-tight">DevNews AI</h1>
          <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSaved}
            className={`rounded-lg p-2 transition-colors ${
              showSaved
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
            aria-label="Saved articles"
          >
            <Bookmark className="h-5 w-5" fill={showSaved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={toggleDark}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="hidden dark:block h-5 w-5" />
            <Moon className="block dark:hidden h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}