import ArticleCard from './ArticleCard';
import type { Article } from '../types';
import feedData from '../../data/feed.json';

interface Props {
  articles: Article[];
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

export default function Feed({ articles, tab }: Props) {
  if (feedData.articles.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-dim)' }}>
        <p>No articles yet.</p>
        <p className="mt-2 text-sm">The daily fetch will populate this feed. Run it manually from the GitHub Actions tab.</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-dim)' }}>
        <p>No {tab === 'dev' ? 'tech' : 'world'} articles match your filters.</p>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
              {section.label}
            </h3>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
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