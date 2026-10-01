'use client';
import { useEffect, useState } from 'react';
import MatchRing from '@/components/MatchRing';

const BREAKDOWN_LABELS = {
  skillOverlap: 'Skill Overlap (45%)',
  gpa: 'GPA Alignment (20%)',
  preferences: 'Preference Match (15%)',
  yearOfStudy: 'Year of Study (10%)',
  certifications: 'Certification Bonus (10%)',
};

function scoreClass(v) {
  return v >= 75 ? 'text-indigo' : v >= 50 ? 'text-amber' : 'text-coral';
}

export default function InternshipsPage() {
  const [matches, setMatches] = useState([]);
  const [processingMs, setProcessingMs] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [gap, setGap] = useState(null);
  const [applying, setApplying] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch('/api/student/matches').then((r) => r.json()).then((d) => {
      setMatches(d.matches || []);
      setProcessingMs(d.processingMs);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function apply(postingId) {
    setApplying(postingId);
    await fetch('/api/student/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postingId }),
    });
    setApplying(null);
    load();
  }

  async function viewGap(postingId) {
    if (expanded === postingId) { setExpanded(null); return; }
    setExpanded(postingId);
    const res = await fetch(`/api/student/skill-gap?postingId=${postingId}`);
    const data = await res.json();
    setGap(data.result);
  }

  if (loading) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-eyebrow mb-1">FR-MATCH · Ranked by match percentage</div>
          <h1 className="font-display text-3xl font-semibold">Matched Internships</h1>
        </div>
        {processingMs != null && (
          <div className="text-xs font-mono text-ink/40">{processingMs}ms · target &lt;3000ms</div>
        )}
      </div>

      <div className="space-y-4">
        {matches.length === 0 && <div className="card p-8 text-center text-ink/50 text-sm">No published internships yet.</div>}
        {matches.map((m) => (
          <div key={m.posting.id} className="card p-6">
            <div className="flex items-start gap-5">
              <MatchRing score={m.matchScore} size={64} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="label-eyebrow">{m.companyName}</div>
                    <h3 className="font-display text-lg font-semibold mt-0.5">{m.posting.title}</h3>
                    <div className="text-sm text-ink/55 mt-1">
                      {m.posting.location} &middot; {m.posting.duration} &middot; {m.posting.stipendRange} &middot; {m.posting.positions} position(s)
                    </div>
                    <div className="text-xs text-ink/40 mt-1">Deadline {m.posting.deadline}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => apply(m.posting.id)}
                      disabled={m.alreadyApplied || applying === m.posting.id}
                      className="btn-primary text-sm py-2 px-4 disabled:opacity-40"
                    >
                      {m.alreadyApplied ? 'Applied ✓' : applying === m.posting.id ? 'Applying…' : 'Apply now'}
                    </button>
                    <button onClick={() => viewGap(m.posting.id)} className="text-xs text-indigo font-medium">
                      {expanded === m.posting.id ? 'Hide skill gap' : 'View skill gap →'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-line">
                  {Object.entries(m.breakdown).map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <div className="text-ink/40">{BREAKDOWN_LABELS[k]}</div>
                      <div className={`font-mono font-medium ${scoreClass(v)}`}>{v}%</div>
                    </div>
                  ))}
                </div>

                {expanded === m.posting.id && gap && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <div className="label-eyebrow mb-2">Skill Gap Analyser — {gap.targetCategory}</div>
                    {gap.missingSkills.length === 0 ? (
                      <p className="text-sm text-indigo font-medium">You have every required skill for this posting.</p>
                    ) : (
                      <div className="space-y-2">
                        {gap.recommendedCourses.map((c) => (
                          <div key={c.skill} className="flex items-center justify-between text-sm bg-paper rounded px-3 py-2">
                            <span className="font-medium">{c.skill}</span>
                            <span className="text-ink/50 text-xs">{c.provider} &middot; {c.cost} &middot; {c.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
