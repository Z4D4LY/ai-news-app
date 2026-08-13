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
  source: 'hackernews' | 'devto' | 'googlenews' | 'bbc' | 'npr' | 'france24' | 'moroccoworldnews' | 'hespress';
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
        'Authorization': `Bearer ${apiKey}`,
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
    const body = await res.json() as any;
    const raw = (body?.choices?.[0]?.message?.content ?? '').trim();

    const summary = parseSummary(raw);
    if (summary) {
      return {
        title: entry.title, url: entry.url, source: entry.source,
        score: entry.score, summary,
        type: entry.type ?? 'tech',
      };
    }
    throw new Error('empty response');
  } catch (err) {
    console.warn(`Summarize failed for "${entry.title.slice(0, 50)}" — ${err}`);
    return {
      title: entry.title, url: entry.url, source: entry.source,
      score: entry.score, summary: entry.description || 'A summary could not be generated — read the full article.',
      type: entry.type ?? 'tech',
    };
  }
}

function parseSummary(raw: string): string | null {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
  const [hn, devto, gnUS, npr, bbcUS, bbcEU, f24EU, gnMA, mwn, hespress, bbcAS, gnAS] = await Promise.allSettled([
    fetchHackerNews(),
    fetchDevTo(),
    fetchRSS('https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en', 'googlenews', 10),
    fetchRSS('https://feeds.npr.org/1001/rss.xml', 'npr', 10),
    fetchRSS('https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', 'bbc', 8),
    fetchRSS('https://feeds.bbci.co.uk/news/world/europe/rss.xml', 'bbc', 8),
    fetchRSS('https://www.france24.com/en/europe/rss', 'france24', 8),
    fetchRSS('https://news.google.com/rss/search?q=Morocco&hl=en&gl=MA&ceid=MA:en', 'googlenews', 10),
    fetchRSS('https://www.moroccoworldnews.com/feed/', 'moroccoworldnews', 10),
    fetchRSS('https://en.hespress.com/feed', 'hespress', 10),
    fetchRSS('https://feeds.bbci.co.uk/news/world/asia/rss.xml', 'bbc', 8),
    fetchRSS('https://news.google.com/rss/search?q=Asia&hl=en&gl=SG&ceid=SG:en', 'googlenews', 8),
  ]);

  const get = (r: PromiseSettledResult<RawEntry[]> | undefined): RawEntry[] =>
    r?.status === 'fulfilled' ? r.value : [];

  // ---- PROCESS EACH TAB ----
  const seenUrls = new Set<string>();

  const techArticles = await processTab('TECH', [
    ...get(hn).slice(0, 12), ...get(devto).slice(0, 8),
  ], 'tech', 20, seenUrls);

  const europeArticles = await processTab('EUROPE', [
    ...get(bbcEU), ...get(f24EU),
  ], 'europe', 10, seenUrls);

  const usArticles = await processTab('US', [
    ...get(gnUS).slice(0, 5), ...get(npr).slice(0, 5), ...get(bbcUS).slice(0, 4),
  ], 'us', 10, seenUrls);

  const moroccoArticles = await processTab('MOROCCO', [
    ...get(gnMA), ...get(mwn), ...get(hespress),
  ], 'morocco', 10, seenUrls);

  const asiaArticles = await processTab('ASIA', [
    ...get(bbcAS), ...get(gnAS),
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