import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Admin client (service role key — bypasses RLS)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Public client (anon key — respects RLS)
export const supabasePublic = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);
