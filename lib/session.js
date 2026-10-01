import { createClient } from './supabaseServer';

// Returns { id, email, role, full_name, university, supabase } for the
// signed-in visitor, or null. `supabase` is a request-scoped client already
// authenticated as this user — RLS policies (see the "rls_policies"
// migration) enforce that queries made with it only touch rows this user
// is allowed to see or change.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
  if (!profile) return null;
  if (profile.suspended) {
    await supabase.auth.signOut();
    return null;
  }

  return { ...profile, supabase };
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}
