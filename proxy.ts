import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy (formerly middleware.ts).
 * Refreshes Supabase auth cookies on every matched request.
 * Routes stay public — guest usage limits are enforced in the UI/API, not here.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and image optimization.
     * Keeps auth sessions alive for signed-in users without blocking guests.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
