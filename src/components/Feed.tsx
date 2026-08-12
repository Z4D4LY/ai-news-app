import ArticleCard from './ArticleCard';
import type { Article } from '../types';
import feedData from '../../data/feed.json';

interface Props {
  articles: Article[];
  onToggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

export default function Feed({ articles, onToggleBookmark, isBookmarked }: Props) {
  if (feedData.articles.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 dark:text-gray-600">No articles yet.</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">
          The daily fetch will populate this feed. Run it manually from the GitHub Actions tab.
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400 dark:text-gray-600">No articles match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.length} article{articles.length !== 1 ? 's' : ''}
      <div className="space-y-3 mt-2">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isBookmarked={isBookmarked(article.id)}
            onToggleBookmark={onToggleBookmark}
          />
        ))}
      </div>
    </div>
  );
}