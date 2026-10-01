import { getCurrentUser } from '@/lib/session';
import { rowToCamel } from '@/lib/caseMap';

const PROFILE_TABLE = { student: 'student_profiles', company: 'company_profiles', university: 'university_profiles' };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });

  let profile = null;
  const table = PROFILE_TABLE[user.role];
  if (table) {
    const { data } = await user.supabase.from(table).select('*').eq('user_id', user.id).single();
    profile = rowToCamel(data);
  }

  return Response.json({
    user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name, university: user.university },
    profile,
  });
}
