import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel } from '@/lib/caseMap';
import { analyseSkillGap } from '@/lib/matching';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { searchParams } = new URL(request.url);
  const postingId = searchParams.get('postingId');

  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const { data: postingRow } = await user.supabase.from('internship_postings').select('*').eq('id', postingId).single();
  if (!postingRow) return jsonError('Internship posting not found.', 404);

  const posting = rowToCamel(postingRow);
  const result = analyseSkillGap(rowToCamel(profileRow), posting);
  return Response.json({ result, posting: { id: posting.id, title: posting.title } });
}
