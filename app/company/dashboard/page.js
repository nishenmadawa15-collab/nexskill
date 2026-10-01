'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CompanyDashboard() {
  const [postings, setPostings] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/company/postings').then((r) => r.json()).then((d) => {
      setPostings(d.postings || []);
      setCompanyProfile(d.companyProfile);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ink/40">Loading…</div>;

  const totalApplicants = postings.reduce((sum, p) => sum + p.applicantCount, 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="label-eyebrow mb-1">{companyProfile?.companyName}</div>
        <h1 className="font-display text-3xl font-semibold">Recruiter Dashboard</h1>
      </div>

      {!companyProfile?.verified && (
        <div className="card p-5 border-l-4 border-l-amber bg-amber/5">
          <div className="font-medium text-sm">Your account is awaiting admin verification.</div>
          <p className="text-sm text-ink/60 mt-1">
            You&rsquo;ll be able to post internships and view analytics once an admin approves your account (NFR-SEC-06).
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Active postings</div>
          <div className="font-display text-4xl font-semibold">{postings.length}</div>
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Total applicants</div>
          <div className="font-display text-4xl font-semibold">{totalApplicants}</div>
        </div>
        <div className="card p-6 flex flex-col justify-between">
          <div className="label-eyebrow mb-2">Post a new role</div>
          <Link href="/company/post-internship" className="btn-primary text-sm py-2 px-4 w-fit">
            Post internship
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Your postings</h2>
          <Link href="/company/postings" className="text-sm text-indigo font-medium">View all →</Link>
        </div>
        {postings.length === 0 ? (
          <div className="card p-8 text-center text-ink/50 text-sm">No postings yet.</div>
        ) : (
          <div className="card divide-y divide-line">
            {postings.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/company/postings/${p.id}`} className="p-5 flex items-center justify-between hover:bg-paper transition-colors block">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-ink/50">{p.location} &middot; {p.duration}</div>
                </div>
                <div className="text-sm font-mono text-ink/50">{p.applicantCount} applicant(s)</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
