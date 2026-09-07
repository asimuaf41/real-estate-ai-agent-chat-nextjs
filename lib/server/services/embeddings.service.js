/**
 * Embedding generation.
 *
 * - Local: @xenova/transformers (ONNX native) — works on macOS/Linux desktops
 * - Vercel: Hugging Face Inference API — native onnxruntime .so is unavailable
 *   in serverless, which caused libonnxruntime.so.1.14.0 load failures.
 *
 * Model: all-MiniLM-L6-v2 → 384-dim vectors (compatible with existing Supabase rows).
 */

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
// api-inference.huggingface.co is retired (ENOTFOUND / 410). Use Inference Providers router only.
const HF_URLS = [
  `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`,
  `https://router.huggingface.co/hf-inference/pipeline/feature-extraction/${HF_MODEL}`,
];

const globalForEmbedder = globalThis;

function l2Normalize(vector) {
  let sumSquares = 0;
  for (const value of vector) sumSquares += value * value;
  const norm = Math.sqrt(sumSquares);
  if (!norm) return vector;
  return vector.map((value) => value / norm);
}

function meanPool(tokenVectors) {
  const dimensions = tokenVectors[0]?.length ?? 0;
  const pooled = new Array(dimensions).fill(0);

  for (const token of tokenVectors) {
    for (let i = 0; i < dimensions; i += 1) {
      pooled[i] += token[i];
    }
  }

  return pooled.map((value) => value / tokenVectors.length);
}

/**
 * HF may return:
 * - number[]                 → sentence embedding
 * - number[][]               → token embeddings OR batch of 1
 * - number[][][]             → batch of token matrices
 */
function toSentenceEmbedding(payload) {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected embedding response from Hugging Face");
  }

  if (typeof payload[0] === "number") {
    return l2Normalize(payload);
  }

  if (Array.isArray(payload[0]) && typeof payload[0][0] === "number") {
    // [[...384]] single sentence, or [[token][dims]] token matrix
    if (payload.length === 1) {
      return l2Normalize(payload[0]);
    }
    if (payload[0].length > 32) {
      // Likely token embeddings (seq_len x 384)
      return l2Normalize(meanPool(payload));
    }
    return l2Normalize(payload[0]);
  }

  if (
    Array.isArray(payload[0]) &&
    Array.isArray(payload[0][0]) &&
    typeof payload[0][0][0] === "number"
  ) {
    return l2Normalize(meanPool(payload[0]));
  }

  throw new Error("Could not parse embedding vector from Hugging Face response");
}

function getHuggingFaceToken() {
  return (
    process.env.HF_TOKEN ||
    process.env.HUGGINGFACE_API_TOKEN ||
    process.env.HUGGINGFACE_API_KEY ||
    ""
  );
}

function shouldUseHuggingFace() {
  if (process.env.EMBEDDING_PROVIDER === "huggingface") return true;
  if (process.env.EMBEDDING_PROVIDER === "xenova") return false;
  // Native onnxruntime is not available on Vercel serverless.
  return Boolean(process.env.VERCEL);
}

async function generateEmbeddingViaHuggingFace(text) {
  const token = getHuggingFaceToken();
  if (!token) {
    throw new Error(
      "Embeddings on Vercel require HF_TOKEN (Hugging Face access token). " +
        "Create one at https://huggingface.co/settings/tokens with Inference Providers " +
        "permission and add it in Vercel env vars.",
    );
  }

  const body = JSON.stringify({
    inputs: text,
    options: { wait_for_model: true },
  });

  let lastError = null;

  for (const url of HF_URLS) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body,
        });
      } catch (networkError) {
        lastError =
          networkError instanceof Error
            ? networkError
            : new Error(String(networkError));
        break;
      }

      const raw = await response.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (response.ok) {
        return toSentenceEmbedding(data);
      }

      let message =
        data?.error ||
        data?.message ||
        (typeof raw === "string" && raw.trim().startsWith("<")
          ? `Hugging Face embedding failed (${response.status})`
          : raw) ||
        `Hugging Face embedding failed (${response.status})`;

      if (response.status === 401 || response.status === 403) {
        message =
          `${message}. Check HF_TOKEN: create a token at ` +
          "https://huggingface.co/settings/tokens with Inference Providers permission.";
      }

      lastError = new Error(message);

      // Model cold-start
      if (
        response.status === 503 ||
        String(message).toLowerCase().includes("loading")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }

      break;
    }
  }

  throw lastError || new Error("Hugging Face embedding request failed");
}

async function generateEmbeddingViaXenova(text) {
  const { pipeline } = await import("@xenova/transformers");

  if (!globalForEmbedder.__chatAiEmbedderPromise) {
    globalForEmbedder.__chatAiEmbedderPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }

  const model = await globalForEmbedder.__chatAiEmbedderPromise;
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export async function generateEmbedding(text) {
  if (shouldUseHuggingFace()) {
    return generateEmbeddingViaHuggingFace(text);
  }

  try {
    return await generateEmbeddingViaXenova(text);
  } catch (error) {
    // Desktop installs can still fall back to HF when onnxruntime fails.
    if (getHuggingFaceToken()) {
      console.warn(
        "[embeddings] Xenova failed; falling back to Hugging Face:",
        error?.message || error,
      );
      return generateEmbeddingViaHuggingFace(text);
    }
    throw error;
  }
}
