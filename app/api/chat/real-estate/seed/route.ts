import { NextResponse } from "next/server";
import { seedAtlantaProperties } from "@/lib/server/services/realEstate.service.js";
import { enforceAgentRateLimit } from "@/lib/server/utils/rateLimit";
import { readJsonBody } from "@/lib/server/utils/request";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = enforceAgentRateLimit(request);
  if (limited) return limited;

  try {
    const body = await readJsonBody(request);
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true" || body?.force === true;
    const result = await seedAtlantaProperties({ force });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
