import { skillSetSimilarity } from '../lib/skills.js';

const cases = [
  { required: ['React'], candidate: ['Vue'], label: 'React vs Vue (related, not curated)' },
  { required: ['Vue'], candidate: ['Angular'], label: 'Vue vs Angular (related, not curated)' },
  { required: ['Figma'], candidate: ['Kubernetes'], label: 'Figma vs Kubernetes (unrelated)' },
  { required: ['Docker'], candidate: ['Kubernetes'], label: 'Docker vs Kubernetes (related, not curated)' },
  { required: ['Node.js'], candidate: ['Express.js'], label: 'Node.js vs Express.js (curated 0.75 tier)' },
  { required: ['Python'], candidate: ['JavaScript'], label: 'Python vs JavaScript (weakly related)' },
  { required: ['React'], candidate: ['React'], label: 'React vs React (exact)' },
  { required: ['TensorFlow'], candidate: ['PyTorch'], label: 'TensorFlow vs PyTorch (curated 0.75 tier)' },
  { required: ['GraphQL'], candidate: ['REST API'], label: 'GraphQL vs REST API (related, not curated)' },
];

for (const c of cases) {
  const score = skillSetSimilarity(c.required, c.candidate);
  console.log(`${c.label.padEnd(50)} -> ${(score * 100).toFixed(1)}%`);
}
