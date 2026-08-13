export interface Article {
  id: string;
  title: string;
  url: string;
  source: 'hackernews' | 'devto' | 'googlenews' | 'bbc' | 'npr' | 'france24' | 'moroccoworldnews' | 'hespress';
  score: number;
  summary: string;
  date: string;
  type: 'tech' | 'europe' | 'us' | 'morocco' | 'asia';
}

export interface Feed {
  updated: string;
  articles: Article[];
}

export type TabType = 'tech' | 'europe' | 'us' | 'morocco' | 'asia';

export const TABS: { id: TabType; label: string }[] = [
  { id: 'tech', label: 'Tech' },
  { id: 'europe', label: 'EU' },
  { id: 'us', label: 'US' },
  { id: 'morocco', label: 'MA' },
  { id: 'asia', label: 'Asia' },
];

export type FontSize = 'normal' | 'large' | 'xl';

export const FONT_SIZES: Record<FontSize, number> = {
  normal: 16,
  large: 18,
  xl: 20,
};