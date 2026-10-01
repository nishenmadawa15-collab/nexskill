import { getCurrentUser, jsonError } from '@/lib/session';
import { rowsToCamel } from '@/lib/caseMap';
import { rankPostingsForStudent, analyseSkillGap } from '@/lib/matching';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'university') return jsonError('Not authorized.', 401);

  const { data: uniRow } = await user.supabase.from('university_profiles').select('*').eq('user_id', user.id).single();
  const studentIds = uniRow.enrolled_students || [];

  const { data: studentRows } = studentIds.length
    ? await user.supabase.from('student_profiles').select('*').in('id', studentIds)
    : { data: [] };
  const students = rowsToCamel(studentRows);

  const { data: appRows } = studentIds.length
    ? await user.supabase.from('applications').select('*').in('student_id', studentIds)
    : { data: [] };
  const applications = rowsToCamel(appRows);
  const placements = applications.filter((a) => a.status === 'Accepted');
  const placementRate = students.length ? Math.round((placements.length / students.length) * 100) : 0;

  const placementPostingIds = [...new Set(placements.map((p) => p.postingId))];
  const { data: placementPostingRows } = placementPostingIds.length
    ? await user.supabase.from('internship_postings').select('id, company_id').in('id', placementPostingIds)
    : { data: [] };
  const companyIdByPosting = Object.fromEntries((placementPostingRows || []).map((p) => [p.id, p.company_id]));
  const companyIds = [...new Set(Object.values(companyIdByPosting))];
  const { data: companyRows } = companyIds.length
    ? await user.supabase.from('company_profiles').select('id, company_name').in('id', companyIds)
    : { data: [] };
  const companyById = Object.fromEntries((companyRows || []).map((c) => [c.id, c]));

  const companyCounts = {};
  for (const p of placements) {
    const companyId = companyIdByPosting[p.postingId];
    const name = companyById[companyId]?.company_name;
    if (name) companyCounts[name] = (companyCounts[name] || 0) + 1;
  }
  const topCompanies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  const { data: activeRows } = await user.supabase.from('internship_postings').select('*').eq('status', 'published');
  const activePostings = rowsToCamel(activeRows);
  const gapFrequency = {};
  for (const student of students) {
    const topPosting = rankPostingsForStudent(activePostings, student)[0]?.posting;
    if (!topPosting) continue;
    const { missingSkills } = analyseSkillGap(student, topPosting);
    for (const skill of missingSkills) gapFrequency[skill] = (gapFrequency[skill] || 0) + 1;
  }
  const topSkillGaps = Object.entries(gapFrequency).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([skill, count]) => ({ skill, count }));

  const studentUserIds = students.map((s) => s.userId);
  const { data: userRows } = studentUserIds.length
    ? await user.supabase.from('users').select('id, full_name').in('id', studentUserIds)
    : { data: [] };
  const userById = Object.fromEntries((userRows || []).map((u) => [u.id, u]));

  const studentDetail = students.map((s) => {
    const studentApps = applications.filter((a) => a.studentId === s.id);
    return {
      name: userById[s.userId]?.full_name,
      degree: s.degree,
      yearOfStudy: s.yearOfStudy,
      readinessScore: s.readinessScore,
      applicationCount: studentApps.length,
      placed: studentApps.some((a) => a.status === 'Accepted'),
    };
  });

  return Response.json({
    universityName: uniRow.university_name,
    verified: uniRow.verified,
    totals: {
      enrolledStudents: students.length,
      totalApplications: applications.length,
      totalPlacements: placements.length,
      placementRate,
    },
    topCompanies,
    topSkillGaps,
    studentDetail,
  });
}
