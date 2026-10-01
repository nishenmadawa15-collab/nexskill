import Link from 'next/link';
import MatchRing from '@/components/MatchRing';

const ROLES = [
  {
    key: 'student',
    title: 'Students',
    copy: 'Build your profile, upload your CV, and see exactly how you match — with a ranked path to close every gap.',
    href: '/login?mode=register&role=student',
  },
  {
    key: 'company',
    title: 'Companies',
    copy: 'Post a role once. Get a ranked shortlist with a skill breakdown per candidate — no more unfiltered inboxes.',
    href: '/login?mode=register&role=company',
  },
  {
    key: 'university',
    title: 'Universities',
    copy: 'See placement outcomes and the top skill gaps across your student body, in real time.',
    href: '/login?mode=register&role=university',
  },
];

const SAMPLE_BREAKDOWN = [
  { label: 'Skill Overlap', value: 92 },
  { label: 'GPA Alignment', value: 85 },
  { label: 'Preferences', value: 78 },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display font-semibold text-lg tracking-tight">NexSkill</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-ink/70 hover:text-ink">
              Sign in
            </Link>
            <Link href="/login?mode=register" className="btn-primary text-sm py-2 px-4">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="grid md:grid-cols-[1fr_auto] gap-x-16 gap-y-12 items-center">
            <div>
              <div className="label-eyebrow mb-5">Sri Lanka&rsquo;s first skill-based internship ecosystem</div>
              <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                Stop applying into the void.
              </h1>
              <p className="mt-6 text-lg text-ink/70 max-w-xl">
                NexSkill matches undergraduates to internships on actual skill overlap — not keyword luck —
                and shows companies a ranked shortlist instead of a pile of unfiltered CVs.
              </p>
              <div className="mt-9 flex items-center gap-4">
                <Link href="/login?mode=register" className="btn-primary">
                  Create your account
                </Link>
                <Link href="/login" className="btn-secondary">
                  I already have one
                </Link>
              </div>
            </div>

            <div className="mx-auto md:mx-0">
              <div className="rotate-2 w-72 bg-indigo-soft border border-indigo/20 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <MatchRing score={87} size={64} />
                  <div>
                    <div className="label-eyebrow">WSO2</div>
                    <div className="font-display font-semibold leading-snug mt-0.5">
                      Software Engineering<br />Intern
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo/15 space-y-3">
                  {SAMPLE_BREAKDOWN.map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="label-eyebrow">{b.label}</span>
                        <span className="font-mono text-xs font-medium text-indigo">{b.value}%</span>
                      </div>
                      <div className="h-1.5 bg-indigo/15 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo rounded-full" style={{ width: `${b.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="relative grid md:grid-cols-3 gap-8">

              {/* Pipeline connector — desktop only, renders behind cards via DOM order */}
              <div className="hidden md:block absolute inset-x-0 top-8 pointer-events-none">
                <div className="relative h-px bg-line mx-[16.67%]">
                  <span className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-line" />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-line" />
                  <span className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-line" />
                </div>
              </div>

              {ROLES.map((r, i) =>
                r.key === 'student' ? (
                  <Link
                    key={r.key}
                    href={r.href}
                    className="relative bg-indigo-deep rounded-lg p-6 hover:-translate-y-0.5 transition-all duration-150"
                  >
                    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/40 mb-3">
                      0{i + 1}
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2 text-paper">{r.title}</h3>
                    <p className="text-sm text-paper/65 leading-relaxed">{r.copy}</p>
                  </Link>
                ) : (
                  <Link
                    key={r.key}
                    href={r.href}
                    className="relative card p-6 block hover:border-indigo hover:-translate-y-0.5 transition-all duration-150"
                  >
                    <div className="label-eyebrow mb-3">0{i + 1}</div>
                    <h3 className="font-display text-xl font-semibold mb-2">{r.title}</h3>
                    <p className="text-sm text-ink/65 leading-relaxed">{r.copy}</p>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="label-eyebrow mb-2">How matching works</div>
              <p className="font-display text-2xl font-semibold max-w-md">
                Skill overlap 45% &middot; GPA 20% &middot; Preferences 15% &middot; Year 10% &middot; Certifications 10%
              </p>
            </div>
            <Link href="/login?mode=register" className="btn-primary shrink-0">
              See your match score
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-ink/40">
          NexSkill — CCS2360 Technology Challenge Competition prototype, SLTC Research University.
        </div>
      </footer>
    </div>
  );
}
