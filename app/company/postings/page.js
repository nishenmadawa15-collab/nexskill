'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CompanyPostingsPage() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/company/postings').then((r) => r.json()).then((d) => {
      setPostings(d.postings || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-eyebrow mb-1">FR-COMP-02 / FR-COMP-03</div>
          <h1 className="font-display text-3xl font-semibold">My Postings</h1>
        </div>
        <Link href="/company/post-internship" className="btn-primary text-sm py-2 px-4">Post internship</Link>
      </div>

      {postings.length === 0 ? (
        <div className="card p-8 text-center text-ink/50 text-sm">No postings yet — create your first one.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {postings.map((p) => (
            <Link key={p.id} href={`/company/postings/${p.id}`} className="card p-6 block hover:border-indigo transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <div className="text-sm text-ink/55 mt-1">{p.location} &middot; {p.duration}</div>
                </div>
                <span className="text-xs font-mono bg-indigo-soft text-indigo-deep px-2 py-1 rounded">{p.applicantCount} applied</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {p.requiredSkills.slice(0, 5).map((s) => (
                  <span key={s} className="text-xs text-ink/50 bg-paper px-2 py-1 rounded">{s}</span>
                ))}
              </div>
              <div className="text-xs text-ink/40 mt-4">Deadline {p.deadline}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
