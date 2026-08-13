import { useMemo } from 'react';
import type { Article, TabType } from '../types';
import feedData from '../../data/feed.json';

interface UseArticlesOptions {
  type: TabType;
}

export function useArticles({ type }: UseArticlesOptions) {
  const articles: Article[] = useMemo(() => {
    return (feedData.articles as Article[]).filter((a) => a.type === type);
  }, [type]);

  return { articles };
}
