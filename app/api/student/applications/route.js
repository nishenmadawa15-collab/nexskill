import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel, rowsToCamel } from '@/lib/caseMap';
import { scoreStudentAgainstPosting } from '@/lib/matching';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const { data: appRows } = await user.supabase.from('applications').select('*').eq('student_id', profileRow.id);

  const postingIds = [...new Set((appRows || []).map((a) => a.posting_id))];
  const { data: postingRows } = postingIds.length
    ? await user.supabase.from('internship_postings').select('id, title, company_id').in('id', postingIds)
    : { data: [] };
  const companyIds = [...new Set((postingRows || []).map((p) => p.company_id))];
  const { data: companyRows } = companyIds.length
    ? await user.supabase.from('company_profiles').select('id, company_name').in('id', companyIds)
    : { data: [] };

  const postingById = Object.fromEntries((postingRows || []).map((p) => [p.id, p]));
  const companyById = Object.fromEntries((companyRows || []).map((c) => [c.id, c]));

  const applications = rowsToCamel(appRows)
    .map((a) => {
      const posting = postingById[a.postingId];
      const company = posting ? companyById[posting.company_id] : null;
      return { ...a, postingTitle: posting?.title, companyName: company?.company_name };
    })
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  return Response.json({ applications });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { postingId } = await request.json();
  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const { data: postingRow } = await user.supabase.from('internship_postings').select('*').eq('id', postingId).single();

  if (!postingRow) return jsonError('Internship posting not found.', 404);
  const posting = rowToCamel(postingRow);
  if (posting.status !== 'published') return jsonError('This posting is not currently open for applications.', 400);
  if (new Date(posting.deadline) < new Date()) return jsonError('The application deadline has passed.', 400);

  const { data: already } = await user.supabase
    .from('applications')
    .select('id')
    .eq('student_id', profileRow.id)
    .eq('posting_id', posting.id)
    .maybeSingle();
  if (already) return jsonError('You already applied to this internship.', 409);

  const { matchScore, breakdown } = scoreStudentAgainstPosting(rowToCamel(profileRow), posting);
  const { data: appRow } = await user.supabase
    .from('applications')
    .insert({ student_id: profileRow.id, posting_id: posting.id, match_score: matchScore, breakdown, status: 'Pending' })
    .select('*')
    .single();

  const { data: companyRow } = await user.supabase.from('company_profiles').select('user_id').eq('id', posting.companyId).single();
  if (companyRow) {
    await user.supabase.from('notifications').insert({
      user_id: companyRow.user_id,
      type: 'new_application',
      message: `New application for "${posting.title}" — ${matchScore}% match.`,
    });
  }

  return Response.json({ application: rowToCamel(appRow) });
}
