import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel, rowsToCamel } from '@/lib/caseMap';
import { rankPostingsForStudent } from '@/lib/matching';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const { data: postingRows } = await user.supabase.from('internship_postings').select('*').eq('status', 'published');
  const { data: appRows } = await user.supabase.from('applications').select('posting_id').eq('student_id', profileRow.id);

  const profile = rowToCamel(profileRow);
  const postings = rowsToCamel(postingRows);
  const appliedPostingIds = new Set((appRows || []).map((a) => a.posting_id));

  const companyIds = [...new Set(postings.map((p) => p.companyId))];
  const { data: companyRows } = companyIds.length
    ? await user.supabase.from('company_profiles').select('id, company_name').in('id', companyIds)
    : { data: [] };
  const companyById = Object.fromEntries((companyRows || []).map((c) => [c.id, c]));

  const start = Date.now();
  const ranked = rankPostingsForStudent(postings, profile);
  const processingMs = Date.now() - start; // demonstrates NFR-PERF-01 (<3s)

  const withCompany = ranked.map((r) => ({
    ...r,
    companyName: companyById[r.posting.companyId]?.company_name || 'Unknown',
    alreadyApplied: appliedPostingIds.has(r.posting.id),
  }));

  return Response.json({ matches: withCompany, processingMs });
}
