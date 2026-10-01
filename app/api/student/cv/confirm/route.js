import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel } from '@/lib/caseMap';
import { computeReadinessScore } from '@/lib/matching';

// FR-STU-04 / FR-NLP-04: student confirms/edits extracted skills, profile updates automatically.
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { uploadId, confirmedSkills } = await request.json();
  const { data: uploadRow } = await user.supabase.from('cv_uploads').select('*').eq('id', uploadId).eq('user_id', user.id).single();
  if (!uploadRow) return jsonError('Upload not found.', 404);

  await user.supabase.from('cv_uploads').update({ status: 'confirmed' }).eq('id', uploadRow.id);

  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const merged = Array.from(new Set([...(profileRow.skills || []), ...confirmedSkills]));

  const { data: activeRows } = await user.supabase.from('internship_postings').select('*').eq('status', 'published');
  const readinessScore = computeReadinessScore({ ...rowToCamel(profileRow), skills: merged }, (activeRows || []).map(rowToCamel));

  const { data: updatedProfile } = await user.supabase
    .from('student_profiles')
    .update({ skills: merged, readiness_score: readinessScore })
    .eq('id', profileRow.id)
    .select('*')
    .single();

  return Response.json({ profile: rowToCamel(updatedProfile) });
}
