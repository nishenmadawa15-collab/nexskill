'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PostInternshipPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', requiredSkillsText: '', minGpa: '', targetYear: '', domain: '',
    duration: '3 months', location: '', stipendRange: '', positions: '1', deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const requiredSkills = form.requiredSkillsText.split(',').map((s) => s.trim()).filter(Boolean);
    const res = await fetch('/api/company/postings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, requiredSkills }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push('/company/postings');
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <div className="label-eyebrow mb-1">FR-COMP-02</div>
        <h1 className="font-display text-3xl font-semibold">Post an Internship</h1>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label-eyebrow block mb-2">Title</label>
          <input className="input-field" value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </div>
        <div>
          <label className="label-eyebrow block mb-2">Required skills (comma-separated)</label>
          <input className="input-field" value={form.requiredSkillsText} onChange={(e) => update('requiredSkillsText', e.target.value)} placeholder="React, Node.js, SQL" required />
        </div>
        <div>
          <label className="label-eyebrow block mb-2">Domain / category</label>
          <input className="input-field" value={form.domain} onChange={(e) => update('domain', e.target.value)} placeholder="e.g. Software Engineering" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow block mb-2">Minimum GPA</label>
            <input type="number" step="0.1" min="0" max="4" className="input-field" value={form.minGpa} onChange={(e) => update('minGpa', e.target.value)} />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Target year</label>
            <select className="input-field" value={form.targetYear} onChange={(e) => update('targetYear', e.target.value)}>
              <option value="">Any</option>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow block mb-2">Duration</label>
            <input className="input-field" value={form.duration} onChange={(e) => update('duration', e.target.value)} required />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Location</label>
            <input className="input-field" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Colombo" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow block mb-2">Stipend range</label>
            <input className="input-field" value={form.stipendRange} onChange={(e) => update('stipendRange', e.target.value)} placeholder="LKR 30,000 - 40,000" />
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Positions</label>
            <input type="number" min="1" className="input-field" value={form.positions} onChange={(e) => update('positions', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label-eyebrow block mb-2">Application deadline</label>
          <input type="date" className="input-field" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} required />
        </div>

        {error && <div className="text-sm text-coral bg-coral/5 border border-coral/20 rounded px-3 py-2">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Publishing…' : 'Publish posting'}
        </button>
      </form>
    </div>
  );
}
