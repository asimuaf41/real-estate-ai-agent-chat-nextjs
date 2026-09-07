import { NextResponse } from "next/server";
import { formatServerError } from "@/lib/server/utils/sse";

export const runtime = "nodejs";

function present(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

async function probe(
  name: string,
  run: () => Promise<unknown>,
): Promise<{ name: string; ok: boolean; detail?: string }> {
  try {
    await run();
    return { name, ok: true };
  } catch (error) {
    return { name, ok: false, detail: formatServerError(error) };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";

  const env = {
    ANTHROPIC_API_KEY: present(process.env.ANTHROPIC_API_KEY),
    HF_TOKEN: present(
      process.env.HF_TOKEN ||
        process.env.HUGGINGFACE_API_TOKEN ||
        process.env.HUGGINGFACE_API_KEY,
    ),
    SUPABASE_URL: present(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_KEY: present(process.env.SUPABASE_KEY),
    TAVILY_API_KEY: present(process.env.TAVILY_API_KEY),
    WEATHER_API_KEY: present(process.env.WEATHER_API_KEY),
    NEXT_PUBLIC_API_BASE_URL: present(process.env.NEXT_PUBLIC_API_BASE_URL),
    VERCEL: present(process.env.VERCEL),
  };

  const missingRequired = (
    ["ANTHROPIC_API_KEY", "HF_TOKEN", "SUPABASE_URL"] as const
  ).filter((key) => !env[key]);

  if (!env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_KEY) {
    missingRequired.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

  if (deep) {
    if (env.ANTHROPIC_API_KEY) {
      checks.push(
        await probe("anthropic", async () => {
          const response = await fetch("https://api.anthropic.com/v1/models", {
            method: "GET",
            headers: {
              "x-api-key": process.env.ANTHROPIC_API_KEY!,
              "anthropic-version": "2023-06-01",
            },
          });
          if (!response.ok) {
            const body = await response.text();
            throw new Error(
              `Anthropic ${response.status}: ${body.slice(0, 200)}`,
            );
          }
        }),
      );
    }

    if (env.HF_TOKEN) {
      checks.push(
        await probe("huggingface", async () => {
          const token =
            process.env.HF_TOKEN ||
            process.env.HUGGINGFACE_API_TOKEN ||
            process.env.HUGGINGFACE_API_KEY!;
          const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: "health check",
                options: { wait_for_model: true },
              }),
            },
          );
          if (!response.ok) {
            const body = await response.text();
            throw new Error(
              `Hugging Face ${response.status}: ${body.slice(0, 200)}`,
            );
          }
        }),
      );
    }

    if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY)) {
      checks.push(
        await probe("supabase", async () => {
          const key =
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!;
          const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
          const response = await fetch(`${base}/rest/v1/`, {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
          });
          if (!response.ok && response.status !== 200) {
            const body = await response.text();
            throw new Error(
              `Supabase ${response.status}: ${body.slice(0, 200)}`,
            );
          }
        }),
      );
    }
  }

  const ok =
    missingRequired.length === 0 && checks.every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      missingRequired,
      env,
      checks,
      hint:
        "Open /api/health?deep=1 to probe Anthropic, Hugging Face, and Supabase connectivity. Check Vercel → Logs for [sse] errors.",
    },
    { status: ok ? 200 : 503 },
  );
}
