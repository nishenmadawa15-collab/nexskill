import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel, rowsToCamel } from '@/lib/caseMap';
import { rankStudentsForPosting } from '@/lib/matching';

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'company') return jsonError('Not authorized.', 401);

  const { id } = await params;
  const { data: companyRow } = await user.supabase.from('company_profiles').select('id').eq('user_id', user.id).single();
  const { data: postingRow } = await user.supabase
    .from('internship_postings')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyRow.id)
    .single();
  if (!postingRow) return jsonError('Posting not found.', 404);

  const posting = rowToCamel(postingRow);
  const { data: studentRows } = await user.supabase.from('student_profiles').select('*');
  const students = rowsToCamel(studentRows);
  const ranked = rankStudentsForPosting(students, posting);

  const { data: appRows } = await user.supabase.from('applications').select('*').eq('posting_id', posting.id);
  const appByStudent = Object.fromEntries((appRows || []).map((a) => [a.student_id, a]));

  const userIds = students.map((s) => s.userId);
  const { data: userRows } = userIds.length ? await user.supabase.from('users').select('id, full_name, university').in('id', userIds) : { data: [] };
  const userById = Object.fromEntries((userRows || []).map((u) => [u.id, u]));

  const withStatus = ranked.map((r) => {
    const application = appByStudent[r.student.id];
    const su = userById[r.student.userId];
    return {
      ...r,
      studentName: su?.full_name,
      studentUniversity: su?.university,
      applicationId: application?.id || null,
      applicationStatus: application?.status || 'Not applied',
    };
  });

  return Response.json({ posting, candidates: withStatus });
}
