import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel } from '@/lib/caseMap';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'company') return jsonError('Not authorized.', 401);

  const { applicationId } = await request.json();
  const { data: companyRow } = await user.supabase.from('company_profiles').select('*').eq('user_id', user.id).single();
  if (!companyRow.verified) return jsonError('Your company must be verified to send offer letters.', 403);

  const { data: appRow } = await user.supabase.from('applications').select('*').eq('id', applicationId).single();
  if (!appRow) return jsonError('Business rule violation: offer letters may only be sent to students who applied.', 400);

  const { data: postingRow } = await user.supabase.from('internship_postings').select('*').eq('id', appRow.posting_id).single();
  if (!postingRow || postingRow.company_id !== companyRow.id) return jsonError('Not authorized for this posting.', 403);

  const { data: existing } = await user.supabase
    .from('offer_letters')
    .select('id')
    .eq('posting_id', postingRow.id)
    .eq('student_id', appRow.student_id)
    .maybeSingle();
  if (existing) return jsonError('An offer has already been sent for this application.', 409);

  const { data: offerRow } = await user.supabase
    .from('offer_letters')
    .insert({ posting_id: postingRow.id, student_id: appRow.student_id, company_id: companyRow.id, status: 'Pending' })
    .select('*')
    .single();

  await user.supabase.from('applications').update({ status: 'Offered', updated_at: new Date().toISOString() }).eq('id', appRow.id);

  const { data: studentProfileRow } = await user.supabase.from('student_profiles').select('user_id').eq('id', appRow.student_id).single();
  if (studentProfileRow) {
    await user.supabase.from('notifications').insert({
      user_id: studentProfileRow.user_id,
      type: 'offer_received',
      message: `You received a digital offer letter from ${companyRow.company_name} for "${postingRow.title}".`,
    });
  }

  return Response.json({ offer: rowToCamel(offerRow) });
}
