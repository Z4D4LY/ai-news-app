import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import type { Article, Feed, Source, TabType } from '../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FEED_PATH = resolve(__dirname, '..', 'data', 'feed.json');

interface RawEntry {
  title: string;
  url: string;
  source: Source;
  score: number;
  description: string;
  date: string;
  type?: TabType;
}

interface HnItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
}

interface DevToArticle {
  title: string;
  url: string;
  positive_reactions_count: number;
  description: string;
  published_at: string;
}

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
}

interface RssSource {
  url: string;
  source: Source;
  limit: number;
}

const RSS_SOURCES: Record<string, RssSource> = {
  gnUS: {
    url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en',
    source: 'googlenews',
    limit: 10,
  },
  npr: { url: 'https://feeds.npr.org/1001/rss.xml', source: 'npr', limit: 10 },
  bbcUS: {
    url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml',
    source: 'bbc',
    limit: 8,
  },
  bbcEU: { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', source: 'bbc', limit: 8 },
  f24EU: { url: 'https://www.france24.com/en/europe/rss', source: 'france24', limit: 8 },
  gnMA: {
    url: 'https://news.google.com/rss/search?q=Morocco&hl=en&gl=MA&ceid=MA:en',
    source: 'googlenews',
    limit: 10,
  },
  mwn: { url: 'https://www.moroccoworldnews.com/feed/', source: 'moroccoworldnews', limit: 10 },
  hespress: { url: 'https://en.hespress.com/feed', source: 'hespress', limit: 10 },
  bbcAS: { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'bbc', limit: 8 },
  gnAS: {
    url: 'https://news.google.com/rss/search?q=Asia&hl=en&gl=SG&ceid=SG:en',
    source: 'googlenews',
    limit: 8,
  },
};

function saveFeed(feed: Feed): void {
  writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2) + '\n');
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json() as Promise<T>;
}

async function fetchHackerNews(): Promise<RawEntry[]> {
  console.log('Fetching Hacker News...');
  const topIds = await fetchJson<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json');
  const sliced = topIds.slice(0, 15);

  const items = await Promise.all(
    sliced.map(async (id) => {
      try {
        return await fetchJson<HnItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      } catch {
        return null;
      }
    }),
  );

  return items
    .filter((i): i is HnItem => i !== null && !!i.url)
    .map((i) => ({
      title: i.title,
      url: i.url!,
      source: 'hackernews' as const,
      score: i.score ?? 0,
      description: '',
      date: new Date((i.time ?? 0) * 1000).toISOString(),
    }));
}

async function fetchDevTo(): Promise<RawEntry[]> {
  console.log('Fetching Dev.to...');
  const items = await fetchJson<DevToArticle[]>('https://dev.to/api/articles?top=1&per_page=15');
  return items.map((a) => ({
    title: a.title,
    url: a.url,
    source: 'devto' as const,
    score: a.positive_reactions_count ?? 0,
    description: a.description ?? '',
    date: a.published_at ?? new Date().toISOString(),
  }));
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  processEntities: false,
  htmlEntities: false,
});

async function fetchRSS(url: string, source: Source, limit = 10): Promise<RawEntry[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  return items.slice(0, limit).map((item: RssItem) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    source,
    score: 0,
    description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
  }));
}

async function fetchRssSources(): Promise<Record<string, RawEntry[]>> {
  const entries = await Promise.all(
    Object.entries(RSS_SOURCES).map(async ([key, s]): Promise<[string, RawEntry[]]> => {
      try {
        return [key, await fetchRSS(s.url, s.source, s.limit)];
      } catch (err) {
        console.warn(`Fetch failed for "${key}" — ${err}`);
        return [key, []];
      }
    }),
  );
  return Object.fromEntries(entries);
}

function parseSummary(raw: string): string | null {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed?.summary === 'string' && parsed.summary.trim()) {
      return parsed.summary.trim();
    }
  } catch {
    /* fall through to regex */
  }

  const match = cleaned.match(/"summary"\s*:\s*"([\s\S]*?)"\s*}/);
  if (match && match[1].trim()) return match[1].trim();

  if (cleaned.length >= 20) return cleaned;

  return null;
}

async function summarizeArticle(entry: RawEntry): Promise<Omit<Article, 'id' | 'date'>> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      title: entry.title,
      url: entry.url,
      source: entry.source,
      score: entry.score,
      summary: entry.description || 'No summary available.',
      type: entry.type ?? 'tech',
    };
  }

  const prompt = `Write a detailed 3-4 sentence summary of the article below covering the key facts and why it matters. Be specific — use real details from the article, not generic fluff.

Try to read the actual article at the URL. If the URL is inaccessible, base your summary entirely on the provided title and description. ALWAYS produce a real, useful summary — never say you can't.

Return ONLY this JSON: {"summary":"your summary here"}

URL: ${entry.url}
Title: ${entry.title}
Description: ${entry.description || 'N/A'}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as OpenRouterResponse;
    const raw = (body.choices?.[0]?.message?.content ?? '').trim();

    const summary = parseSummary(raw);
    if (summary) {
      return {
        title: entry.title,
        url: entry.url,
        source: entry.source,
        score: entry.score,
        summary,
        type: entry.type ?? 'tech',
      };
    }
    throw new Error('empty response');
  } catch (err) {
    console.warn(`Summarize failed for "${entry.title.slice(0, 50)}" — ${err}`);
    return {
      title: entry.title,
      url: entry.url,
      source: entry.source,
      score: entry.score,
      summary: entry.description || 'A summary could not be generated — read the full article.',
      type: entry.type ?? 'tech',
    };
  }
}

async function summarizeAll(entries: RawEntry[]): Promise<Omit<Article, 'id' | 'date'>[]> {
  const results: Omit<Article, 'id' | 'date'>[] = [];
  const concurrency = 5;

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    console.log(
      `  Summarizing ${i + 1}-${Math.min(i + concurrency, entries.length)}/${entries.length}...`,
    );
    const batchResults = await Promise.all(batch.map((e) => summarizeArticle(e)));
    results.push(...batchResults);
  }

  return results;
}

function generateId(source: Source, url: string): string {
  const hash = createHash('sha256').update(url).digest('base64url').slice(0, 12);
  return `${source.substring(0, 2)}-${hash}`;
}

async function processTab(
  label: string,
  entries: RawEntry[],
  tabType: TabType,
  limit: number,
  seenUrls: Set<string>,
): Promise<Article[]> {
  console.log(`\n--- ${label} ---`);
  const labeled: RawEntry[] = entries.map((e) => ({ ...e, type: tabType }));
  const deduped = labeled.filter((e) => {
    if (seenUrls.has(e.url)) return false;
    seenUrls.add(e.url);
    return true;
  });
  console.log(`Fetched ${labeled.length}, new ${deduped.length}`);

  if (deduped.length === 0) return [];

  console.log(`Summarizing ${deduped.length} ${label.toLowerCase()} articles...`);
  const summarized = await summarizeAll(deduped);
  const articles: Article[] = summarized.map((s, i) => ({
    id: generateId(s.source, s.url),
    title: s.title,
    url: s.url,
    source: s.source,
    score: s.score,
    summary: s.summary,
    date: deduped[i].date,
    type: s.type,
  }));

  return articles
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

function get<T>(r: PromiseSettledResult<T>): T {
  return r.status === 'fulfilled' ? r.value : ([] as T);
}

async function main() {
  const now = new Date().toISOString();

  const [hn, devto] = await Promise.allSettled([fetchHackerNews(), fetchDevTo()]);
  const rss = await fetchRssSources();

  const seenUrls = new Set<string>();

  const techArticles = await processTab(
    'TECH',
    [...get(hn).slice(0, 12), ...get(devto).slice(0, 8)],
    'tech',
    20,
    seenUrls,
  );

  const europeArticles = await processTab(
    'EUROPE',
    [...rss.bbcEU, ...rss.f24EU],
    'europe',
    10,
    seenUrls,
  );

  const usArticles = await processTab(
    'US',
    [...rss.gnUS.slice(0, 5), ...rss.npr.slice(0, 5), ...rss.bbcUS.slice(0, 4)],
    'us',
    10,
    seenUrls,
  );

  const moroccoArticles = await processTab(
    'MOROCCO',
    [...rss.gnMA, ...rss.mwn, ...rss.hespress],
    'morocco',
    10,
    seenUrls,
  );

  const asiaArticles = await processTab('ASIA', [...rss.bbcAS, ...rss.gnAS], 'asia', 10, seenUrls);

  const allArticles = [
    ...techArticles,
    ...europeArticles,
    ...usArticles,
    ...moroccoArticles,
    ...asiaArticles,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allArticles.length === 0) {
    console.log('No articles produced — keeping previous feed.');
    return;
  }

  saveFeed({ updated: now, articles: allArticles });
  const counts = { tech: 0, europe: 0, us: 0, morocco: 0, asia: 0 };
  for (const a of allArticles) counts[a.type]++;
  console.log(
    `Saved ${allArticles.length} articles (T:${counts.tech} EU:${counts.europe} US:${counts.us} MA:${counts.morocco} AS:${counts.asia}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
