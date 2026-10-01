import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel } from '@/lib/caseMap';

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { decision } = await request.json(); // 'Accepted' | 'Declined'
  if (!['Accepted', 'Declined'].includes(decision)) return jsonError('Invalid decision.', 400);

  const { id } = await params;
  const { data: profileRow } = await user.supabase.from('student_profiles').select('*').eq('user_id', user.id).single();
  const { data: offerRow } = await user.supabase
    .from('offer_letters')
    .select('*')
    .eq('id', id)
    .eq('student_id', profileRow.id)
    .single();
  if (!offerRow) return jsonError('Offer not found.', 404);
  if (offerRow.status !== 'Pending') return jsonError('This offer has already been responded to.', 409);

  const respondedAt = new Date().toISOString();
  const { data: updatedOffer } = await user.supabase
    .from('offer_letters')
    .update({ status: decision, responded_at: respondedAt })
    .eq('id', offerRow.id)
    .select('*')
    .single();

  await user.supabase
    .from('applications')
    .update({ status: decision === 'Accepted' ? 'Accepted' : 'Rejected', updated_at: respondedAt })
    .eq('student_id', profileRow.id)
    .eq('posting_id', offerRow.posting_id);

  const { data: postingRow } = await user.supabase.from('internship_postings').select('title').eq('id', offerRow.posting_id).single();
  const { data: companyRow } = await user.supabase.from('company_profiles').select('user_id').eq('id', offerRow.company_id).single();
  if (companyRow) {
    await user.supabase.from('notifications').insert({
      user_id: companyRow.user_id,
      type: 'offer_response',
      message: `${user.full_name} ${decision.toLowerCase()} the offer for "${postingRow?.title}".`,
    });
  }

  return Response.json({ offer: rowToCamel(updatedOffer) });
}
