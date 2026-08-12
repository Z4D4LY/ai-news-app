import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FEED_PATH = resolve(__dirname, '..', 'data', 'feed.json');
const MAX_ARTICLES = 200;

const TAG_OPTIONS = ['AI/ML', 'Frontend', 'Backend', 'DevOps', 'Security', 'Open Source', 'General'] as const;

interface Article {
  id: string;
  title: string;
  url: string;
  source: 'hackernews' | 'reddit' | 'devto';
  score: number;
  summary: string;
  tag: string;
  date: string;
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

function loadFeed(): Feed {
  try {
    const raw = readFileSync(FEED_PATH, 'utf-8');
    const feed: Feed = JSON.parse(raw);
    if (!Array.isArray(feed.articles)) feed.articles = [];
    return feed;
  } catch {
    return { updated: '', articles: [] };
  }
}

function saveFeed(feed: Feed): void {
  writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2) + '\n');
}

async function fetchHackerNews(): Promise<RawEntry[]> {
  console.log('Fetching Hacker News...');
  const topIds = await fetchJson<number[]>(
    'https://hacker-news.firebaseio.com/v0/topstories.json'
  );
  const sliced = topIds.slice(0, 20);

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
    'https://dev.to/api/articles?top=1&per_page=10'
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json() as Promise<T>;
}

async function summarizeBatch(entries: RawEntry[]): Promise<Omit<Article, 'id' | 'date'>[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('No OPENROUTER_API_KEY set — storing without summaries.');
    return entries.map((e) => ({
      title: e.title,
      url: e.url,
      source: e.source,
      score: e.score,
      summary: e.description || 'No summary available.',
      tag: 'General',
    }));
  }

  const entryList = entries
    .map((e, i) => `${i + 1}. [${e.source}] ${e.title}\n   ${e.description}`)
    .join('\n\n');

  const prompt = `You are a technical editor writing for developers. For each article below, write a 2-3 sentence summary that captures the key technical insight, what stack/tools are involved, and why it matters to a developer. Pick ONE tag from: AI/ML, Frontend, Backend, DevOps, Security, Open Source, General.

Articles:
${entryList}

Return ONLY a valid JSON array. Each item: {"idx": <number starting at 1>, "summary": "...", "tag": "..."}`;

  console.log(`Calling OpenRouter for ${entries.length} articles...`);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    console.warn(`OpenRouter error ${res.status} — storing without summaries.`);
    return entries.map((e) => ({
      title: e.title,
      url: e.url,
      source: e.source,
      score: e.score,
      summary: e.description || 'No summary available.',
      tag: 'General',
    }));
  }

  const body = await res.json() as any;
  const raw = body?.choices?.[0]?.message?.content ?? '';

  try {
    const parsed = JSON.parse(
      raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    ) as { idx: number; summary: string; tag: string }[];

    return entries.map((e, i) => {
      const match = parsed.find((p: any) => p.idx === i + 1);
      return {
        title: e.title,
        url: e.url,
        source: e.source,
        score: e.score,
        summary: match?.summary ?? 'No summary available.',
        tag: TAG_OPTIONS.includes(match?.tag as any) ? match!.tag : 'General',
      };
    });
  } catch {
    console.warn('Failed to parse LLM response — storing without summaries.');
    return entries.map((e) => ({
      title: e.title,
      url: e.url,
      source: e.source,
      score: e.score,
      summary: e.description || 'No summary available.',
      tag: 'General',
    }));
  }
}

function generateId(source: Article['source'], url: string): string {
  const hash = Buffer.from(url).toString('base64').slice(0, 8);
  return `${source.substring(0, 2)}-${hash}`;
}

async function main() {
  const feed = loadFeed();
  const existingUrls = new Set(feed.articles.map((a) => a.url));
  const now = new Date().toISOString();

  const [hn, devto] = await Promise.allSettled([
    fetchHackerNews(),
    fetchDevTo(),
  ]);

  const allRaw: RawEntry[] = [
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(devto.status === 'fulfilled' ? devto.value : []),
  ];

  if (hn.status === 'rejected') console.error('HN fetch failed:', hn.reason);
  if (devto.status === 'rejected') console.error('Dev.to fetch failed:', devto.reason);

  const newEntries = allRaw.filter((e) => !existingUrls.has(e.url));

  const needsResummarize = feed.articles.filter(
    (a) => a.summary === 'No summary available.' || a.summary.length < 120
  );
  if (needsResummarize.length > 0) {
    console.log(`Re-summarizing ${needsResummarize.length} orphaned articles...`);
    const rawForRetry: RawEntry[] = needsResummarize.map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source,
      score: a.score,
      description: '',
      date: a.date,
    }));
    const retried = await summarizeBatch(rawForRetry);
    for (let i = 0; i < needsResummarize.length; i++) {
      needsResummarize[i].summary = retried[i].summary;
      needsResummarize[i].tag = retried[i].tag;
    }
  }

  console.log(`Total: ${allRaw.length} | New: ${newEntries.length}`);

  if (newEntries.length === 0) {
    console.log('No new articles. Skipping summarization.');
    return;
  }

  const summarized = await summarizeBatch(newEntries);

  const newArticles: Article[] = summarized.map((s, i) => ({
    id: generateId(s.source, s.url),
    title: s.title,
    url: s.url,
    source: s.source,
    score: s.score,
    summary: s.summary,
    tag: s.tag,
    date: newEntries[i].date,
  }));

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const pruned = feed.articles
    .concat(newArticles)
    .filter((a) => new Date(a.date).getTime() > oneWeekAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_ARTICLES);

  feed.updated = now;
  feed.articles = pruned;

  saveFeed(feed);
  console.log(`Saved ${feed.articles.length} articles.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});