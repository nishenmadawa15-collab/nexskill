import { getCurrentUser, jsonError } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return jsonError('Not authorized.', 401);

  const [{ data: studentRows }, { data: companyRows }, { data: universityRows }, { data: postingRows }, { data: appRows }] = await Promise.all([
    user.supabase.from('student_profiles').select('id'),
    user.supabase.from('company_profiles').select('id, company_name, verified'),
    user.supabase.from('university_profiles').select('id, university_name, verified'),
    user.supabase.from('internship_postings').select('id, required_skills'),
    user.supabase.from('applications').select('id, status'),
  ]);

  const skillCounts = {};
  for (const p of postingRows || []) {
    for (const skill of p.required_skills || []) skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  }
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([skill, count]) => ({ skill, count }));

  return Response.json({
    totals: {
      totalStudents: (studentRows || []).length,
      totalCompanies: (companyRows || []).length,
      verifiedCompanies: (companyRows || []).filter((c) => c.verified).length,
      totalUniversities: (universityRows || []).length,
      verifiedUniversities: (universityRows || []).filter((u) => u.verified).length,
      totalPostings: (postingRows || []).length,
      totalApplications: (appRows || []).length,
      totalPlacements: (appRows || []).filter((a) => a.status === 'Accepted').length,
    },
    topSkills,
    pendingVerifications: [
      ...(companyRows || []).filter((c) => !c.verified).map((c) => ({ type: 'company', id: c.id, name: c.company_name })),
      ...(universityRows || []).filter((u) => !u.verified).map((u) => ({ type: 'university', id: u.id, name: u.university_name })),
    ],
  });
}
