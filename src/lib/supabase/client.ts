import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (typeof window !== "undefined" && browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  const client = createBrowserClient(url, anonKey);

  if (typeof window !== "undefined") {
    browserClient = client;
  }

  return client;
}
