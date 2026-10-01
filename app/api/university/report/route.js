import { getCurrentUser, jsonError } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'university') return jsonError('Not authorized.', 401);

  const { data: uniRow } = await user.supabase.from('university_profiles').select('*').eq('user_id', user.id).single();
  const studentIds = uniRow.enrolled_students || [];

  const { data: studentRows } = studentIds.length
    ? await user.supabase.from('student_profiles').select('*').in('id', studentIds)
    : { data: [] };
  const students = studentRows || [];

  const studentUserIds = students.map((s) => s.user_id);
  const { data: userRows } = studentUserIds.length
    ? await user.supabase.from('users').select('id, full_name').in('id', studentUserIds)
    : { data: [] };
  const userById = Object.fromEntries((userRows || []).map((u) => [u.id, u]));

  const { data: appRows } = studentIds.length
    ? await user.supabase.from('applications').select('student_id, status').in('student_id', studentIds)
    : { data: [] };

  const rows = [['Student Name', 'Degree', 'Year of Study', 'Readiness Score', 'Applications', 'Placement Status']];
  for (const s of students) {
    const apps = (appRows || []).filter((a) => a.student_id === s.id);
    const placed = apps.some((a) => a.status === 'Accepted');
    rows.push([userById[s.user_id]?.full_name || '', s.degree || '', s.year_of_study, s.readiness_score, apps.length, placed ? 'Placed' : 'Not placed']);
  }

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${uniRow.university_name.replace(/\s+/g, '_')}_placement_report.csv"`,
    },
  });
}
