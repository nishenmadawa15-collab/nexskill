'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MatchRing from '@/components/MatchRing';

const STATUS_STYLE = {
  'Not applied': 'bg-line text-ink/50',
  Pending: 'bg-amber/15 text-amber',
  Shortlisted: 'bg-indigo-soft text-indigo-deep',
  Rejected: 'bg-coral/10 text-coral',
  Offered: 'bg-signal/20 text-ink',
  Accepted: 'bg-signal/30 text-ink',
};

function scoreClass(v) {
  return v >= 75 ? 'text-indigo' : v >= 50 ? 'text-amber' : 'text-coral';
}

export default function CandidatesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [posting, setPosting] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/company/postings/${id}/candidates`).then((r) => r.json()).then((d) => {
      setPosting(d.posting);
      setCandidates(d.candidates || []);
      setLoading(false);
    });
  }

  useEffect(load, [id]);

  function startEdit() {
    setForm({
      title: posting.title,
      requiredSkillsText: (posting.requiredSkills || []).join(', '),
      minGpa: posting.minGpa || '',
      targetYear: posting.targetYear || '',
      domain: posting.domain || '',
      duration: posting.duration,
      location: posting.location,
      stipendRange: posting.stipendRange || '',
      positions: posting.positions,
      deadline: posting.deadline,
    });
    setEditing(true);
  }

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function savePosting(e) {
    e.preventDefault();
    setSaving(true);
    const requiredSkills = form.requiredSkillsText.split(',').map((s) => s.trim()).filter(Boolean);
    await fetch(`/api/company/postings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, requiredSkills, minGpa: Number(form.minGpa) || 0, targetYear: Number(form.targetYear) || 0, positions: Number(form.positions) || 1 }),
    });
    setSaving(false);
    setEditing(false);
    load();
  }

  async function toggleStatus() {
    setActing('status');
    await fetch(`/api/company/postings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: posting.status === 'published' ? 'closed' : 'published' }),
    });
    setActing(null);
    load();
  }

  async function deletePosting() {
    if (!confirm('Delete this posting? This cannot be undone.')) return;
    setActing('delete');
    await fetch(`/api/company/postings/${id}`, { method: 'DELETE' });
    router.push('/company/postings');
  }

  async function updateApplication(applicationId, status) {
    setActing(applicationId);
    await fetch(`/api/company/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActing(null);
    load();
  }

  async function sendOffer(applicationId) {
    setActing(applicationId);
    await fetch('/api/company/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId }),
    });
    setActing(null);
    load();
  }

  if (loading) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-eyebrow mb-1">FR-MATCH-04 · Ranked candidate list</div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold">{posting?.title}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded ${posting?.status === 'published' ? 'bg-signal/20 text-ink' : 'bg-line text-ink/50'}`}>
              {posting?.status === 'published' ? 'Published' : 'Closed'}
            </span>
          </div>
          <div className="text-sm text-ink/55 mt-1">
            {posting?.location} &middot; {posting?.duration} &middot; requires {posting?.requiredSkills?.join(', ')}
          </div>
        </div>
        {posting && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={startEdit} className="btn-secondary text-sm py-2 px-4">Edit</button>
            <button onClick={toggleStatus} disabled={acting === 'status'} className="btn-secondary text-sm py-2 px-4 disabled:opacity-50">
              {posting.status === 'published' ? 'Close posting' : 'Reopen posting'}
            </button>
            <button onClick={deletePosting} disabled={acting === 'delete'} className="text-sm text-coral font-medium hover:underline disabled:opacity-50">Delete</button>
          </div>
        )}
      </div>

      {editing && form && (
        <form onSubmit={savePosting} className="card p-6 space-y-4">
          <div className="label-eyebrow">Edit posting</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label-eyebrow block mb-2">Title</label>
              <input className="input-field" value={form.title} onChange={(e) => updateForm('title', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="label-eyebrow block mb-2">Required skills (comma-separated)</label>
              <input className="input-field" value={form.requiredSkillsText} onChange={(e) => updateForm('requiredSkillsText', e.target.value)} required />
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Minimum GPA</label>
              <input type="number" step="0.1" min="0" max="4" className="input-field" value={form.minGpa} onChange={(e) => updateForm('minGpa', e.target.value)} />
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Target year</label>
              <select className="input-field" value={form.targetYear} onChange={(e) => updateForm('targetYear', e.target.value)}>
                <option value="">Any</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Duration</label>
              <input className="input-field" value={form.duration} onChange={(e) => updateForm('duration', e.target.value)} required />
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Location</label>
              <input className="input-field" value={form.location} onChange={(e) => updateForm('location', e.target.value)} required />
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Stipend range</label>
              <input className="input-field" value={form.stipendRange} onChange={(e) => updateForm('stipendRange', e.target.value)} />
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Positions</label>
              <input type="number" min="1" className="input-field" value={form.positions} onChange={(e) => updateForm('positions', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label-eyebrow block mb-2">Application deadline</label>
              <input type="date" className="input-field" value={form.deadline} onChange={(e) => updateForm('deadline', e.target.value)} required />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-ink/50 hover:text-ink">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {candidates.length === 0 && <div className="card p-8 text-center text-ink/50 text-sm">No registered students yet.</div>}
        {candidates.map((c) => (
          <div key={c.student.id} className="card p-6">
            <div className="flex items-start gap-5">
              <MatchRing score={c.matchScore} size={56} strokeWidth={5} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold">{c.studentName}</h3>
                    <div className="text-sm text-ink/55">{c.studentUniversity} &middot; Year {c.student.yearOfStudy} &middot; GPA {c.student.gpa}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded shrink-0 ${STATUS_STYLE[c.applicationStatus] || 'bg-line text-ink/60'}`}>
                    {c.applicationStatus}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(c.student.skills || []).map((s) => (
                    <span key={s} className={`text-xs px-2 py-1 rounded ${posting?.requiredSkills?.includes(s) ? 'bg-indigo-soft text-indigo-deep' : 'bg-paper text-ink/50'}`}>
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-line text-xs">
                  {Object.entries(c.breakdown).map(([k, v]) => (
                    <div key={k}><span className="text-ink/40">{k}</span> <span className={`font-mono font-medium ${scoreClass(v)}`}>{v}%</span></div>
                  ))}
                </div>

                {c.applicationId && c.applicationStatus === 'Pending' && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => updateApplication(c.applicationId, 'Shortlisted')} disabled={acting === c.applicationId} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">Shortlist</button>
                    <button onClick={() => updateApplication(c.applicationId, 'Rejected')} disabled={acting === c.applicationId} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">Reject</button>
                  </div>
                )}
                {c.applicationId && c.applicationStatus === 'Shortlisted' && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => sendOffer(c.applicationId)} disabled={acting === c.applicationId} className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50">Send offer letter</button>
                    <button onClick={() => updateApplication(c.applicationId, 'Rejected')} disabled={acting === c.applicationId} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">Reject</button>
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
