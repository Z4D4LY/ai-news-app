import { useMemo } from 'react';
import type { Article, TagFilter } from '../types';
import { searchArticles } from '../lib/search';
import feedData from '../../data/feed.json';

interface UseArticlesOptions {
  search: string;
  tag: TagFilter;
  showSaved: boolean;
  type: 'dev' | 'world';
}

export function useArticles({ search, tag, showSaved, type }: UseArticlesOptions) {
  const articles: Article[] = useMemo(() => {
    let filtered: Article[] = (feedData.articles as Article[]).filter(
      (a) => a.type === type
    );

    if (tag !== 'All') {
      filtered = filtered.filter((a) => a.tag === tag);
    }

    if (search.trim()) {
      filtered = searchArticles(filtered, search.trim());
    }

    if (showSaved) {
      try {
        const saved = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[];
        filtered = filtered.filter((a) => saved.includes(a.id));
      } catch {
        filtered = [];
      }
    }

    return filtered;
  }, [search, tag, showSaved, type]);

  return { articles };
}