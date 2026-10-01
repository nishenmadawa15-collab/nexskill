import { buildTfidfVectors, cosineSimilarity } from './tfidf.js';

// Canonical skill dictionary for the prototype.
// In production this is the spaCy NER label set (Week 4 - AI Dev phase).
// Here it drives rule-based extraction so the demo runs without a trained model.

export const SKILL_DICTIONARY = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'PHP', 'Kotlin', 'Swift',
  'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
  'HTML', 'CSS', 'Tailwind CSS', 'Sass',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Firebase', 'Redis',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'Git', 'GitHub Actions',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy',
  'NLP', 'spaCy', 'Data Analysis', 'Data Visualization',
  'REST API', 'GraphQL', 'Microservices', 'System Design',
  'Figma', 'UI/UX Design', 'Agile', 'Scrum', 'Jira',
  'Testing', 'Unit Testing', 'Selenium', 'pytest',
  'Mobile Development', 'Flutter', 'React Native', 'Android', 'iOS',
];

// Groups of terms treated as exactly equivalent during matching (curated,
// high-confidence aliases — e.g. Node.js and Express.js are almost always
// used together on a backend JS stack). Checked before the TF-IDF layer
// below; a hit here always outranks a TF-IDF-only similarity.
export const SEMANTIC_GROUPS = [
  ['Node.js', 'Express.js'],
  ['React', 'Next.js'],
  ['SQL', 'PostgreSQL', 'MySQL'],
  ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'scikit-learn'],
  ['Testing', 'Unit Testing', 'pytest', 'Selenium'],
  ['Mobile Development', 'Flutter', 'React Native'],
  ['Google Cloud', 'AWS', 'Azure'],
  ['UI/UX Design', 'Figma'],
];

// Descriptive tag corpus for every skill in SKILL_DICTIONARY — the "documents"
// the TF-IDF layer is built over. Lets the matcher find reasonable partial
// credit for skill pairs nobody curated into SEMANTIC_GROUPS (e.g. a posting
// wanting "Vue" and a candidate listing "React" share frontend/javascript/
// ui/spa tags, so they score a moderate cosine similarity instead of zero).
const SKILL_TAGS = {
  'JavaScript': ['language', 'frontend', 'backend', 'web', 'scripting'],
  'TypeScript': ['language', 'frontend', 'backend', 'web', 'typed', 'javascript'],
  'Python': ['language', 'backend', 'scripting', 'data', 'ml', 'general'],
  'Java': ['language', 'backend', 'enterprise', 'jvm', 'oop'],
  'C++': ['language', 'systems', 'performance', 'oop'],
  'C#': ['language', 'backend', 'enterprise', 'dotnet', 'oop'],
  'Go': ['language', 'backend', 'systems', 'concurrency'],
  'PHP': ['language', 'backend', 'web', 'scripting'],
  'Kotlin': ['language', 'mobile', 'android', 'jvm', 'backend'],
  'Swift': ['language', 'mobile', 'ios', 'apple'],

  'React': ['frontend', 'javascript', 'ui', 'component', 'spa', 'library'],
  'Next.js': ['frontend', 'react', 'javascript', 'ssr', 'framework', 'fullstack'],
  'Vue': ['frontend', 'javascript', 'ui', 'component', 'spa', 'framework'],
  'Angular': ['frontend', 'javascript', 'typescript', 'ui', 'spa', 'framework'],
  'Node.js': ['backend', 'javascript', 'server', 'runtime'],
  'Express.js': ['backend', 'nodejs', 'javascript', 'server', 'framework', 'api'],
  'Django': ['backend', 'python', 'framework', 'fullstack', 'orm'],
  'Flask': ['backend', 'python', 'framework', 'api', 'lightweight'],
  'Spring Boot': ['backend', 'java', 'framework', 'enterprise', 'api'],

  'HTML': ['frontend', 'markup', 'web', 'structure'],
  'CSS': ['frontend', 'styling', 'web', 'design'],
  'Tailwind CSS': ['frontend', 'css', 'styling', 'framework', 'utility'],
  'Sass': ['frontend', 'css', 'styling', 'preprocessor'],

  'SQL': ['database', 'query', 'relational', 'data'],
  'PostgreSQL': ['database', 'relational', 'sql', 'data'],
  'MySQL': ['database', 'relational', 'sql', 'data'],
  'MongoDB': ['database', 'nosql', 'document', 'data'],
  'Supabase': ['database', 'backend', 'postgres', 'auth', 'baas'],
  'Firebase': ['database', 'backend', 'nosql', 'baas', 'notifications'],
  'Redis': ['database', 'cache', 'nosql', 'inmemory'],

  'Docker': ['devops', 'containers', 'deployment', 'infrastructure'],
  'Kubernetes': ['devops', 'containers', 'orchestration', 'infrastructure', 'cloud'],
  'AWS': ['cloud', 'infrastructure', 'devops', 'hosting'],
  'Azure': ['cloud', 'infrastructure', 'devops', 'hosting'],
  'Google Cloud': ['cloud', 'infrastructure', 'devops', 'hosting'],
  'CI/CD': ['devops', 'automation', 'deployment', 'pipeline'],
  'Git': ['versioncontrol', 'devops', 'collaboration'],
  'GitHub Actions': ['devops', 'cicd', 'automation', 'git'],

  'Machine Learning': ['ml', 'data', 'algorithms', 'ai'],
  'Deep Learning': ['ml', 'ai', 'neuralnetworks', 'data'],
  'TensorFlow': ['ml', 'ai', 'deeplearning', 'framework', 'python'],
  'PyTorch': ['ml', 'ai', 'deeplearning', 'framework', 'python'],
  'scikit-learn': ['ml', 'data', 'python', 'algorithms'],
  'Pandas': ['data', 'python', 'analysis', 'dataframe'],
  'NumPy': ['data', 'python', 'numerical', 'array'],

  'NLP': ['ml', 'ai', 'language', 'text', 'data'],
  'spaCy': ['nlp', 'ml', 'python', 'text', 'library'],
  'Data Analysis': ['data', 'analysis', 'statistics', 'insights'],
  'Data Visualization': ['data', 'charts', 'insights', 'presentation'],

  'REST API': ['api', 'backend', 'web', 'integration'],
  'GraphQL': ['api', 'backend', 'query', 'web'],
  'Microservices': ['architecture', 'backend', 'distributed', 'system'],
  'System Design': ['architecture', 'scalability', 'design', 'backend'],

  'Figma': ['design', 'ui', 'prototyping', 'collaboration'],
  'UI/UX Design': ['design', 'ui', 'ux', 'usability', 'figma'],
  'Agile': ['methodology', 'process', 'collaboration', 'scrum'],
  'Scrum': ['methodology', 'agile', 'process', 'teamwork'],
  'Jira': ['tool', 'projectmanagement', 'agile', 'tracking'],

  'Testing': ['qa', 'quality', 'testing', 'verification'],
  'Unit Testing': ['testing', 'qa', 'code', 'verification'],
  'Selenium': ['testing', 'qa', 'automation', 'web'],
  'pytest': ['testing', 'python', 'qa', 'automation'],

  'Mobile Development': ['mobile', 'app', 'android', 'ios'],
  'Flutter': ['mobile', 'framework', 'dart', 'crossplatform'],
  'React Native': ['mobile', 'react', 'javascript', 'crossplatform'],
  'Android': ['mobile', 'android', 'kotlin', 'java'],
  'iOS': ['mobile', 'ios', 'swift', 'apple'],
};

// Precomputed once at module load — the corpus (SKILL_TAGS) is static, so
// there's no reason to rebuild term frequencies on every match calculation.
const SKILL_TFIDF_VECTORS = buildTfidfVectors(SKILL_TAGS);

// Below this cosine similarity, two skills are treated as unrelated (too
// much noise from generic shared tags like "backend" or "framework" alone).
const TFIDF_RELATEDNESS_THRESHOLD = 0.2;
// TF-IDF credit is capped below the curated SEMANTIC_GROUPS tier (0.75) —
// it's a fuzzier, uncurated signal and should never outrank a human-reviewed
// equivalence.
const TFIDF_MAX_CREDIT = 0.55;

function tfidfSkillSimilarity(skillA, skillB) {
  const vecA = SKILL_TFIDF_VECTORS[skillA];
  const vecB = SKILL_TFIDF_VECTORS[skillB];
  if (!vecA || !vecB) return 0;
  return cosineSimilarity(vecA, vecB);
}

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, '');

export function extractSkillsFromText(text) {
  if (!text) return [];
  const found = new Set();
  const normText = ` ${text.toLowerCase()} `;
  for (const skill of SKILL_DICTIONARY) {
    const needle = skill.toLowerCase();
    if (normText.includes(needle)) found.add(skill);
  }
  return Array.from(found);
}

// Returns a 0-1 similarity between two skill sets. Three tiers, most to
// least confident: (1) exact string match, (2) curated SEMANTIC_GROUPS
// equivalence, (3) TF-IDF cosine similarity over the SKILL_TAGS corpus —
// this last tier is what actually supplements keyword matching with
// something resembling semantic understanding for skill pairs nobody
// hand-curated.
export function skillSetSimilarity(requiredSkills, candidateSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 1;
  const candList = candidateSkills || [];
  const candSet = new Set(candList.map(normalize));

  const equivalentTo = (skill) => {
    const group = SEMANTIC_GROUPS.find((g) => g.map(normalize).includes(normalize(skill)));
    return group ? group.map(normalize) : [normalize(skill)];
  };

  let score = 0;
  for (const req of requiredSkills) {
    const equivSet = equivalentTo(req);
    const exact = candSet.has(normalize(req));
    const semantic = !exact && equivSet.some((e) => candSet.has(e));

    if (exact) {
      score += 1;
    } else if (semantic) {
      score += 0.75;
    } else {
      // Best TF-IDF cosine similarity between the required skill and any
      // skill the candidate actually lists (exact-string lookups into the
      // corpus — candidate skills not in SKILL_DICTIONARY contribute 0).
      let bestSim = 0;
      for (const candSkill of candList) {
        const sim = tfidfSkillSimilarity(req, candSkill);
        if (sim > bestSim) bestSim = sim;
      }
      if (bestSim >= TFIDF_RELATEDNESS_THRESHOLD) {
        score += Math.min(TFIDF_MAX_CREDIT, bestSim);
      }
    }
  }
  return score / requiredSkills.length;
}
