import "./dnsFallback.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const globalForSupabase = globalThis;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = serviceRoleKey || env.supabaseKey;

export const usingServiceRole = Boolean(serviceRoleKey);

function createSupabaseClient() {
  if (!env.supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(env.supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase =
  globalForSupabase.__chatAiSupabase ?? createSupabaseClient();

if (supabase && process.env.NODE_ENV !== "production") {
  globalForSupabase.__chatAiSupabase = supabase;
}

if (supabase && !globalForSupabase.__chatAiSupabaseLogged) {
  globalForSupabase.__chatAiSupabaseLogged = true;
  console.log(
    `[supabase] client ready (${usingServiceRole ? "service_role key" : "publishable key"})`,
  );
}

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return supabase;
}
