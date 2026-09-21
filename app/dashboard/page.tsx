import { redirect } from "next/navigation";
import { isOwnerEmail } from "@/lib/auth/owner";
import { parseUsageStatsQuery, usageStatsSearchParams } from "@/lib/chat/usage-types";
import { getDashboardStats } from "@/lib/server/services/usageStats.service";
import { createClient } from "@/lib/supabase/server";
import { OwnerDashboard } from "./OwnerDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const query = parseUsageStatsQuery(params);
  const dashboardPath = `/dashboard${usageStatsSearchParams(query)}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(dashboardPath)}`);
  }

  const isOwner = isOwnerEmail(user.email);
  const stats = await getDashboardStats({
    viewerId: user.id,
    isOwner,
    query,
  });
  const displayName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    user.email?.split("@")[0] ||
    "Account";

  return (
    <OwnerDashboard
      key={dashboardPath}
      initialStats={stats}
      viewerEmail={user.email ?? ""}
      viewerName={displayName}
      isOwner={isOwner}
    />
  );
}
