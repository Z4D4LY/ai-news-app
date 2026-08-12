export interface Article {
  id: string;
  title: string;
  url: string;
  source: 'hackernews' | 'reddit' | 'devto';
  score: number;
  summary: string;
  tag: string;
  date: string;
}

export interface Feed {
  updated: string;
  articles: Article[];
}

export const TAG_OPTIONS = [
  'All',
  'AI/ML',
  'Frontend',
  'Backend',
  'DevOps',
  'Security',
  'Open Source',
  'General',
] as const;

export type TagFilter = (typeof TAG_OPTIONS)[number];