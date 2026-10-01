'use client';
import { useState } from 'react';

const SAMPLE_CV = `Ashan Perera — Software Engineering Undergraduate

Experienced with JavaScript, React and Node.js, having built several full-stack
projects using SQL databases and Git for version control. Comfortable with HTML
and CSS for responsive interfaces, and familiar with REST API design.`;

export default function CvUploadPage() {
  const [cvText, setCvText] = useState('');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  async function extract(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setConfirmed(false);
    const res = await fetch('/api/student/cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setResult(data);
    setSelected(data.upload.extractedSkills);
  }

  function toggle(skill) {
    setSelected((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  }

  async function confirm() {
    await fetch('/api/student/cv/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: result.upload.id, confirmedSkills: selected }),
    });
    setConfirmed(true);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="label-eyebrow mb-1">FR-NLP · CV skill extraction</div>
        <h1 className="font-display text-3xl font-semibold">Upload your CV</h1>
        <p className="text-sm text-ink/60 mt-2">
          Paste your CV text below. The parser extracts skill entities automatically —
          you confirm before anything is added to your profile.
        </p>
      </div>

      <form onSubmit={extract} className="space-y-3">
        <textarea
          className="input-field h-56 font-mono text-sm"
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="Paste CV text here…"
        />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Extracting…' : 'Extract skills'}
          </button>
          <button type="button" onClick={() => setCvText(SAMPLE_CV)} className="text-sm text-ink/50 hover:text-indigo">
            Use sample CV
          </button>
        </div>
        {error && <div className="text-sm text-coral">{error}</div>}
      </form>

      {result && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">Extracted skills</div>
            <div className="text-xs font-mono text-ink/40">{result.processingMs}ms · target &lt;5000ms</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.upload.extractedSkills.length === 0 && (
              <span className="text-sm text-ink/50">No known skills detected — try the sample CV or add skills manually on your profile.</span>
            )}
            {result.upload.extractedSkills.map((s) => (
              <button
                key={s}
                onClick={() => toggle(s)}
                type="button"
                className={`text-xs font-medium px-2.5 py-1.5 rounded border transition-colors ${
                  selected.includes(s) ? 'bg-indigo-soft border-indigo text-indigo-deep' : 'border-line text-ink/40 line-through'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink/45">Click a skill to include or exclude it, then confirm to merge into your profile.</p>
          <button onClick={confirm} disabled={confirmed} className="btn-secondary disabled:opacity-50">
            {confirmed ? 'Added to profile ✓' : `Confirm ${selected.length} skill${selected.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
    </div>
  );
}
