import { useState } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TopicFilter from './components/TopicFilter';
import Feed from './components/Feed';
import { useArticles } from './hooks/useArticles';
import { useDarkMode } from './hooks/useDarkMode';
import { useBookmarks } from './hooks/useBookmarks';
import type { TagFilter } from './types';

export default function App() {
  useDarkMode();

  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<TagFilter>('All');
  const [showSaved, setShowSaved] = useState(false);
  const { articles } = useArticles({ search, tag, showSaved });
  const { toggleBookmark, isBookmarked } = useBookmarks();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header onToggleSaved={() => setShowSaved((v) => !v)} showSaved={showSaved} />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="sticky top-0 z-10 space-y-4 pt-4 pb-4 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur">
          <SearchBar value={search} onChange={setSearch} />
          <TopicFilter selected={tag} onChange={setTag} />
        </div>

        <Feed
          articles={articles}
          onToggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
        />
      </main>
    </div>
  );
}