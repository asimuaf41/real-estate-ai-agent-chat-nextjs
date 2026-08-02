import os from "os";
import path from "path";
import { pipeline } from "@xenova/transformers";

// On Vercel the project filesystem is read-only; cache models under /tmp.
if (process.env.VERCEL && !process.env.TRANSFORMERS_CACHE) {
  process.env.TRANSFORMERS_CACHE = path.join(
    os.tmpdir(),
    "transformers-cache",
  );
}

const globalForEmbedder = globalThis;

async function getEmbedder() {
  if (!globalForEmbedder.__chatAiEmbedderPromise) {
    globalForEmbedder.__chatAiEmbedderPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }

  return globalForEmbedder.__chatAiEmbedderPromise;
}

export async function generateEmbedding(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
