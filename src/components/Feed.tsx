import ArticleCard from './ArticleCard';
import type { Article } from '../types';
import feedData from '../../data/feed.json';

interface Props {
  articles: Article[];
  onToggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  tab: 'dev' | 'world';
}

function groupByTime(articles: Article[]) {
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

export default function Feed({ articles, onToggleBookmark, isBookmarked, tab }: Props) {
  if (feedData.articles.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-base text-gray-400 dark:text-gray-500">No articles yet.</p>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          The daily fetch will populate this feed. Run it manually from the GitHub Actions tab.
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-base text-gray-400 dark:text-gray-500">
          No {tab === 'dev' ? 'developer' : 'world'} articles match your filters.
        </p>
      </div>
    );
  }

  const { today, yesterday, earlier } = groupByTime(articles);

  const sections = [
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'Earlier', items: earlier },
  ].filter((s) => s.items.length > 0);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sections.map((section) => (
        <div key={section.label} className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {section.label}
          </h3>
          <div className="space-y-4">
            {section.items.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isBookmarked={isBookmarked(article.id)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}