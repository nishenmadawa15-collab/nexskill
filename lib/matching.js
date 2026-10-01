import { skillSetSimilarity } from './skills.js';

// Weights per PRD Section 11.3 / SRS FR-MATCH-01
export const WEIGHTS = {
  skillOverlap: 0.45,
  gpa: 0.20,
  preferences: 0.15,
  yearOfStudy: 0.10,
  certifications: 0.10,
};

function gpaAlignmentScore(studentGpa, minGpa) {
  if (!minGpa || minGpa <= 0) return 1;
  if (studentGpa >= minGpa) {
    // reward headroom above the minimum, capped
    return Math.min(1, 0.85 + (studentGpa - minGpa) * 0.15);
  }
  // partial credit that decays the further below the minimum
  const gap = minGpa - studentGpa;
  return Math.max(0, 1 - gap * 0.6);
}

function preferenceScore(studentPrefs, posting) {
  if (!studentPrefs) return 0.5;
  let matched = 0;
  let total = 0;
  if (studentPrefs.domain) {
    total += 1;
    if (studentPrefs.domain.toLowerCase() === (posting.domain || '').toLowerCase()) matched += 1;
  }
  if (studentPrefs.location) {
    total += 1;
    if (
      studentPrefs.location.toLowerCase() === 'any' ||
      studentPrefs.location.toLowerCase() === (posting.location || '').toLowerCase()
    ) matched += 1;
  }
  if (studentPrefs.duration) {
    total += 1;
    if (studentPrefs.duration === posting.duration) matched += 1;
  }
  return total === 0 ? 0.5 : matched / total;
}

function yearOfStudyScore(studentYear, targetYear) {
  if (!targetYear) return 1;
  const diff = Math.abs(studentYear - targetYear);
  if (diff === 0) return 1;
  if (diff === 1) return 0.6;
  return 0.2;
}

function certificationBonus(certifications, requiredSkills) {
  if (!certifications || certifications.length === 0) return 0;
  const reqLower = (requiredSkills || []).map((s) => s.toLowerCase());
  const relevant = certifications.filter((c) =>
    reqLower.some((r) => c.toLowerCase().includes(r) || r.includes(c.toLowerCase()))
  );
  const ratio = certifications.length ? relevant.length / certifications.length : 0;
  // relevant certs count fully, irrelevant certs still give a small baseline credit
  return Math.min(1, ratio * 0.85 + Math.min(certifications.length, 3) * 0.05);
}

/**
 * Scores one student against one internship posting.
 * Returns { matchScore (0-100), breakdown } matching FR-MATCH-01..04.
 *
 * `weights` defaults to the live WEIGHTS constant above; scripts/optimize-experiment.mjs
 * passes alternate coefficients through this same parameter to re-run the
 * identical scoring logic under different weightings — no duplicated code
 * between the live engine and the optimisation experiment.
 */
export function scoreStudentAgainstPosting(student, posting, weights = WEIGHTS) {
  const skillOverlap = skillSetSimilarity(posting.requiredSkills, student.skills || []);
  const gpa = gpaAlignmentScore(student.gpa, posting.minGpa);
  const preferences = preferenceScore(student.preferences, posting);
  const yearOfStudy = yearOfStudyScore(student.yearOfStudy, posting.targetYear);
  const certifications = certificationBonus(student.certifications, posting.requiredSkills);

  const weighted =
    skillOverlap * weights.skillOverlap +
    gpa * weights.gpa +
    preferences * weights.preferences +
    yearOfStudy * weights.yearOfStudy +
    certifications * weights.certifications;

  return {
    matchScore: Math.round(weighted * 100),
    breakdown: {
      skillOverlap: Math.round(skillOverlap * 100),
      gpa: Math.round(gpa * 100),
      preferences: Math.round(preferences * 100),
      yearOfStudy: Math.round(yearOfStudy * 100),
      certifications: Math.round(certifications * 100),
    },
  };
}

export function rankStudentsForPosting(students, posting) {
  return students
    .map((s) => ({ student: s, ...scoreStudentAgainstPosting(s, posting) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function rankPostingsForStudent(postings, student) {
  return postings
    .map((p) => ({ posting: p, ...scoreStudentAgainstPosting(student, p) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// --- Skill Gap Analyser (SRS 2.4 / FR-MATCH-05, FR-MATCH-06) ---

const COURSE_CATALOG = {
  'React': { provider: 'Coursera', cost: 'Free (audit)', time: '2 weeks' },
  'Next.js': { provider: 'LinkedIn Learning', cost: '$19.99', time: '1 week' },
  'Node.js': { provider: 'Coursera', cost: 'Free (audit)', time: '3 weeks' },
  'Express.js': { provider: 'LinkedIn Learning', cost: '$19.99', time: '1 week' },
  'SQL': { provider: 'Coursera', cost: 'Free (audit)', time: '2 weeks' },
  'PostgreSQL': { provider: 'LinkedIn Learning', cost: '$19.99', time: '2 weeks' },
  'Docker': { provider: 'Coursera', cost: 'Free (audit)', time: '1 week' },
  'AWS': { provider: 'Coursera', cost: '$49', time: '4 weeks' },
  'Machine Learning': { provider: 'Coursera', cost: 'Free (audit)', time: '6 weeks' },
  'Python': { provider: 'Coursera', cost: 'Free (audit)', time: '3 weeks' },
  'TensorFlow': { provider: 'Coursera', cost: '$49', time: '4 weeks' },
  'Flutter': { provider: 'LinkedIn Learning', cost: '$19.99', time: '2 weeks' },
  'Figma': { provider: 'LinkedIn Learning', cost: '$19.99', time: '1 week' },
  'Testing': { provider: 'Coursera', cost: 'Free (audit)', time: '2 weeks' },
  'REST API': { provider: 'LinkedIn Learning', cost: '$19.99', time: '1 week' },
  'NLP': { provider: 'Coursera', cost: '$49', time: '5 weeks' },
};

// Internship Readiness Score (SRS FR-STU-02): skill alignment with active postings,
// GPA, and profile completeness.
export function computeReadinessScore(student, activePostings) {
  const bestMatches = activePostings.length
    ? rankPostingsForStudent(activePostings, student).slice(0, 3)
    : [];
  const avgTopMatch = bestMatches.length
    ? bestMatches.reduce((sum, m) => sum + m.matchScore, 0) / bestMatches.length
    : 0;

  const gpaComponent = Math.min(100, (student.gpa / 4) * 100);

  let completeness = 0;
  if (student.degree) completeness += 20;
  if (student.yearOfStudy) completeness += 10;
  if (student.gpa > 0) completeness += 15;
  if (student.skills && student.skills.length >= 3) completeness += 30;
  if (student.certifications && student.certifications.length > 0) completeness += 10;
  if (student.preferences && student.preferences.domain) completeness += 15;

  const score = avgTopMatch * 0.5 + gpaComponent * 0.3 + completeness * 0.2;
  return Math.round(Math.min(100, score));
}

export function analyseSkillGap(student, posting) {
  const studentSet = new Set((student.skills || []).map((s) => s.toLowerCase()));
  const missing = (posting.requiredSkills || []).filter((s) => !studentSet.has(s.toLowerCase()));

  const recommendedCourses = missing.map((skill) => {
    const course = COURSE_CATALOG[skill] || { provider: 'Coursera', cost: 'Free (audit)', time: '2-3 weeks' };
    return { skill, ...course };
  });

  return { targetCategory: posting.domain || posting.title, missingSkills: missing, recommendedCourses };
}
