import { getCurrentUser, jsonError } from '@/lib/session';

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return jsonError('Not authorized.', 401);

  const { id } = await params;
  const { error, count } = await user.supabase
    .from('notifications')
    .update({ read_status: true }, { count: 'exact' })
    .eq('id', id);

  if (error || !count) return jsonError('Not found.', 404);
  return Response.json({ ok: true });
}
