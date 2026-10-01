'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import MatchRing from '@/components/MatchRing';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/student/profile').then((r) => r.json()),
      fetch('/api/student/matches').then((r) => r.json()),
    ]).then(([p, m]) => {
      setProfile(p.profile);
      setUser(p.user);
      setMatches((m.matches || []).slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ink/40">Loading…</div>;

  const profileComplete = profile?.degree && profile?.skills?.length >= 3;

  return (
    <div className="space-y-8">
      <div>
        <div className="label-eyebrow mb-1">Welcome back</div>
        <h1 className="font-display text-3xl font-semibold">{user?.fullName}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="card p-6 flex items-center gap-5">
          <MatchRing score={profile?.readinessScore || 0} label="Readiness" />
          <div>
            <div className="text-sm text-ink/60 leading-snug">
              Internship Readiness Score — based on skill alignment, GPA, and profile completeness.
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Profile</div>
          <div className="text-2xl font-display font-semibold">{profile?.degree || 'Incomplete'}</div>
          <div className="text-sm text-ink/60 mt-1">
            Year {profile?.yearOfStudy || '—'} &middot; GPA {profile?.gpa || '—'} &middot; {profile?.skills?.length || 0} skills listed
          </div>
          {!profileComplete && (
            <Link href="/student/profile" className="text-sm text-indigo font-medium mt-3 inline-block">
              Complete your profile →
            </Link>
          )}
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-2">Quick actions</div>
          <div className="flex flex-col gap-2 mt-2">
            <Link href="/student/cv-upload" className="text-sm font-medium text-ink hover:text-indigo">Upload your CV →</Link>
            <Link href="/student/internships" className="text-sm font-medium text-ink hover:text-indigo">Browse matched internships →</Link>
            <Link href="/student/offers" className="text-sm font-medium text-ink hover:text-indigo">Review offer letters →</Link>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Top matches for you</h2>
          <Link href="/student/internships" className="text-sm text-indigo font-medium">View all →</Link>
        </div>
        {matches.length === 0 ? (
          <div className="card p-8 text-center text-ink/50 text-sm">
            No internships published yet. Check back soon.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {matches.map((m) => (
              <div key={m.posting.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="label-eyebrow">{m.companyName}</div>
                    <h3 className="font-display font-semibold mt-1">{m.posting.title}</h3>
                  </div>
                  <MatchRing score={m.matchScore} size={48} strokeWidth={5} />
                </div>
                <div className="text-sm text-ink/55 mt-3">{m.posting.location} &middot; {m.posting.duration}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
