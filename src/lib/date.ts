import type { Article } from '../types';

export interface GroupedArticles {
  today: Article[];
  yesterday: Article[];
  earlier: Article[];
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'now';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function groupByTime(articles: Article[]): GroupedArticles {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const today: Article[] = [];
  const yesterday: Article[] = [];
  const earlier: Article[] = [];

  for (const a of articles) {
    const d = new Date(a.date).getTime();
    if (d >= todayStart.getTime()) today.push(a);
    else if (d >= yesterdayStart.getTime()) yesterday.push(a);
    else earlier.push(a);
  }

  return { today, yesterday, earlier };
}
