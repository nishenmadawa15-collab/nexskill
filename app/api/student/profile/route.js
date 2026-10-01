import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel, toSnakeRow } from '@/lib/caseMap';
import { computeReadinessScore } from '@/lib/matching';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const { data: activeRows } = await user.supabase.from('internship_postings').select('*').eq('status', 'published');

  const profile = rowToCamel(profileRow);
  const readinessScore = computeReadinessScore(profile, (activeRows || []).map(rowToCamel));

  if (profile.readinessScore !== readinessScore) {
    await user.supabase.from('student_profiles').update({ readiness_score: readinessScore }).eq('id', profile.id);
  }

  return Response.json({ profile: { ...profile, readinessScore }, user: { fullName: user.full_name, email: user.email } });
}

export async function PUT(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const updates = await request.json();
  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  if (!profileRow) return jsonError('Profile not found.', 404);

  const allowed = ['degree', 'yearOfStudy', 'gpa', 'skills', 'certifications', 'preferences'];
  const patch = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) patch[key] = updates[key];
  }

  const merged = { ...rowToCamel(profileRow), ...patch };
  const { data: activeRows } = await user.supabase.from('internship_postings').select('*').eq('status', 'published');
  const readinessScore = computeReadinessScore(merged, (activeRows || []).map(rowToCamel));

  const { data: updated } = await user.supabase
    .from('student_profiles')
    .update({ ...toSnakeRow(patch), readiness_score: readinessScore })
    .eq('id', profileRow.id)
    .select('*')
    .single();

  return Response.json({ profile: rowToCamel(updated) });
}
