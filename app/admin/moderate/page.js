'use client';
import { useEffect, useState } from 'react';

export default function ModeratePage() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  function load() {
    fetch('/api/admin/moderate').then((r) => r.json()).then((d) => {
      setPostings(d.postings || []);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function act(postingId, action) {
    if (action === 'remove' && !confirm('Remove this listing? This cannot be undone.')) return;
    setActing(postingId);
    await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postingId, action }),
    });
    setActing(null);
    load();
  }

  if (loading) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="label-eyebrow mb-1">FR-ADM-03 · Flag or remove fraudulent postings</div>
        <h1 className="font-display text-3xl font-semibold">Moderate Listings</h1>
      </div>

      {postings.length === 0 ? (
        <div className="card p-8 text-center text-ink/50 text-sm">No postings on the platform yet.</div>
      ) : (
        <div className="card divide-y divide-line">
          {postings.map((p) => (
            <div key={p.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-medium">{p.title}</div>
                  {p.flagged && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber/15 text-amber">Flagged — hidden from students</span>
                  )}
                </div>
                <div className="text-sm text-ink/50">{p.companyName} &middot; {p.location} &middot; {p.status}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => act(p.id, p.flagged ? 'unflag' : 'flag')}
                  disabled={acting === p.id}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
                >
                  {p.flagged ? 'Unflag' : 'Flag'}
                </button>
                <button onClick={() => act(p.id, 'remove')} disabled={acting === p.id} className="text-sm text-coral font-medium hover:underline disabled:opacity-50">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
