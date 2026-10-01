import { getCurrentUser, jsonError } from '@/lib/session';
import { extractSkillsFromText } from '@/lib/skills';
import { rowToCamel } from '@/lib/caseMap';

// FR-NLP-01..04: accepts CV text, extracts skill entities, presents them for
// student confirmation before the profile is updated (confirmation happens via POST /api/student/cv/confirm).
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return jsonError('Not authorized.', 401);

  const { cvText } = await request.json();
  if (!cvText || cvText.trim().length < 20) {
    return jsonError('Paste your CV text (at least a couple of sentences) to extract skills.', 400);
  }

  const start = Date.now();
  const extractedSkills = extractSkillsFromText(cvText);
  const processingMs = Date.now() - start; // demonstrates NFR-PERF-02 (<5s) in the UI

  const { data: uploadRow } = await user.supabase
    .from('cv_uploads')
    .insert({
      user_id: user.id,
      raw_text_preview: cvText.slice(0, 500),
      extracted_skills: extractedSkills,
      status: 'pending_confirmation',
    })
    .select('*')
    .single();

  return Response.json({ upload: rowToCamel(uploadRow), processingMs });
}
