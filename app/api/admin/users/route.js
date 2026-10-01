import { getCurrentUser, jsonError } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Not authorized.', 401);

  const { data: rows } = await user.supabase.from('users').select('id, email, role, full_name, created_at, suspended');
  const users = (rows || []).map((u) => ({
    id: u.id, email: u.email, role: u.role, fullName: u.full_name, createdAt: u.created_at, suspended: u.suspended,
  }));
  return Response.json({ users });
}

export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Not authorized.', 401);

  const { id, suspended } = await request.json();
  if (!id || typeof suspended !== 'boolean') return jsonError('id and suspended (boolean) are required.', 400);
  if (id === user.id) return jsonError('You cannot suspend your own account.', 400);

  const { data: target } = await user.supabase.from('users').select('role').eq('id', id).single();
  if (!target) return jsonError('User not found.', 404);
  if (target.role === 'admin') return jsonError('Admin accounts cannot be suspended.', 400);

  const { error, count } = await user.supabase.from('users').update({ suspended }, { count: 'exact' }).eq('id', id);
  if (error || !count) return jsonError('Update failed.', 500);

  return Response.json({ ok: true });
}
