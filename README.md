# NexSkill — Working Prototype

Skill-based internship matching platform prototype (CCS2360 Technology Challenge Competition).

## Setup

```bash
npm install
node scripts/seed.js   # creates data/db.json with mock students/companies/universities
npm run dev
```

Open http://localhost:3000

## Demo accounts (all use password: password123)

- Admin: admin@nexskill.lk
- Company: recruit@wso2.lk (WSO2), recruit@ifs.lk (IFS), recruit@virtusa.lk (Virtusa)
- University: partner@sltc.ac.lk, partner@uom.lk, partner@nsbm.ac.lk
- Student: ashan@sltc.ac.lk, nadeesha@uom.lk, kavindu@sltc.ac.lk, ishara@nsbm.ac.lk, sanduni@uom.lk

## What's real vs. simplified for the prototype

- Matching engine (weighted scoring: Skill Overlap 45%, GPA 20%, Preferences 15%, Year of Study 10%, Certifications 10%) — real, per PRD Section 11.3.
- Skill Gap Analyser — real.
- NLP resume parsing — rule-based keyword extraction (stand-in for the spaCy fine-tuned model planned in the SRS AI Dev phase).
- Database — local JSON file (stand-in for Supabase, since that needs a cloud project/API keys).
- Notifications — in-app only (stand-in for Firebase Cloud Messaging).
- Offer letters — real accept/decline workflow with timestamps, downloadable as a PDF.
- CV summary — downloadable as a PDF from the student profile page.
