'use client';
import { useEffect, useState } from 'react';

const STATUS_STYLE = {
  Pending: 'bg-amber/15 text-amber',
  Shortlisted: 'bg-indigo-soft text-indigo-deep',
  Rejected: 'bg-coral/10 text-coral',
  Offered: 'bg-signal/20 text-ink',
  Accepted: 'bg-signal/30 text-ink',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/applications').then((r) => r.json()).then((d) => {
      setApplications(d.applications || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="label-eyebrow mb-1">FR-STU-06 · Pending → Shortlisted/Rejected → Offered/Accepted</div>
        <h1 className="font-display text-3xl font-semibold">My Applications</h1>
      </div>

      {applications.length === 0 ? (
        <div className="card p-8 text-center text-ink/50 text-sm">You haven&rsquo;t applied to any internships yet.</div>
      ) : (
        <div className="card divide-y divide-line">
          {applications.map((a) => (
            <div key={a.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{a.postingTitle}</div>
                <div className="text-sm text-ink/50">{a.companyName} &middot; applied {new Date(a.appliedAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-xs font-mono text-ink/40">{a.matchScore}% match</div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded ${STATUS_STYLE[a.status] || 'bg-line text-ink/60'}`}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
