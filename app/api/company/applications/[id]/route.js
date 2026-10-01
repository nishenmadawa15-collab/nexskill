import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel } from '@/lib/caseMap';

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'company') return jsonError('Not authorized.', 401);

  const { status } = await request.json(); // 'Shortlisted' | 'Rejected'
  if (!['Shortlisted', 'Rejected'].includes(status)) return jsonError('Invalid status.', 400);

  const { id } = await params;
  const { data: companyRow } = await user.supabase.from('company_profiles').select('id').eq('user_id', user.id).single();
  const { data: appRow } = await user.supabase.from('applications').select('*').eq('id', id).single();
  if (!appRow) return jsonError('Application not found.', 404);

  const { data: postingRow } = await user.supabase.from('internship_postings').select('*').eq('id', appRow.posting_id).single();
  if (!postingRow || postingRow.company_id !== companyRow.id) return jsonError('Not authorized for this posting.', 403);

  const { data: updated } = await user.supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appRow.id)
    .select('*')
    .single();

  const { data: studentProfileRow } = await user.supabase.from('student_profiles').select('user_id').eq('id', appRow.student_id).single();
  if (studentProfileRow) {
    await user.supabase.from('notifications').insert({
      user_id: studentProfileRow.user_id,
      type: 'application_status',
      message: `Your application for "${postingRow.title}" was ${status.toLowerCase()}.`,
    });
  }

  return Response.json({ application: rowToCamel(updated) });
}
