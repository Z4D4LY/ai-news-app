import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FEED_PATH = resolve(__dirname, '..', 'data', 'feed.json');

const DEV_TAG_OPTIONS = ['AI/ML', 'Frontend', 'Backend', 'DevOps', 'Security', 'Open Source', 'General'] as const;
const WORLD_TAG_OPTIONS = ['Politics', 'Tech & Science', 'Business', 'Health', 'Climate', 'General'] as const;

interface Article {
  id: string;
  title: string;
  url: string;
  source: 'hackernews' | 'reddit' | 'devto' | 'googlenews' | 'bbc' | 'npr';
  score: number;
  summary: string;
  tag: string;
  date: string;
  type: 'dev' | 'world';
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

async function summarizeArticle(
  entry: RawEntry,
  type: 'dev' | 'world',
): Promise<Omit<Article, 'id' | 'date'> & { type: 'dev' | 'world' }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const tags = type === 'dev' ? DEV_TAG_OPTIONS.join(', ') : WORLD_TAG_OPTIONS.join(', ');
  const fallbackTag = 'General';

  if (!apiKey) {
    return {
      title: entry.title, url: entry.url, source: entry.source,
      score: entry.score, summary: entry.description || 'No summary available.',
      tag: fallbackTag, type,
    };
  }

  const devPrompt = `Visit this article URL and write a detailed 3-4 sentence technical summary. Cover the key technical insight, what stack/tools/technology is involved, and why it matters to a developer. Be specific — reference real details from the article, not generic fluff. Return ONLY this JSON: {"summary":"your summary here","tag":"one tag"}

URL: ${entry.url}
Title: ${entry.title}

Pick ONE tag from: ${tags}.`;

  const worldPrompt = `Visit this article URL and write a detailed 3-4 sentence news summary. Cover the key facts, who is affected, and why it matters globally. Be specific — reference real details from the article, not generic fluff. Return ONLY this JSON: {"summary":"your summary here","tag":"one tag"}

URL: ${entry.url}
Title: ${entry.title}

Pick ONE tag from: ${tags}.`;

  const prompt = type === 'dev' ? devPrompt : worldPrompt;

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

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const body = await res.json() as any;
    const raw = body?.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(
      raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    );

    return {
      title: entry.title,
      url: entry.url,
      source: entry.source,
      score: entry.score,
      summary: parsed.summary ?? 'No summary available.',
      tag: (type === 'dev' ? DEV_TAG_OPTIONS : WORLD_TAG_OPTIONS).includes(parsed.tag as any)
        ? parsed.tag : fallbackTag,
      type,
    };
  } catch (err) {
    console.warn(`Summarize failed for "${entry.title.slice(0, 50)}" — ${err}`);
    return {
      title: entry.title, url: entry.url, source: entry.source,
      score: entry.score, summary: entry.description || 'No summary available.',
      tag: fallbackTag, type,
    };
  }
}

async function summarizeAll(
  entries: RawEntry[],
  type: 'dev' | 'world',
): Promise<(Omit<Article, 'id' | 'date'> & { type: 'dev' | 'world' })[]> {
  const results: (Omit<Article, 'id' | 'date'> & { type: 'dev' | 'world' })[] = [];
  const concurrency = 5;

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    console.log(`  Summarizing ${type} articles ${i + 1}-${Math.min(i + concurrency, entries.length)}/${entries.length}...`);
    const batchResults = await Promise.all(
      batch.map((e) => summarizeArticle(e, type))
    );
    results.push(...batchResults);
  }

  return results;
}

function generateId(source: Article['source'], url: string): string {
  const hash = createHash('sha256').update(url).digest('base64url').slice(0, 12);
  return `${source.substring(0, 2)}-${hash}`;
}

async function main() {
  const now = new Date().toISOString();

  // ---- FETCH ----
  const [hn, devto] = await Promise.allSettled([fetchHackerNews(), fetchDevTo()]);
  if (hn.status === 'rejected') console.error('HN fetch failed:', hn.reason);
  if (devto.status === 'rejected') console.error('Dev.to fetch failed:', devto.reason);

  const [googleNews, bbc, npr] = await Promise.allSettled([fetchGoogleNews(), fetchBBC(), fetchNPR()]);
  if (googleNews.status === 'rejected') console.error('Google News fetch failed:', googleNews.reason);
  if (bbc.status === 'rejected') console.error('BBC fetch failed:', bbc.reason);
  if (npr.status === 'rejected') console.error('NPR fetch failed:', npr.reason);

  const devRaw: RawEntry[] = [
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(devto.status === 'fulfilled' ? devto.value : []),
  ];
  const worldRaw: RawEntry[] = [
    ...(googleNews.status === 'fulfilled' ? googleNews.value : []),
    ...(bbc.status === 'fulfilled' ? bbc.value : []),
    ...(npr.status === 'fulfilled' ? npr.value : []),
  ];

  // Dedup within batch (URL only)
  const seenUrls = new Set<string>();
  const dedupedDev = devRaw.filter((e) => { if (seenUrls.has(e.url)) return false; seenUrls.add(e.url); return true; });
  const dedupedWorld = worldRaw.filter((e) => { if (seenUrls.has(e.url)) return false; seenUrls.add(e.url); return true; });

  console.log(`DEV: ${dedupedDev.length} articles | WORLD: ${dedupedWorld.length} articles`);

  // ---- SUMMARIZE ----
  if (dedupedDev.length > 0) {
    console.log(`Summarizing ${dedupedDev.length} dev articles...`);
    var devSummarized = await summarizeAll(dedupedDev, 'dev');
  } else var devSummarized: typeof devSummarized = [];
  if (dedupedWorld.length > 0) {
    console.log(`Summarizing ${dedupedWorld.length} world articles...`);
    var worldSummarized = await summarizeAll(dedupedWorld, 'world');
  } else var worldSummarized: typeof worldSummarized = [];

  const devArticles: Article[] = devSummarized.map((s, i) => ({
    id: generateId(s.source, s.url), title: s.title, url: s.url, source: s.source,
    score: s.score, summary: s.summary, tag: s.tag, date: dedupedDev[i].date, type: s.type,
  }));
  const worldArticles: Article[] = worldSummarized.map((s, i) => ({
    id: generateId(s.source, s.url), title: s.title, url: s.url, source: s.source,
    score: s.score, summary: s.summary, tag: s.tag, date: dedupedWorld[i].date, type: s.type,
  }));

  const devSorted = devArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
  const worldSorted = worldArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
  const allArticles = [...devSorted, ...worldSorted]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ---- SAVE ----
  if (allArticles.length === 0) {
    console.log('No articles produced — keeping previous feed.');
    return;
  }

  saveFeed({ updated: now, articles: allArticles });
  const devCount = allArticles.filter((a) => a.type === 'dev').length;
  const worldCount = allArticles.filter((a) => a.type === 'world').length;
  console.log(`Saved ${allArticles.length} articles (${devCount} dev, ${worldCount} world).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});