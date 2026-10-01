import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client for Route Handlers and Server Components.
// Uses the public anon key + the visitor's own session cookie — RLS (see
// the "rls_policies" migration) enforces per-user access, so this client
// never needs the service-role key.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render — middleware.js refreshes the session instead.
          }
        },
      },
    }
  );
}
