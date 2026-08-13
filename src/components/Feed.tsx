import ArticleCard from './ArticleCard';
import type { Article } from '../types';
import { groupByTime } from '../lib/date';
import feedData from '../../data/feed.json';

interface Props {
  articles: Article[];
}

export default function Feed({ articles }: Props) {
  if (feedData.articles.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-dim)' }}>
        <p>No articles yet.</p>
        <p className="mt-2 text-sm">
          The daily fetch will populate this feed. Run it manually from the GitHub Actions tab.
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-dim)' }}>
        <p>No articles match for this section.</p>
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
    <div>
      {sections.map((section) => (
        <div key={section.label} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h3
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-dim)' }}
            >
              {section.label}
            </h3>
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {section.items.length}
            </span>
          </div>
          <hr className="divider mb-1" />
          {section.items.map((article, i) => (
            <div key={article.id}>
              <ArticleCard article={article} index={i} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
