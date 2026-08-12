import { useMemo } from 'react';
import type { Article, TagFilter } from '../types';
import feedData from '../../data/feed.json';

interface UseArticlesOptions {
  tag: TagFilter;
  type: 'dev' | 'world';
}

export function useArticles({ tag, type }: UseArticlesOptions) {
  const articles: Article[] = useMemo(() => {
    let filtered: Article[] = (feedData.articles as Article[]).filter(
      (a) => a.type === type
    );

    if (tag !== 'All') {
      filtered = filtered.filter((a) => a.tag === tag);
    }

    return filtered;
  }, [tag, type]);

  return { articles };
}