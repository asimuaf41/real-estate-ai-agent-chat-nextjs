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
- `HF_TOKEN` (required for RAG/memory embeddings on Vercel)
- `DEFAULT_USER_ID` (optional; defaults to `asim-ali-001`)

Do **not** set `NEXT_PUBLIC_API_BASE_URL` on Vercel — the app uses relative `/api` paths.

## Embeddings on Vercel

`@xenova/transformers` needs native ONNX (`libonnxruntime.so`), which is **not available** on Vercel serverless. That caused the production error you saw.

On Vercel the app uses the **Hugging Face Inference API** with the same `all-MiniLM-L6-v2` model (384 dimensions — compatible with existing Supabase vectors).

1. Create a token at https://huggingface.co/settings/tokens with **Inference Providers** permission (read is not always enough for the router API).
2. Add `HF_TOKEN` in Vercel → Settings → Environment Variables
3. Redeploy

Do **not** use the old `api-inference.huggingface.co` host — it is retired and no longer resolves.

Local `npm run dev` still uses Xenova by default.

## Deploy

1. Push this repo to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add the environment variables above.
4. Deploy. Framework preset: Next.js (default).

## Serverless notes

- Weather reports, markdown reports, and email outbox are written under `data/` locally, or `/tmp` on Vercel (ephemeral — not durable across cold starts).
- Embeddings: Xenova locally; Hugging Face Inference API on Vercel (`HF_TOKEN` required).
- Agent streaming routes set `maxDuration = 60`. Multi-agent workflows may hit plan timeouts on Hobby; Pro is recommended for long streams.
- In-memory rate limiting (8 req/min) is per serverless instance, not globally exact.
