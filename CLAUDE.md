# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NexSkill is a skill-based internship matching platform prototype built for CCS2360 Technology Challenge Competition. It matches students with internship postings using a weighted scoring engine.

## Commands

```bash
npm install
node scripts/seed.js        # populate data/db.json with mock users/companies/universities
npm run dev                 # start Next.js dev server at http://localhost:3000
npm run build
npm run start
```

There is no test suite and no linter configured (`eslint.ignoreDuringBuilds: true` in `next.config.js`).

## Demo accounts (password: `password123`)

- Admin: `admin@nexskill.lk`
- Company: `recruit@wso2.lk`, `recruit@ifs.lk`, `recruit@virtusa.lk`
- University: `partner@sltc.ac.lk`, `partner@uom.lk`, `partner@nsbm.ac.lk`
- Student: `ashan@sltc.ac.lk`, `nadeesha@uom.lk`, `kavindu@sltc.ac.lk`, `ishara@nsbm.ac.lk`, `sanduni@uom.lk`

## Architecture

**Stack:** Next.js 14 App Router, React 18, Tailwind CSS. No external database — all persistence goes through `data/db.json` via `lib/db.js` (`readDb` / `writeDb`).

**Auth:** Custom HMAC-signed session tokens (no JWT library). `lib/auth.js` signs/verifies tokens; `lib/session.js` reads them from the `nexskill_session` HttpOnly cookie on every request. The `SECRET` constant in `lib/auth.js` is intentionally hardcoded for demo use.

**Role-based routing:** Four roles — `student`, `company`, `university`, `admin`. Each has its own Next.js route group (`app/student/`, `app/company/`, `app/university/`, `app/admin/`) with a layout that gates access. API routes call `getCurrentUser()` from `lib/session.js` and check `user.role`.

**Matching engine (`lib/matching.js`):**
- `scoreStudentAgainstPosting(student, posting)` — returns a 0–100 `matchScore` with a breakdown per factor.
- Weights: Skill Overlap 45%, GPA 20%, Preferences 15%, Year of Study 10%, Certifications 10% (per PRD §11.3).
- Skill similarity (`lib/skills.js`) uses `SEMANTIC_GROUPS` to give 0.75× credit to semantically equivalent skills (e.g. Node.js ≈ Express.js).
- `analyseSkillGap(student, posting)` — returns missing skills and recommended courses from a hardcoded `COURSE_CATALOG`.
- `computeReadinessScore(student, activePostings)` — student dashboard readiness score combining top-3 match average (50%), GPA (30%), profile completeness (20%).

**CV parsing:** Rule-based keyword extraction in `lib/skills.js` (`extractSkillsFromText`). Scans raw text against `SKILL_DICTIONARY`. This stands in for the spaCy NER model planned for the production AI phase.

**Notifications:** In-app only, stored in `db.notifications`. No push or email.

**PDF generation:** `jspdf`, triggered client-side from `app/student/profile/page.js` (CV summary) and `app/student/offers/page.js` (offer letter) — no server route involved, the PDF is built and saved entirely in the browser.

**`@/` alias** maps to the project root (configured via `jsconfig.json`).

## Data model (in `data/db.json`)

Top-level collections: `users`, `studentProfiles`, `companyProfiles`, `universityProfiles`, `cvUploads`, `internshipPostings`, `applications`, `offerLetters`, `notifications`.

A `user` record holds identity (`id`, `email`, `role`, `fullName`, `passwordHash`). Role-specific data lives in the corresponding `*Profiles` collection, linked by `userId`.

## Prototype vs. production notes

- **Database:** `data/db.json` → Supabase in production
- **Auth:** Hardcoded HMAC secret → Supabase Auth in production
- **NLP:** Rule-based `extractSkillsFromText` → fine-tuned spaCy model in production
- **Notifications:** In-app array → Firebase Cloud Messaging in production

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
