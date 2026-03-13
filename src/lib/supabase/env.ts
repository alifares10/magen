type PublicEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function getEnvValue(key: PublicEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getSupabasePublicEnv() {
  return {
    url: getEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
