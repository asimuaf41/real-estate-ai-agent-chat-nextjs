import { NextResponse } from "next/server";
import { isOwnerEmail } from "@/lib/auth/owner";
import { parseUsageStatsQuery } from "@/lib/chat/usage-types";
import { getDashboardStats } from "@/lib/server/services/usageStats.service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = parseUsageStatsQuery({
      range: url.searchParams.get("range"),
      agent: url.searchParams.getAll("agent"),
      status: url.searchParams.getAll("status"),
      model: url.searchParams.getAll("model"),
      scope: url.searchParams.get("scope"),
    });
    const stats = await getDashboardStats({
      viewerId: user.id,
      isOwner: isOwnerEmail(user.email),
      query,
    });
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
