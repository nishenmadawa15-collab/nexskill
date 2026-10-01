// Run with: node scripts/seed.mjs  (or npm run seed)
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// (the service-role key is only ever used here, never by the running app).
//
// Populates the Supabase project with mock accounts/data: 10 mock student
// profiles and 4 mock internship postings across 4 companies + 1 unverified
// company, 3 partner universities, and a handful of applications/offers/
// notifications in different states so a fresh seed demonstrates every
// workflow (Pending / Shortlisted / Rejected / Offered / Accepted) plus the
// admin verification queue and a student with no activity yet.
//
// Student-count/posting-count deliberately mirrors the proposal's own stated
// baseline experiment size (10 student profiles) for the algorithm
// optimisation exercise in scripts/optimize-experiment.mjs.
//
// Imports the *real* scoring engine (lib/matching.js) instead of a
// duplicated copy, so seeded match/readiness scores are guaranteed to equal
// what the live app computes for the same inputs — single source of truth.

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
import { scoreStudentAgainstPosting, computeReadinessScore, rankPostingsForStudent } from '../lib/matching.js';
import { rowToCamel } from '../lib/caseMap.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const DEMO_PASSWORD = 'password123';
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

async function createAuthUser({ email, role, fullName, university, companyName, universityName }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name: fullName, university: university || null, company_name: companyName, university_name: universityName },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user; // handle_new_user trigger has already created public.users + profile rows
}

async function main() {
  console.log('Seeding NexSkill Supabase project...\n');

  // --- Admin ---
  await createAuthUser({ email: 'admin@nexskill.lk', role: 'admin', fullName: 'NexSkill Admin' });

  // --- Universities (create first so student enrollment-linking trigger can match by name) ---
  const unis = [
    { name: 'SLTC Research University', email: 'partner@sltc.ac.lk' },
    { name: 'University of Moratuwa', email: 'partner@uom.lk' },
    { name: 'NSBM Green University', email: 'partner@nsbm.ac.lk' },
  ];
  for (const u of unis) {
    await createAuthUser({ email: u.email, role: 'university', fullName: `${u.name} Partnerships Office`, universityName: u.name });
  }
  const { data: uniProfiles } = await admin.from('university_profiles').select('id, user_id, university_name');
  for (const up of uniProfiles) await admin.from('university_profiles').update({ verified: true }).eq('id', up.id);

  // --- Companies ---
  const companies = [
    { name: 'WSO2', email: 'recruit@wso2.lk' },
    { name: 'IFS', email: 'recruit@ifs.lk' },
    { name: 'Virtusa', email: 'recruit@virtusa.lk' },
    { name: 'Sysco LABS', email: 'recruit@syscolabs.lk' },
  ];
  for (const c of companies) {
    await createAuthUser({ email: c.email, role: 'company', fullName: `${c.name} Talent Acquisition`, companyName: c.name });
  }
  // One unverified company, so the admin verification queue (FR-ADM-01) isn't empty on a fresh seed.
  await createAuthUser({ email: 'recruit@zone24x7.lk', role: 'company', fullName: 'Zone24x7 Talent Acquisition', companyName: 'Zone24x7' });

  const { data: companyProfiles } = await admin.from('company_profiles').select('id, user_id, company_name');
  for (const cp of companyProfiles) {
    if (cp.company_name !== 'Zone24x7') await admin.from('company_profiles').update({ verified: true }).eq('id', cp.id);
  }
  const companyIdByName = Object.fromEntries(companyProfiles.map((c) => [c.company_name, c.id]));

  // --- Students ---
  const studentsSeed = [
    { fullName: 'Ashan Perera', university: 'SLTC Research University', email: 'ashan@sltc.ac.lk', degree: 'BSc (Hons) Computer Science', yearOfStudy: 3, gpa: 3.6, skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'HTML', 'CSS'], certifications: ['Meta Front-End Developer Certificate'], preferences: { domain: 'Software Engineering', location: 'Colombo', duration: '3 months' } },
    { fullName: 'Nadeesha Silva', university: 'University of Moratuwa', email: 'nadeesha@uom.lk', degree: 'BSc (Hons) Information Technology', yearOfStudy: 4, gpa: 3.8, skills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'scikit-learn', 'SQL'], certifications: ['IBM Data Science Professional Certificate'], preferences: { domain: 'Data Science', location: 'Colombo', duration: '6 months' } },
    { fullName: 'Kavindu Fernando', university: 'SLTC Research University', email: 'kavindu@sltc.ac.lk', degree: 'BSc (Hons) Software Engineering', yearOfStudy: 2, gpa: 3.2, skills: ['Java', 'Spring Boot', 'SQL', 'Git'], certifications: [], preferences: { domain: 'Software Engineering', location: 'Any', duration: '3 months' } },
    { fullName: 'Ishara Jayasuriya', university: 'NSBM Green University', email: 'ishara@nsbm.ac.lk', degree: 'BSc (Hons) Computer Science', yearOfStudy: 3, gpa: 3.4, skills: ['Figma', 'UI/UX Design', 'HTML', 'CSS', 'React'], certifications: ['Google UX Design Certificate'], preferences: { domain: 'Product Design', location: 'Colombo', duration: '3 months' } },
    { fullName: 'Sanduni Wickrama', university: 'University of Moratuwa', email: 'sanduni@uom.lk', degree: 'BSc (Hons) Computer Science', yearOfStudy: 4, gpa: 3.9, skills: ['Python', 'Flask', 'Docker', 'AWS', 'REST API', 'Testing'], certifications: ['AWS Certified Cloud Practitioner'], preferences: { domain: 'Cloud Engineering', location: 'Remote', duration: '3 months' } },
    { fullName: 'Dilani Rathnayake', university: 'SLTC Research University', email: 'dilani@sltc.ac.lk', degree: 'BSc (Hons) Computer Science', yearOfStudy: 2, gpa: 3.0, skills: ['HTML', 'CSS', 'JavaScript', 'Figma'], certifications: [], preferences: { domain: 'Product Design', location: 'Colombo', duration: '3 months' } },
    { fullName: 'Ruwan Bandara', university: 'University of Moratuwa', email: 'ruwan@uom.lk', degree: 'BSc (Hons) Information Technology', yearOfStudy: 4, gpa: 3.7, skills: ['Python', 'Flask', 'Docker', 'AWS', 'Testing'], certifications: ['AWS Certified Cloud Practitioner'], preferences: { domain: 'Cloud Engineering', location: 'Remote', duration: '3 months' } },
    { fullName: 'Hasini Gunasekara', university: 'NSBM Green University', email: 'hasini@nsbm.ac.lk', degree: 'BSc (Hons) Software Engineering', yearOfStudy: 3, gpa: 3.3, skills: ['React', 'Node.js', 'MongoDB', 'Git', 'JavaScript'], certifications: [], preferences: { domain: 'Software Engineering', location: 'Colombo', duration: '3 months' } },
    { fullName: 'Chathura Jayawardena', university: 'SLTC Research University', email: 'chathura@sltc.ac.lk', degree: 'BSc (Hons) Computer Science', yearOfStudy: 4, gpa: 3.85, skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL'], certifications: ['Coursera Machine Learning Specialisation'], preferences: { domain: 'Data Science', location: 'Colombo', duration: '6 months' } },
    { fullName: 'Pavani Rajapaksha', university: 'University of Moratuwa', email: 'pavani@uom.lk', degree: 'BSc (Hons) Information Technology', yearOfStudy: 3, gpa: 3.45, skills: ['Figma', 'UI/UX Design', 'HTML', 'CSS', 'JavaScript'], certifications: [], preferences: { domain: 'Product Design', location: 'Colombo', duration: '3 months' } },
  ];

  const studentByEmail = {};
  for (const s of studentsSeed) {
    const authUser = await createAuthUser({ email: s.email, role: 'student', fullName: s.fullName, university: s.university });
    const { data: profile } = await admin
      .from('student_profiles')
      .update({ degree: s.degree, year_of_study: s.yearOfStudy, gpa: s.gpa, skills: s.skills, certifications: s.certifications, preferences: s.preferences })
      .eq('user_id', authUser.id)
      .select('*')
      .single();
    studentByEmail[s.email] = { authUser, profile: rowToCamel(profile) };
  }

  // --- Internship postings ---
  const postingsSeed = [
    { company: 'WSO2', title: 'Software Engineering Intern', requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'], minGpa: 3.0, targetYear: 3, domain: 'Software Engineering', duration: '3 months', location: 'Colombo', stipendRange: 'LKR 30,000 - 40,000', positions: 3, deadline: '2026-11-15' },
    { company: 'IFS', title: 'Data Science Intern', requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'scikit-learn', 'SQL'], minGpa: 3.3, targetYear: 4, domain: 'Data Science', duration: '6 months', location: 'Colombo', stipendRange: 'LKR 40,000 - 55,000', positions: 2, deadline: '2026-11-20' },
    { company: 'Virtusa', title: 'Cloud & DevOps Intern', requiredSkills: ['Docker', 'AWS', 'REST API', 'Testing', 'Python'], minGpa: 3.2, targetYear: 4, domain: 'Cloud Engineering', duration: '3 months', location: 'Remote', stipendRange: 'LKR 35,000 - 45,000', positions: 2, deadline: '2026-11-25' },
    { company: 'Sysco LABS', title: 'Product Design Intern', requiredSkills: ['Figma', 'UI/UX Design', 'HTML', 'CSS'], minGpa: 3.0, targetYear: 3, domain: 'Product Design', duration: '3 months', location: 'Colombo', stipendRange: 'LKR 30,000 - 35,000', positions: 2, deadline: '2026-11-18' },
  ];
  const postingByCompany = {};
  for (const p of postingsSeed) {
    const { data: posting } = await admin
      .from('internship_postings')
      .insert({
        company_id: companyIdByName[p.company],
        title: p.title,
        required_skills: p.requiredSkills,
        min_gpa: p.minGpa,
        target_year: p.targetYear,
        domain: p.domain,
        duration: p.duration,
        location: p.location,
        stipend_range: p.stipendRange,
        positions: p.positions,
        deadline: p.deadline,
        status: 'published',
        created_at: daysAgo(10),
      })
      .select('*')
      .single();
    postingByCompany[p.company] = rowToCamel(posting);
  }

  // --- Readiness scores (real lib/matching.js formula, not a duplicate) ---
  const activePostings = Object.values(postingByCompany);
  for (const { profile } of Object.values(studentByEmail)) {
    const readinessScore = computeReadinessScore(profile, activePostings);
    await admin.from('student_profiles').update({ readiness_score: readinessScore }).eq('id', profile.id);
  }

  // --- Applications, offers, notifications ------------------------------
  async function applyTo(email, posting, { status, appliedDaysAgo, updatedDaysAgo }) {
    const { profile } = studentByEmail[email];
    const { matchScore, breakdown } = scoreStudentAgainstPosting(profile, posting);
    const { data: application } = await admin
      .from('applications')
      .insert({ student_id: profile.id, posting_id: posting.id, match_score: matchScore, breakdown, status, applied_at: daysAgo(appliedDaysAgo), updated_at: daysAgo(updatedDaysAgo) })
      .select('*')
      .single();

    const { data: companyRow } = await admin.from('company_profiles').select('user_id').eq('id', posting.companyId).single();
    await admin.from('notifications').insert({ user_id: companyRow.user_id, type: 'new_application', message: `New application for "${posting.title}" — ${matchScore}% match.`, read_status: true, created_at: daysAgo(appliedDaysAgo) });
    return application;
  }

  const wso2 = postingByCompany['WSO2'], ifs = postingByCompany['IFS'], virtusa = postingByCompany['Virtusa'], sysco = postingByCompany['Sysco LABS'];

  // Ashan Perera -> WSO2 -> full happy path: Accepted.
  await applyTo('ashan@sltc.ac.lk', wso2, { status: 'Accepted', appliedDaysAgo: 9, updatedDaysAgo: 1 });
  await admin.from('offer_letters').insert({ posting_id: wso2.id, student_id: studentByEmail['ashan@sltc.ac.lk'].profile.id, company_id: wso2.companyId, status: 'Accepted', sent_at: daysAgo(4), responded_at: daysAgo(1) });
  const ashanUser = studentByEmail['ashan@sltc.ac.lk'].authUser;
  await admin.from('notifications').insert([
    { user_id: ashanUser.id, type: 'application_status', message: `Your application for "${wso2.title}" was shortlisted.`, read_status: true, created_at: daysAgo(7) },
    { user_id: ashanUser.id, type: 'offer_received', message: `You received a digital offer letter from WSO2 for "${wso2.title}".`, read_status: true, created_at: daysAgo(4) },
  ]);

  // Kavindu Fernando -> WSO2 -> Rejected.
  await applyTo('kavindu@sltc.ac.lk', wso2, { status: 'Rejected', appliedDaysAgo: 8, updatedDaysAgo: 3 });

  // Hasini Gunasekara -> WSO2 -> Pending.
  await applyTo('hasini@nsbm.ac.lk', wso2, { status: 'Pending', appliedDaysAgo: 2, updatedDaysAgo: 2 });

  // Nadeesha Silva -> IFS -> Shortlisted.
  await applyTo('nadeesha@uom.lk', ifs, { status: 'Shortlisted', appliedDaysAgo: 6, updatedDaysAgo: 2 });

  // Chathura Jayawardena -> IFS -> Shortlisted.
  await applyTo('chathura@sltc.ac.lk', ifs, { status: 'Shortlisted', appliedDaysAgo: 5, updatedDaysAgo: 2 });

  // Sanduni Wickrama -> Virtusa -> fresh Pending.
  await applyTo('sanduni@uom.lk', virtusa, { status: 'Pending', appliedDaysAgo: 1, updatedDaysAgo: 1 });

  // Ruwan Bandara -> Virtusa -> full happy path: Accepted.
  await applyTo('ruwan@uom.lk', virtusa, { status: 'Accepted', appliedDaysAgo: 7, updatedDaysAgo: 1 });
  await admin.from('offer_letters').insert({ posting_id: virtusa.id, student_id: studentByEmail['ruwan@uom.lk'].profile.id, company_id: virtusa.companyId, status: 'Accepted', sent_at: daysAgo(3), responded_at: daysAgo(1) });

  // Ishara Jayasuriya -> Sysco LABS -> Shortlisted.
  await applyTo('ishara@nsbm.ac.lk', sysco, { status: 'Shortlisted', appliedDaysAgo: 4, updatedDaysAgo: 1 });

  // Pavani Rajapaksha -> Sysco LABS -> Pending.
  await applyTo('pavani@uom.lk', sysco, { status: 'Pending', appliedDaysAgo: 1, updatedDaysAgo: 1 });

  // Dilani Rathnayake intentionally has no applications yet — demonstrates the
  // platform's empty states (My Applications, Offer Letters) alongside the populated ones above.

  console.log('Seed complete.');
  console.log(`- ${unis.length} universities, ${companies.length + 1} companies (1 unverified), ${studentsSeed.length} students`);
  console.log(`- ${postingsSeed.length} internship postings`);
  console.log(`\nDemo password for every account: ${DEMO_PASSWORD}`);
  console.log('Login emails:');
  console.log(`  [admin] admin@nexskill.lk`);
  unis.forEach((u) => console.log(`  [university] ${u.email}`));
  companies.forEach((c) => console.log(`  [company] ${c.email}`));
  console.log(`  [company, unverified] recruit@zone24x7.lk`);
  studentsSeed.forEach((s) => console.log(`  [student] ${s.email}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
