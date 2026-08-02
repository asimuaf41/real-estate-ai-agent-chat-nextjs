# AI Agent Chat

Next.js App Router application with integrated AI chat API routes (formerly a separate Express backend). Deploy as a single Vercel project.

## Assistants

- Web Search Research Agent (with long-term memory)
- Real Estate RAG Assistant
- Weather Assistant
- Multi-Agent Real Estate Orchestrator

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in server-side secrets (never use `NEXT_PUBLIC_` for API keys).
2. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

API routes live under `/api/...` (same origin as the UI).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |

## Vercel environment variables

Add these in the Vercel project settings (Production + Preview):

- `ANTHROPIC_API_KEY`
- `WEATHER_API_KEY`
- `TAVILY_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEFAULT_USER_ID` (optional; defaults to `asim-ali-001`)

Do **not** set `NEXT_PUBLIC_API_BASE_URL` on Vercel — the app uses relative `/api` paths.

## Deploy

1. Push this repo to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add the environment variables above.
4. Deploy. Framework preset: Next.js (default).

## Serverless notes

- Weather reports, markdown reports, and email outbox are written under `data/` locally, or `/tmp` on Vercel (ephemeral — not durable across cold starts).
- Embeddings use `@xenova/transformers` (Node runtime). First invocation may download the model into `/tmp` and can be slow/cold.
- Agent streaming routes set `maxDuration = 60`. Multi-agent workflows may hit plan timeouts on Hobby; Pro is recommended for long streams.
- In-memory rate limiting (8 req/min) is per serverless instance, not globally exact.
