'use client';
import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client — used only for the password-reset flow
// (resetPasswordForEmail / updateUser), which needs the recovery token
// Supabase embeds in the magic-link URL to be picked up in the browser.
// Every other read/write in the app goes through a server Route Handler
// instead (lib/supabaseServer.js) so the session stays HttpOnly.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
