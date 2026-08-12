# DevNews AI

Daily AI-summarized developer news digest — zero-cost, fully automated.

**[z4d4ly.github.io/ai-news-app](https://z4d4ly.github.io/ai-news-app/)**

## How it works

```
Daily at 6 AM UTC
  └─ GitHub Action fetches top 30 stories (HN + Dev.to)
       └─ GPT-4o-mini via OpenRouter batch-summarizes all new articles
            └─ Commits to data/feed.json
                 └─ Auto-deploys React site to GitHub Pages
```

## Setup your own

1. Fork this repo
2. Add `OPENROUTER_API_KEY` to Settings → Secrets and variables → Actions
3. Enable Pages: Settings → Pages → Source: **GitHub Actions**
4. Go to Actions → "Fetch & Summarize News" → Run workflow

## Tech

| Layer | Stack |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend/Cron | GitHub Actions (schedule trigger) |
| AI | OpenRouter (GPT-4o-mini) |
| Database | JSON file in repo (version-controlled) |
| Hosting | GitHub Pages |
| Search | Fuse.js (client-side) |

## Sources

- Hacker News top stories (`hacker-news.firebaseio.com`)
- DEV Community top articles (`dev.to/api`)

## Cost

**$0/month** — GitHub free tier + OpenRouter free model. With GPT-4o-mini: ~$0.01/day.

## License

MIT