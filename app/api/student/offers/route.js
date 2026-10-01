import { getCurrentUser, jsonError } from '@/lib/session';
import { rowsToCamel } from '@/lib/caseMap';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const { data: offerRows } = await user.supabase.from('offer_letters').select('*').eq('student_id', profileRow.id);

  const postingIds = [...new Set((offerRows || []).map((o) => o.posting_id))];
  const { data: postingRows } = postingIds.length
    ? await user.supabase.from('internship_postings').select('id, title, stipend_range, duration, company_id').in('id', postingIds)
    : { data: [] };
  const companyIds = [...new Set((postingRows || []).map((p) => p.company_id))];
  const { data: companyRows } = companyIds.length
    ? await user.supabase.from('company_profiles').select('id, company_name').in('id', companyIds)
    : { data: [] };

  const postingById = Object.fromEntries((postingRows || []).map((p) => [p.id, p]));
  const companyById = Object.fromEntries((companyRows || []).map((c) => [c.id, c]));

  const offers = rowsToCamel(offerRows)
    .map((o) => {
      const posting = postingById[o.postingId];
      const company = posting ? companyById[posting.company_id] : null;
      return {
        ...o,
        postingTitle: posting?.title,
        companyName: company?.company_name,
        stipendRange: posting?.stipend_range,
        duration: posting?.duration,
      };
    })
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  return Response.json({ offers });
}
