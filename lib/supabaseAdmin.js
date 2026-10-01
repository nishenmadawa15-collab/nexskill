import { createClient } from '@supabase/supabase-js';

// Service-role client. Used only by scripts/seed.js to admin-create demo
// auth users with pre-confirmed emails. Never import this from app/ —
// it bypasses RLS entirely and must never run in a request handler.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
