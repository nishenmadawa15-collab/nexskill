import { getCurrentUser, jsonError } from '@/lib/session';
import { rowsToCamel } from '@/lib/caseMap';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError('Not authorized.', 401);

  let query = user.supabase.from('notifications').select('*');
  query = user.role === 'admin' ? query.or(`user_id.eq.${user.id},user_id.is.null`) : query.eq('user_id', user.id);
  const { data: rows } = await query;

  const notifications = rowsToCamel(rows).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return Response.json({ notifications, unreadCount: notifications.filter((n) => !n.readStatus).length });
}
