import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Feed from './components/Feed';
import { useArticles } from './hooks/useArticles';
import { TABS, FONT_SIZES, type TabType, type FontSize } from './types';

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {
    /* localStorage unavailable */
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.matches) return true;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return false;
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch {
    /* localStorage unavailable */
  }
}

function getInitialFontSize(): FontSize {
  try {
    const stored = localStorage.getItem('fontSize');
    if (stored === 'large' || stored === 'xl') return stored;
  } catch {
    /* localStorage unavailable */
  }
  return 'normal';
}

function applyFontSize(size: FontSize) {
  document.documentElement.style.fontSize = `${FONT_SIZES[size]}px`;
  try {
    localStorage.setItem('fontSize', size);
  } catch {
    /* localStorage unavailable */
  }
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const dark = getInitialDark();
    applyTheme(dark);
    return dark;
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const size = getInitialFontSize();
    applyFontSize(size);
    return size;
  });

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  const cycleFontSize = useCallback(() => {
    setFontSize((prev) => (prev === 'normal' ? 'large' : prev === 'large' ? 'xl' : 'normal'));
  }, []);

  const [tab, setTab] = useState<TabType>('tech');
  const { articles } = useArticles({ type: tab });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        tab={tab}
        articleCount={articles.length}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        fontSize={fontSize}
        onCycleFontSize={cycleFontSize}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <div
          className="sticky top-0 z-10 space-y-4 pt-4 pb-4 backdrop-blur border-b"
          style={{
            background: 'color-mix(in srgb, var(--bg) 98%, transparent)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex rounded-lg p-1" style={{ background: 'var(--bg-card)' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 rounded-md px-3 py-2 text-base font-medium transition-all"
                style={{
                  background: tab === t.id ? 'var(--accent)' : 'transparent',
                  color: tab === t.id ? '#fff' : 'var(--text-dim)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Feed articles={articles} />
      </main>
    </div>
  );
}
