import { useState, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TopicFilter from './components/TopicFilter';
import Feed from './components/Feed';
import { useArticles } from './hooks/useArticles';
import { useBookmarks } from './hooks/useBookmarks';
import { DEV_TAGS, WORLD_TAGS, type TagFilter } from './types';

function getInitialDark(): boolean {
  const stored = localStorage.getItem('theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

export default function App() {
  const [isDark, setIsDark] = useState(getInitialDark);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<TagFilter>('All');
  const [showSaved, setShowSaved] = useState(false);
  const [tab, setTab] = useState<'dev' | 'world'>('dev');

  const switchTab = (t: 'dev' | 'world') => {
    setTab(t);
    setTag('All');
    setSearch('');
  };

  const tagOptions = tab === 'dev' ? DEV_TAGS : WORLD_TAGS;
  const { articles } = useArticles({ search, tag, showSaved, type: tab });
  const { toggleBookmark, isBookmarked } = useBookmarks();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        onToggleSaved={() => setShowSaved((v) => !v)}
        showSaved={showSaved}
        tab={tab}
        articleCount={articles.length}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <div className="sticky top-0 z-10 space-y-4 pt-4 pb-4 backdrop-blur" style={{ background: 'color-mix(in srgb, var(--bg) 95%, transparent)' }}>
          <div className="flex rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
            <button
              onClick={() => switchTab('dev')}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: tab === 'dev' ? 'var(--accent)' : 'transparent',
                color: tab === 'dev' ? '#fff' : 'var(--text-dim)',
              }}
            >
              Tech
            </button>
            <button
              onClick={() => switchTab('world')}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: tab === 'world' ? 'var(--accent)' : 'transparent',
                color: tab === 'world' ? '#fff' : 'var(--text-dim)',
              }}
            >
              World
            </button>
          </div>
          <SearchBar value={search} onChange={setSearch} />
          <TopicFilter tags={tagOptions as readonly string[]} selected={tag} onChange={(t) => setTag(t as TagFilter)} />
        </div>

        <Feed
          articles={articles}
          onToggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
          tab={tab}
        />
      </main>
    </div>
  );
}