import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FEED_PATH = resolve(__dirname, '..', 'data', 'feed.json');

interface Article {
  id: string;
  title: string;
  url: string;
  source: 'hackernews' | 'devto' | 'googlenews' | 'bbc' | 'npr' | 'france24' | 'moroccoworldnews';
  score: number;
  summary: string;
  date: string;
  type: 'tech' | 'europe' | 'us' | 'morocco' | 'asia';
}

interface Feed {
  updated: string;
  articles: Article[];
}



interface RawEntry {
  title: string;
  url: string;
  source: Article['source'];
  score: number;
  description: string;
  date: string;
  type?: Article['type'];
}

function saveFeed(feed: Feed): void {
  writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2) + '\n');
}

async function fetchHackerNews(): Promise<RawEntry[]> {
  console.log('Fetching Hacker News...');
  const topIds = await fetchJson<number[]>(
    'https://hacker-news.firebaseio.com/v0/topstories.json'
  );
  const sliced = topIds.slice(0, 15);

  const items = await Promise.all(
    sliced.map(async (id) => {
      try {
        return await fetchJson<{
          id: number;
          title: string;
          url?: string;
          score: number;
          time: number;
        }>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      } catch {
        return null;
      }
    })
  );

  return items
    .filter((i): i is NonNullable<typeof i> => i !== null && !!i.url)
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
  const items = await fetchJson<any[]>(
    'https://dev.to/api/articles?top=1&per_page=15'
  );
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

async function fetchGoogleNews(): Promise<RawEntry[]> {
  console.log('Fetching Google News...');
  const res = await fetch('https://news.google.com/rss?hl=en&gl=US&ceid=US:en');
  if (!res.ok) throw new Error(`HTTP ${res.status} from Google News`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  return items.slice(0, 10).map((item: any) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    source: 'googlenews' as const,
    score: 0,
    description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
  }));
}

async function fetchBBC(): Promise<RawEntry[]> {
  console.log('Fetching BBC News...');
  const res = await fetch('https://feeds.bbci.co.uk/news/world/rss.xml');
  if (!res.ok) throw new Error(`HTTP ${res.status} from BBC`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  return items.slice(0, 10).map((item: any) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    source: 'bbc' as const,
    score: 0,
    description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
  }));
}

async function fetchNPR(): Promise<RawEntry[]> {
  console.log('Fetching NPR News...');
  const res = await fetch('https://feeds.npr.org/1001/rss.xml');
  if (!res.ok) throw new Error(`HTTP ${res.status} from NPR`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  return items.slice(0, 10).map((item: any) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    source: 'npr' as const,
    score: 0,
    description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
  }));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json() as Promise<T>;
}

async function fetchRSS(url: string, source: Article['source'], limit = 10): Promise<RawEntry[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? [];
  return items.slice(0, limit).map((item: any) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    source,
    score: 0,
    description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
    date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
  }));
}

async function summarizeArticle(
  entry: RawEntry,
): Promise<Omit<Article, 'id' | 'date'> & { type: Article['type'] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      title: entry.title, url: entry.url, source: entry.source,
      score: entry.score, summary: entry.description || 'No summary available.',
      type: entry.type ?? 'tech',
    };
  }

  const prompt = `Visit this article URL and write a detailed 3-4 sentence summary covering the key facts and why it matters. Be specific — use real details from the article, not generic fluff. Return ONLY this JSON: {"summary":"your summary here"}

URL: ${entry.url}
Title: ${entry.title}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 350,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json() as any;
    const raw = body?.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(
      raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    );

    return {
      title: entry.title, url: entry.url, source: entry.source,
      score: entry.score, summary: parsed.summary ?? 'No summary available.',
      type: entry.type ?? 'tech',
    };
  } catch (err) {
    console.warn(`Summarize failed for "${entry.title.slice(0, 50)}" — ${err}`);
    return {
      title: entry.title, url: entry.url, source: entry.source,
      score: entry.score, summary: entry.description || 'No summary available.',
      type: entry.type ?? 'tech',
    };
  }
}

async function summarizeAll(
  entries: RawEntry[],
): Promise<(Omit<Article, 'id' | 'date'> & { type: Article['type'] })[]> {
  const results: (Omit<Article, 'id' | 'date'> & { type: Article['type'] })[] = [];
  const concurrency = 5;

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    console.log(`  Summarizing ${i + 1}-${Math.min(i + concurrency, entries.length)}/${entries.length}...`);
    const batchResults = await Promise.all(batch.map((e) => summarizeArticle(e)));
    results.push(...batchResults);
  }

  return results;
}

function generateId(source: Article['source'], url: string): string {
  const hash = createHash('sha256').update(url).digest('base64url').slice(0, 12);
  return `${source.substring(0, 2)}-${hash}`;
}

async function processTab(
  label: string,
  entries: RawEntry[],
  tabType: Article['type'],
  limit: number,
  seenUrls: Set<string>,
): Promise<Article[]> {
  console.log(`\n--- ${label} ---`);
  const labeled: RawEntry[] = entries.map((e) => ({ ...e, type: tabType }));
  const deduped = labeled.filter((e) => { if (seenUrls.has(e.url)) return false; seenUrls.add(e.url); return true; });
  console.log(`Fetched ${labeled.length}, new ${deduped.length}`);

  if (deduped.length === 0) return [];

  console.log(`Summarizing ${deduped.length} ${label.toLowerCase()} articles...`);
  const summarized = await summarizeAll(deduped);
  const articles: Article[] = summarized.map((s, i) => ({
    id: generateId(s.source, s.url), title: s.title, url: s.url, source: s.source,
    score: s.score, summary: s.summary, date: deduped[i].date, type: s.type,
  }));

  return articles
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

async function main() {
  const now = new Date().toISOString();

  // ---- FETCH ALL SOURCES ----
  const [hn, devto, googleNews, bbc, npr, mwn, f24, gnEU, gnMA, gnAS] = await Promise.allSettled([
    fetchHackerNews(),
    fetchDevTo(),
    fetchGoogleNews(),
    fetchBBC(),
    fetchNPR(),
    fetchRSS('https://www.moroccoworldnews.com/feed/', 'moroccoworldnews', 8),
    fetchRSS('https://www.france24.com/en/rss', 'france24', 5),
    fetchRSS('https://news.google.com/rss?hl=en&gl=EU&ceid=EU:en', 'googlenews', 5),
    fetchRSS('https://news.google.com/rss?hl=en&gl=MA&ceid=MA:en', 'googlenews', 7),
    fetchRSS('https://news.google.com/rss?hl=en&gl=IN&ceid=IN:en', 'googlenews', 5),
  ]);

  const get = (r: PromiseSettledResult<RawEntry[]>): RawEntry[] =>
    r.status === 'fulfilled' ? r.value : [];

  // ---- PROCESS EACH TAB ----
  const seenUrls = new Set<string>();

  const techArticles = await processTab('TECH', [
    ...get(hn).slice(0, 12), ...get(devto).slice(0, 8),
  ], 'tech', 20, seenUrls);

  const europeArticles = await processTab('EUROPE', [
    ...get(gnEU), ...get(f24),
  ], 'europe', 10, seenUrls);

  const usArticles = await processTab('US', [
    ...get(googleNews).slice(0, 5), ...get(npr).slice(0, 5),
  ], 'us', 10, seenUrls);

  const moroccoArticles = await processTab('MOROCCO', [
    ...get(mwn), ...get(gnMA),
  ], 'morocco', 10, seenUrls);

  const asiaArticles = await processTab('ASIA', [
    ...get(gnAS), ...get(bbc).slice(0, 5),
  ], 'asia', 10, seenUrls);

  const allArticles = [...techArticles, ...europeArticles, ...usArticles, ...moroccoArticles, ...asiaArticles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ---- SAVE ----
  if (allArticles.length === 0) {
    console.log('No articles produced — keeping previous feed.');
    return;
  }

  saveFeed({ updated: now, articles: allArticles });
  const counts = { tech: 0, europe: 0, us: 0, morocco: 0, asia: 0 };
  for (const a of allArticles) counts[a.type]++;
  console.log(`Saved ${allArticles.length} articles (T:${counts.tech} EU:${counts.europe} US:${counts.us} MA:${counts.morocco} AS:${counts.asia}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});