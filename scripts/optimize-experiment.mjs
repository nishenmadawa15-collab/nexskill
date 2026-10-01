// Run with: node scripts/optimize-experiment.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
//
// Algorithm-optimisation experiment (proposal Methodology §"Algorithm
// Optimisation Strategy" / Objective 6 / ILO3): runs the live matching
// engine (lib/matching.js, including the Phase B TF-IDF layer) against the
// full seeded dataset (10 students x 4 postings = 40 pairs), measures
// precision/recall/mean match score against an algorithm-independent
// ground-truth label, finds the empirically weakest predictor via Pearson
// correlation, adjusts that factor's weight, and re-measures.
//
// Ground truth (deliberately independent of the algorithm under test, to
// avoid circularity): a pair is "relevant" if the student's preferred
// domain matches the posting's domain AND the student holds at least 40%
// of the posting's required skills by exact string match (no semantic/
// TF-IDF credit — that's exactly the mechanism being evaluated).

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { scoreStudentAgainstPosting } from '../lib/matching.js';
import { rowsToCamel } from '../lib/caseMap.js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const MATCH_THRESHOLD = 60; // matchScore >= this is "predicted relevant"
const GROUND_TRUTH_SKILL_RATIO = 0.4;

function isGroundTruthRelevant(student, posting) {
  const domainMatch = (student.preferences?.domain || '').toLowerCase() === (posting.domain || '').toLowerCase();
  const reqSkills = posting.requiredSkills || [];
  const studentSkills = new Set((student.skills || []).map((s) => s.toLowerCase()));
  const heldCount = reqSkills.filter((s) => studentSkills.has(s.toLowerCase())).length;
  const skillRatio = reqSkills.length ? heldCount / reqSkills.length : 0;
  return domainMatch && skillRatio >= GROUND_TRUTH_SKILL_RATIO;
}

function evaluate(students, postings, weights) {
  const rows = [];
  for (const student of students) {
    for (const posting of postings) {
      const { matchScore, breakdown } = scoreStudentAgainstPosting(student, posting, weights);
      const relevant = isGroundTruthRelevant(student, posting);
      const predicted = matchScore >= MATCH_THRESHOLD;
      rows.push({ student, posting, matchScore, breakdown, relevant, predicted });
    }
  }

  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const r of rows) {
    if (r.relevant && r.predicted) tp++;
    else if (!r.relevant && r.predicted) fp++;
    else if (r.relevant && !r.predicted) fn++;
    else tn++;
  }
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const meanMatchScore = rows.reduce((sum, r) => sum + r.matchScore, 0) / rows.length;

  return { rows, tp, fp, fn, tn, precision, recall, f1, meanMatchScore };
}

function pearson(xs, ys) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

function correlationReport(rows) {
  const factors = ['skillOverlap', 'gpa', 'preferences', 'yearOfStudy', 'certifications'];
  const label = rows.map((r) => (r.relevant ? 1 : 0));
  const report = {};
  for (const f of factors) {
    const xs = rows.map((r) => r.breakdown[f]);
    report[f] = pearson(xs, label);
  }
  return report;
}

async function main() {
  const { data: studentRows } = await admin.from('student_profiles').select('*');
  const { data: postingRows } = await admin.from('internship_postings').select('*').eq('status', 'published');
  const students = rowsToCamel(studentRows);
  const postings = rowsToCamel(postingRows);

  if (students.length === 0 || postings.length === 0) {
    console.error('No students/postings found — run `npm run seed` first.');
    process.exit(1);
  }

  console.log(`Dataset: ${students.length} students x ${postings.length} postings = ${students.length * postings.length} pairs`);
  console.log(`Match threshold: matchScore >= ${MATCH_THRESHOLD}`);
  console.log(`Ground truth: preference-domain match AND exact-skill overlap >= ${GROUND_TRUTH_SKILL_RATIO * 100}%\n`);

  // --- Sprint 3: baseline ---
  const BASELINE_WEIGHTS = { skillOverlap: 0.45, gpa: 0.20, preferences: 0.15, yearOfStudy: 0.10, certifications: 0.10 };
  const baseline = evaluate(students, postings, BASELINE_WEIGHTS);
  const baselineCorr = correlationReport(baseline.rows);

  console.log('=== Sprint 3 — Baseline weights (45/20/15/10/10) ===');
  console.log(`Confusion matrix: TP=${baseline.tp} FP=${baseline.fp} FN=${baseline.fn} TN=${baseline.tn}`);
  console.log(`Precision: ${(baseline.precision * 100).toFixed(1)}%`);
  console.log(`Recall:    ${(baseline.recall * 100).toFixed(1)}%`);
  console.log(`F1:        ${(baseline.f1 * 100).toFixed(1)}%`);
  console.log(`Mean match score: ${baseline.meanMatchScore.toFixed(1)}`);
  console.log('\nPer-factor correlation with ground-truth relevance:');
  for (const [factor, r] of Object.entries(baselineCorr)) {
    console.log(`  ${factor.padEnd(14)} r = ${r.toFixed(3)}`);
  }

  // --- Sprint 5: adjust weights based on Sprint 3 findings ---
  // Empirically pick the weakest and strongest correlated factors (excluding
  // skillOverlap, which stays dominant by design) and shift 10 points of
  // weight from the weakest to skillOverlap, per the proposal's stated
  // strategy ("if GPA proves a weak predictor relative to skill overlap,
  // its coefficient is reduced").
  const nonSkillFactors = Object.entries(baselineCorr).filter(([f]) => f !== 'skillOverlap');
  const weakest = nonSkillFactors.reduce((a, b) => (Math.abs(a[1]) < Math.abs(b[1]) ? a : b));
  const SHIFT = 0.10;

  const ADJUSTED_WEIGHTS = { ...BASELINE_WEIGHTS };
  ADJUSTED_WEIGHTS[weakest[0]] = Math.max(0, +(ADJUSTED_WEIGHTS[weakest[0]] - SHIFT).toFixed(2));
  ADJUSTED_WEIGHTS.skillOverlap = +(ADJUSTED_WEIGHTS.skillOverlap + SHIFT).toFixed(2);

  const adjusted = evaluate(students, postings, ADJUSTED_WEIGHTS);
  const adjustedCorr = correlationReport(adjusted.rows);

  console.log(`\n=== Sprint 5 — Adjusted weights ===`);
  console.log(`Weakest baseline predictor: ${weakest[0]} (r = ${weakest[1].toFixed(3)}) -> weight reduced by ${SHIFT}, shifted into skillOverlap`);
  console.log(`New weights: ${JSON.stringify(ADJUSTED_WEIGHTS)}`);
  console.log(`Confusion matrix: TP=${adjusted.tp} FP=${adjusted.fp} FN=${adjusted.fn} TN=${adjusted.tn}`);
  console.log(`Precision: ${(adjusted.precision * 100).toFixed(1)}%`);
  console.log(`Recall:    ${(adjusted.recall * 100).toFixed(1)}%`);
  console.log(`F1:        ${(adjusted.f1 * 100).toFixed(1)}%`);
  console.log(`Mean match score: ${adjusted.meanMatchScore.toFixed(1)}`);
  console.log('\nPer-factor correlation with ground-truth relevance:');
  for (const [factor, r] of Object.entries(adjustedCorr)) {
    console.log(`  ${factor.padEnd(14)} r = ${r.toFixed(3)}`);
  }

  console.log('\n=== Misclassified pairs (baseline) ===');
  for (const r of baseline.rows) {
    const wrong = (r.relevant && !r.predicted) || (!r.relevant && r.predicted);
    if (wrong) {
      const kind = r.relevant ? 'FN (missed a real match)' : 'FP (flagged a non-match)';
      console.log(`  ${kind}: ${r.student.preferences?.domain || 'unknown'}-track student (GPA ${r.student.gpa}, ${r.student.skills.length} skills) vs "${r.posting.title}" (${r.posting.domain}) — matchScore=${r.matchScore}`);
    }
  }

  console.log('\n=== Before / After summary ===');
  console.log('Metric          Baseline    Adjusted    Delta');
  const row = (label, a, b, pct = true) => {
    const fa = pct ? (a * 100).toFixed(1) + '%' : a.toFixed(1);
    const fb = pct ? (b * 100).toFixed(1) + '%' : b.toFixed(1);
    const delta = pct ? ((b - a) * 100).toFixed(1) + 'pp' : (b - a).toFixed(1);
    console.log(`${label.padEnd(15)} ${fa.padEnd(11)} ${fb.padEnd(11)} ${delta}`);
  };
  row('Precision', baseline.precision, adjusted.precision);
  row('Recall', baseline.recall, adjusted.recall);
  row('F1', baseline.f1, adjusted.f1);
  row('Mean score', baseline.meanMatchScore, adjusted.meanMatchScore, false);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
