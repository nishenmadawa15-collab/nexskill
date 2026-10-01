import { getCurrentUser, jsonError } from '@/lib/session';
import { rowsToCamel } from '@/lib/caseMap';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Not authorized.', 401);

  const { data: postingRows } = await user.supabase.from('internship_postings').select('*');
  const companyIds = [...new Set((postingRows || []).map((p) => p.company_id))];
  const { data: companyRows } = companyIds.length
    ? await user.supabase.from('company_profiles').select('id, company_name').in('id', companyIds)
    : { data: [] };
  const companyById = Object.fromEntries((companyRows || []).map((c) => [c.id, c]));

  const postings = rowsToCamel(postingRows).map((p) => ({ ...p, companyName: companyById[p.companyId]?.company_name }));
  return Response.json({ postings });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Not authorized.', 401);

  const { postingId, action } = await request.json(); // action: 'remove' | 'flag' | 'unflag'

  if (action === 'remove') {
    await user.supabase.from('internship_postings').delete().eq('id', postingId);
    return Response.json({ ok: true });
  }
  if (action === 'flag' || action === 'unflag') {
    const { error, count } = await user.supabase
      .from('internship_postings')
      .update({ flagged: action === 'flag' }, { count: 'exact' })
      .eq('id', postingId);
    if (error || !count) return jsonError('Posting not found.', 404);
    return Response.json({ ok: true });
  }

  return jsonError('Unsupported action.', 400);
}
