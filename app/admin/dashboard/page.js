'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-ink/40">Loading…</div>;

  const cards = [
    { label: 'Students', value: data.totals.totalStudents },
    { label: 'Companies', value: `${data.totals.verifiedCompanies}/${data.totals.totalCompanies} verified` },
    { label: 'Universities', value: `${data.totals.verifiedUniversities}/${data.totals.totalUniversities} verified` },
    { label: 'Postings', value: data.totals.totalPostings },
    { label: 'Applications', value: data.totals.totalApplications },
    { label: 'Placements', value: data.totals.totalPlacements },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="label-eyebrow mb-1">FR-ADM-04 · Platform-wide analytics</div>
        <h1 className="font-display text-3xl font-semibold">Admin Overview</h1>
      </div>

      {data.pendingVerifications.length > 0 && (
        <div className="card p-5 border-l-4 border-l-amber bg-amber/5 flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">{data.pendingVerifications.length} account(s) awaiting verification</div>
            <p className="text-sm text-ink/60 mt-0.5">Companies and universities can&rsquo;t post or view analytics until approved.</p>
          </div>
          <Link href="/admin/verify" className="btn-primary text-sm py-2 px-4 shrink-0">Review queue</Link>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="card p-6">
            <div className="label-eyebrow mb-2">{c.label}</div>
            <div className="font-display text-3xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Top in-demand skills</h2>
        {data.topSkills.length === 0 ? (
          <div className="card p-8 text-center text-ink/50 text-sm">No postings yet.</div>
        ) : (
          <div className="card p-6 space-y-3">
            {data.topSkills.map((s) => (
              <div key={s.skill} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium shrink-0">{s.skill}</div>
                <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                  <div className="h-full bg-indigo rounded-full" style={{ width: `${(s.count / data.topSkills[0].count) * 100}%` }} />
                </div>
                <div className="text-xs font-mono text-ink/40 w-6 text-right">{s.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
