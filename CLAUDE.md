# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NexSkill is a skill-based internship matching platform built for the CCS2360 Technology Challenge Competition (SLTC Research University). It matches students with internship postings using a weighted scoring engine with a TF-IDF-assisted skill-similarity layer, backed by a real Supabase Postgres database with Row-Level Security. See `report/NexSkill_Final_Report.docx`, `report/NexSkill_User_Manual.docx`, and `report/NexSkill_Presentation.pptx` for the full write-up, user guide, and slide deck.

## Commands

```bash
npm install
# requires a .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# and (seed script only) SUPABASE_SERVICE_ROLE_KEY — see .env.example
node scripts/seed.mjs       # wipes and reseeds the Supabase project via the admin API
npm run dev                 # start Next.js dev server at http://localhost:3000
npm run build
npm run start
```

Other scripts: `node scripts/optimize-experiment.mjs` (the Chapter 8 algorithm-optimisation experiment) and `node scripts/tfidf-check.mjs` (standalone TF-IDF similarity spot-checks).

There is no test suite and no linter configured (`eslint.ignoreDuringBuilds: true` in `next.config.js`).

## Demo accounts (password: `password123`)

- Admin: `admin@nexskill.lk`
- Company (verified): `recruit@wso2.lk`, `recruit@ifs.lk`, `recruit@virtusa.lk`, `recruit@syscolabs.lk`
- Company (unverified, for the admin verification queue): `recruit@zone24x7.lk`
- University: `partner@sltc.ac.lk`, `partner@uom.lk`, `partner@nsbm.ac.lk`
- Student (10 total, spanning Software Engineering/Data Science/Cloud Engineering/Product Design): `ashan@sltc.ac.lk`, `nadeesha@uom.lk`, `kavindu@sltc.ac.lk`, `ishara@nsbm.ac.lk`, `sanduni@uom.lk`, `dilani@sltc.ac.lk`, `ruwan@uom.lk`, `hasini@nsbm.ac.lk`, `chathura@sltc.ac.lk`, `pavani@uom.lk`

## Architecture

**Stack:** Next.js 16.3.8 (App Router, Turbopack), React 19.3.0, Tailwind CSS. Persistence is Supabase (PostgreSQL 17 + Auth + PostgREST) — there is no local JSON file and no `data/` directory; every API route issues targeted Supabase queries scoped by Row-Level Security rather than loading/saving a whole dataset.

**Auth:** Supabase Auth, not a custom scheme. `lib/supabaseServer.js` creates an SSR (cookie-session) client via `@supabase/ssr`; `lib/session.js`'s `getCurrentUser()` is async, fetches the authenticated user then their `public.users` profile row, and rejects (signs out) a `suspended` account. `lib/supabaseBrowser.js` is a browser-side client used only by the password-reset flow (`app/forgot-password`, `app/reset-password`). `lib/supabaseAdmin.js` is a service-role client used **only** by `scripts/seed.mjs` — never imported by `app/`. `proxy.js` (Next.js 16's renamed `middleware.js` convention) refreshes the Supabase session on every request.

**Role-based routing:** Four roles — `student`, `company`, `university`, `admin`. Each has its own Next.js route group (`app/student/`, `app/company/`, `app/university/`, `app/admin/`) with a layout that gates access via `getCurrentUser()`. API routes under `app/api/` do the same and additionally check `user.role`. Dynamic route `params` and `cookies()` are Promises under Next.js 16 — every handler with a `[id]` segment must `await params`.

**Matching engine (`lib/matching.js`):**
- `scoreStudentAgainstPosting(student, posting, weights = WEIGHTS)` — returns a 0–100 `matchScore` with a breakdown per factor; `weights` is overridable, which is what lets `scripts/optimize-experiment.mjs` re-run the identical, unmodified scoring logic under alternate weightings.
- Weights: Skill Overlap 45%, GPA 20%, Preferences 15%, Year of Study 10%, Certifications 10%.
- Skill similarity (`lib/skills.js`, `skillSetSimilarity()`) is three-tier: (1) exact string match = 1.0, (2) a curated `SEMANTIC_GROUPS` table = 0.75 (e.g. Node.js ≈ Express.js), (3) a TF-IDF cosine-similarity layer (`lib/tfidf.js`, built over a 70-skill descriptive-tag corpus, `SKILL_TFIDF_VECTORS` precomputed once at module load) capped at 0.55 credit above a 0.2 relatedness threshold — this catches related-but-uncurated pairs like React↔Vue or Docker↔Kubernetes.
- `analyseSkillGap(student, posting)` — returns missing skills and recommended courses from a hardcoded `COURSE_CATALOG`.
- `computeReadinessScore(student, activePostings)` — student dashboard readiness score combining top-3 match average (50%), GPA (30%), profile completeness (20%).

**CV parsing:** Rule-based keyword extraction in `lib/skills.js` (`extractSkillsFromText`), scanning raw text against the same 70-entry skill dictionary the TF-IDF corpus is built over. This is reported honestly (including in the report and manual) as a stand-in for a fine-tuned spaCy NER model, not claimed as equivalent to one.

**Notifications:** In-app only, stored in the `notifications` table, polled client-side. No push or email (Firebase Cloud Messaging was proposed but not integrated — see the report's Limitations).

**PDF generation:** `jspdf`, triggered client-side from `app/student/profile/page.js` (CV summary), `app/student/offers/page.js` (offer letter), and `app/university/dashboard/page.js` (placement report) — no server route involved in any of the three; the PDF is built and saved entirely in the browser.

**`@/` alias** maps to the project root (configured via `jsconfig.json`).

**Case conversion:** `lib/caseMap.js` (`rowToCamel`, `rowsToCamel`, `toSnakeRow`) converts between Postgres's snake_case columns and the app's camelCase JS objects at the API-route boundary.

## Data model (Supabase Postgres, RLS enabled on every table)

9 tables: `users`, `student_profiles`, `company_profiles`, `university_profiles`, `cv_uploads`, `internship_postings`, `applications`, `offer_letters`, `notifications`.

A `users` row is created **only** by a database trigger (`handle_new_user()`, `SECURITY DEFINER`, `AFTER INSERT ON auth.users`), which also creates the matching role-specific profile row, links a new student to their university by name if a verified match exists, and inserts an admin-queue notification for new company/university signups — this logic lives in the database, not application code, so it fires identically whether the auth user was created via the app's own `/api/auth/register` route or the admin-only seed script.

RLS policy shape: read access is broader than write access by design (e.g. any authenticated user can read `student_profiles` — a company needs to rank every registered student, not just its own applicants), while writes to a profile are restricted to its owner or an admin via both the `USING` and `WITH CHECK` clauses — a policy with `is_admin()` in `USING` but not `WITH CHECK` lets an admin write silently affect zero rows while the client reports success; this was a real bug caught and fixed during testing (see the Final Report, Chapter 7, TC-05).

## Prototype vs. still-simplified notes

- **NLP:** Rule-based `extractSkillsFromText` → a fine-tuned spaCy NER model would generalise beyond the fixed dictionary (further work).
- **Notifications:** In-app array, polled client-side → Firebase Cloud Messaging push (further work).
- Everything else proposed (Supabase, Row-Level Security, TF-IDF matching) is implemented for real, not simulated.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
