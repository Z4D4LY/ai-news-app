import { useState, useCallback } from 'react';
import Header from './components/Header';
import TopicFilter from './components/TopicFilter';
import Feed from './components/Feed';
import ArticlePage from './components/ArticlePage';
import { useArticles } from './hooks/useArticles';
import { DEV_TAGS, WORLD_TAGS, type TagFilter, type Article } from './types';

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {}
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.matches) return true;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return false;
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const dark = getInitialDark();
    applyTheme(dark);
    return dark;
  });

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  const [tag, setTag] = useState<TagFilter>('All');
  const [tab, setTab] = useState<'dev' | 'world'>('dev');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const switchTab = (t: 'dev' | 'world') => {
    setTab(t);
    setTag('All');
    setSelectedArticle(null);
  };

  const tagOptions = tab === 'dev' ? DEV_TAGS : WORLD_TAGS;
  const { articles } = useArticles({ tag, type: tab });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        tab={tab}
        articleCount={articles.length}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />

      {selectedArticle ? (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-16 pt-8">
          <ArticlePage
            article={selectedArticle}
            onBack={() => setSelectedArticle(null)}
          />
        </main>
      ) : (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
          <div className="sticky top-0 z-10 space-y-4 pt-4 pb-4 backdrop-blur border-b" style={{ background: 'color-mix(in srgb, var(--bg) 98%, transparent)', borderColor: 'var(--border)' }}>
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
            <TopicFilter tags={tagOptions as readonly string[]} selected={tag} onChange={(t) => setTag(t as TagFilter)} />
          </div>

          <Feed
            articles={articles}
            onSelectArticle={setSelectedArticle}
            tab={tab}
          />
        </main>
      )}
    </div>
  );
}