import { createClient } from '@/lib/supabaseServer';
import { rowToCamel } from '@/lib/caseMap';

// Profile creation (student/company/university rows, the university
// enrollment link, and the admin-verification-needed notification) all
// happen inside the public.handle_new_user() trigger on auth.users —
// see the "handle_new_user_trigger" migration.
export async function POST(request) {
  const body = await request.json();
  const { email, password, role, fullName, university, companyName, universityName } = body;

  if (!email || !password || !role || !fullName) {
    return Response.json({ error: 'Name, email, password, and role are required.' }, { status: 400 });
  }
  if (!['student', 'company', 'university'].includes(role)) {
    return Response.json({ error: 'Invalid role.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName, university: university || null, company_name: companyName, university_name: universityName },
    },
  });

  if (error) {
    const status = error.status === 422 || /already registered/i.test(error.message) ? 409 : 400;
    const message = /already registered/i.test(error.message)
      ? 'An account with this email already exists.'
      : error.message;
    return Response.json({ error: message }, { status });
  }

  if (!data.session) {
    return Response.json(
      { error: 'Registration succeeded but email confirmation is required by the Supabase project — disable "Confirm email" under Authentication settings for instant sign-in.' },
      { status: 202 }
    );
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
  return Response.json({ user: rowToCamel(profile) });
}
