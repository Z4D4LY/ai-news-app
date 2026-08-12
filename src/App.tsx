import { useState } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TopicFilter from './components/TopicFilter';
import Feed from './components/Feed';
import { useArticles } from './hooks/useArticles';
import { useDarkMode } from './hooks/useDarkMode';
import { useBookmarks } from './hooks/useBookmarks';
import { DEV_TAGS, WORLD_TAGS, type TagFilter } from './types';

export default function App() {
  useDarkMode();

  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<TagFilter>('All');
  const [showSaved, setShowSaved] = useState(false);
  const [tab, setTab] = useState<'dev' | 'world'>('dev');

  const tagOptions = tab === 'dev' ? DEV_TAGS : WORLD_TAGS;
  const { articles } = useArticles({ search, tag, showSaved, type: tab });
  const { toggleBookmark, isBookmarked } = useBookmarks();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        onToggleSaved={() => setShowSaved((v) => !v)}
        showSaved={showSaved}
        tab={tab}
        articleCount={articles.length}
      />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="sticky top-0 z-10 space-y-4 pt-4 pb-4 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur">
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => { setTab('dev'); setTag('All'); }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === 'dev'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Developer
            </button>
            <button
              onClick={() => { setTab('world'); setTag('All'); }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === 'world'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
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