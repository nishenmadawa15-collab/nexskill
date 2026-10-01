import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel, toSnakeRow } from '@/lib/caseMap';

export async function PUT(request, { params }) {
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

  const updates = await request.json();
  const allowed = ['title', 'requiredSkills', 'minGpa', 'targetYear', 'domain', 'duration', 'location', 'stipendRange', 'positions', 'deadline', 'status'];
  const patch = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) patch[key] = updates[key];
  }

  const { data: updated } = await user.supabase
    .from('internship_postings')
    .update(toSnakeRow(patch))
    .eq('id', postingRow.id)
    .select('*')
    .single();

  return Response.json({ posting: rowToCamel(updated) });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'company') return jsonError('Not authorized.', 401);

  const { id } = await params;
  const { data: companyRow } = await user.supabase.from('company_profiles').select('id').eq('user_id', user.id).single();
  const { error, count } = await user.supabase
    .from('internship_postings')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('company_id', companyRow.id);

  if (error || !count) return jsonError('Posting not found.', 404);
  return Response.json({ ok: true });
}
