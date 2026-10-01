import { createClient } from '@/lib/supabaseServer';
import { rowToCamel } from '@/lib/caseMap';

export async function POST(request) {
  const { email, password } = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email: email || '', password: password || '' });
  if (error) {
    return Response.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
  if (profile?.suspended) {
    await supabase.auth.signOut();
    return Response.json({ error: 'This account has been suspended. Contact an administrator.' }, { status: 403 });
  }

  return Response.json({ user: rowToCamel(profile) });
}
