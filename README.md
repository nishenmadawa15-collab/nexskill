# NexSkill

Skill-based internship matching platform (CCS2360 Technology Challenge Competition, SLTC Research University).

Students build a skill profile, browse internships ranked by an explainable weighted match score, and apply in one click. Companies post internships and see an automatically ranked candidate list. Universities see placement analytics for their own enrolled students. Admins verify new company/university accounts and moderate postings.

The full write-up (architecture, matching algorithm, testing, evaluation), a user manual, and a slide deck are in [`report/`](report/).

## Setup

Requires a Supabase project. Create `.env.local` from `.env.example` and fill in the three Supabase values from your project's API settings:

```bash
npm install
cp .env.example .env.local   # then fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
node scripts/seed.mjs        # wipes and reseeds the Supabase project with demo data
npm run dev
```

Open http://localhost:3000

## Demo accounts (all use password: `password123`)

- Admin: `admin@nexskill.lk`
- Company (verified): `recruit@wso2.lk` (WSO2), `recruit@ifs.lk` (IFS), `recruit@virtusa.lk` (Virtusa), `recruit@syscolabs.lk` (Sysco LABS)
- Company (unverified — for the admin Verification Queue): `recruit@zone24x7.lk` (Zone24x7)
- University: `partner@sltc.ac.lk`, `partner@uom.lk`, `partner@nsbm.ac.lk`
- Student: `ashan@sltc.ac.lk`, `nadeesha@uom.lk`, `kavindu@sltc.ac.lk`, `ishara@nsbm.ac.lk`, `sanduni@uom.lk`, `dilani@sltc.ac.lk`, `ruwan@uom.lk`, `hasini@nsbm.ac.lk`, `chathura@sltc.ac.lk`, `pavani@uom.lk`

## Architecture

- **Frontend/backend:** Next.js 16 (App Router), React 19, Tailwind CSS.
- **Database/Auth:** Supabase — PostgreSQL 17, Supabase Auth, Row-Level Security enabled on every table, a signup trigger that provisions role-specific profile rows.
- **Matching engine:** a weighted scoring formula (Skill Overlap 45%, GPA 20%, Preferences 15%, Year of Study 10%, Certifications 10%), with skill similarity computed in three tiers — exact match, a curated semantic-equivalence table, and a from-scratch TF-IDF cosine-similarity layer for related-but-uncurated skill pairs.
- **Skill Gap Analyser:** per-posting missing-skill detection with course recommendations.
- **CV parsing:** rule-based dictionary keyword extraction (not a trained NLP model — see the report's Limitations).
- **Notifications:** in-app only, no push/email.
- **PDF generation:** client-side via jsPDF (CV summary, offer letters, university placement report).

Full detail, including the algorithm-optimisation experiment and real evaluation metrics (90% precision/recall against an algorithm-independent ground truth), is in `report/NexSkill_Final_Report.docx`.

## Scripts

- `node scripts/seed.mjs` — wipe and reseed the live Supabase project with demo data.
- `node scripts/optimize-experiment.mjs` — the algorithm-optimisation experiment (baseline vs. adjusted weights).
- `node scripts/tfidf-check.mjs` — standalone TF-IDF similarity spot-checks.
