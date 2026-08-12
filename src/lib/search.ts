import Fuse from 'fuse.js';
import type { Article } from '../types';

const fuse = new Fuse<Article>([], {
  keys: ['title', 'summary'],
  threshold: 0.4,
});

export function searchArticles(articles: Article[], query: string): Article[] {
  fuse.setCollection(articles);
  return fuse.search(query).map((r) => r.item);
}