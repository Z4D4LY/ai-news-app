export interface Article {
  id: string;
  title: string;
  url: string;
  source: 'hackernews' | 'reddit' | 'devto' | 'googlenews' | 'bbc';
  score: number;
  summary: string;
  tag: string;
  date: string;
  type: 'dev' | 'world';
}

export interface Feed {
  updated: string;
  articles: Article[];
}

export const DEV_TAGS = [
  'All',
  'AI/ML',
  'Frontend',
  'Backend',
  'DevOps',
  'Security',
  'Open Source',
  'General',
] as const;

export const WORLD_TAGS = [
  'All',
  'Politics',
  'Tech & Science',
  'Business',
  'Health',
  'Climate',
  'General',
] as const;

export type DevTag = (typeof DEV_TAGS)[number];
export type WorldTag = (typeof WORLD_TAGS)[number];
export type TagFilter = DevTag | WorldTag;