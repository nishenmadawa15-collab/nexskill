import { getCurrentUser, jsonError } from '@/lib/session';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Not authorized.', 401);

  const { type, id, approve } = await request.json();
  if (!['company', 'university'].includes(type)) return jsonError('Invalid type.', 400);
  const table = type === 'company' ? 'company_profiles' : 'university_profiles';

  const { data: target } = await user.supabase.from(table).select('*').eq('id', id).single();
  if (!target) return jsonError('Account not found.', 404);

  if (approve) {
    const { error, count } = await user.supabase.from(table).update({ verified: true }, { count: 'exact' }).eq('id', id);
    if (error || !count) return jsonError('Verification update failed.', 500);
    await user.supabase.from('notifications').insert({
      user_id: target.user_id,
      type: 'account_verified',
      message: `Your ${type} account has been verified. You now have full platform access.`,
    });
  } else {
    // Rejection removes the pending account in this prototype.
    const { error, count } = await user.supabase.from(table).delete({ count: 'exact' }).eq('id', id);
    if (error || !count) return jsonError('Rejection failed.', 500);
  }

  return Response.json({ ok: true });
}
