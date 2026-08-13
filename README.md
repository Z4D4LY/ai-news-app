# Atlas Daily Digest

Daily AI-summarized news digest — zero-cost, fully automated.

**[z4d4ly.github.io/atlas-daily-digest](https://z4d4ly.github.io/atlas-daily-digest/)**

## How it works

```
Daily at 6 AM UTC
  └─ GitHub Action fetches ~60 articles from 10+ region-scoped sources
       └─ Perplexity (perplexity/sonar via OpenRouter) summarizes each article with web access
            └─ Commits the results to data/feed.json
                 └─ Auto-deploys the React site to GitHub Pages
```

The site is organized into 5 tabs, each scoped to a specific region so every tab
shows niche, region-relevant news rather than the same global headlines:

| Tab  | Focus          | Sources                                             |
| ---- | -------------- | --------------------------------------------------- |
| Tech | Developer news | Hacker News, Dev.to                                 |
| EU   | Europe         | BBC Europe, France 24 Europe                        |
| US   | United States  | Google News (US national), NPR, BBC US & Canada     |
| MA   | Morocco        | Google News (Morocco), Morocco World News, Hespress |
| Asia | Asia           | BBC Asia, Google News (Asia)                        |

## Features

- Fresh daily feed, overwritten each run (no history/tags/bookmarks)
- Per-article AI summaries with a robust fallback (never empty)
- Region-specific tabs so US/EU/MA/Asia don't show the same global news
- Dark/light theme (auto-detect + manual toggle) and an **A / A+ / A++** text-size control
- Mobile-friendly, larger readable typography

## Setup your own

1. Fork this repo
2. Add `OPENROUTER_API_KEY` to Settings → Secrets and variables → Actions
3. Enable Pages: Settings → Pages → Source: **GitHub Actions**
4. Go to Actions → "Fetch & Summarize News" → Run workflow

## Tech

| Layer        | Stack                                    |
| ------------ | ---------------------------------------- |
| Frontend     | React + Vite + TypeScript + Tailwind CSS |
| Backend/Cron | GitHub Actions (schedule trigger)        |
| AI           | OpenRouter (`perplexity/sonar`)          |
| Database     | JSON file in repo (version-controlled)   |
| Hosting      | GitHub Pages                             |

## Cost

Hosting and CI are free (GitHub Pages + Actions). The only cost is AI
summarization via OpenRouter's [`perplexity/sonar`](https://openrouter.ai/perplexity/sonar)
($1 per 1M input + $1 per 1M output tokens), which works out to roughly
**$0.03–0.05/day (~$1/month)** for ~60 summaries.

To make it fully $0, swap `model` in `scripts/fetch-and-summarize.ts` for a free
OpenRouter model — but note that free models lack Perplexity's live web search,
so summaries would be based on the title/description only.

## License

MIT
