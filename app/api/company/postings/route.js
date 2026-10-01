import { getCurrentUser, jsonError } from '@/lib/session';
import { rowToCamel, rowsToCamel } from '@/lib/caseMap';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'company') return jsonError('Not authorized.', 401);

  const { data: companyRow } = await user.supabase.from('company_profiles').select('*').eq('user_id', user.id).single();
  const { data: postingRows } = await user.supabase.from('internship_postings').select('*').eq('company_id', companyRow.id);

  const postingIds = (postingRows || []).map((p) => p.id);
  const { data: appRows } = postingIds.length
    ? await user.supabase.from('applications').select('posting_id').in('posting_id', postingIds)
    : { data: [] };
  const countByPosting = {};
  for (const a of appRows || []) countByPosting[a.posting_id] = (countByPosting[a.posting_id] || 0) + 1;

  const postings = rowsToCamel(postingRows).map((p) => ({ ...p, applicantCount: countByPosting[p.id] || 0 }));

  return Response.json({ postings, companyProfile: rowToCamel(companyRow) });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'company') return jsonError('Not authorized.', 401);

  const { data: companyRow } = await user.supabase.from('company_profiles').select('*').eq('user_id', user.id).single();
  if (!companyRow.verified) {
    return jsonError('Your company account is awaiting admin verification before you can post internships.', 403);
  }

  const body = await request.json();
  const required = ['title', 'requiredSkills', 'duration', 'location', 'deadline'];
  for (const field of required) {
    if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
      return jsonError(`"${field}" is required.`, 400);
    }
  }

  const { data: postingRow } = await user.supabase
    .from('internship_postings')
    .insert({
      company_id: companyRow.id,
      title: body.title,
      required_skills: body.requiredSkills,
      min_gpa: Number(body.minGpa) || 0,
      target_year: Number(body.targetYear) || 0,
      domain: body.domain || body.title,
      duration: body.duration,
      location: body.location,
      stipend_range: body.stipendRange || 'Undisclosed',
      positions: Number(body.positions) || 1,
      deadline: body.deadline,
      status: 'published',
    })
    .select('*')
    .single();

  return Response.json({ posting: rowToCamel(postingRow) });
}
