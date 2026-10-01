'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'ashan@sltc.ac.lk' },
  { role: 'Company', email: 'recruit@wso2.lk' },
  { role: 'University', email: 'partner@sltc.ac.lk' },
  { role: 'Admin', email: 'admin@nexskill.lk' },
];

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' || !!params.get('role') ? 'register' : 'login');
  const [role, setRole] = useState(() => {
    const r = params.get('role');
    return ['student', 'company', 'university'].includes(r) ? r : 'student';
  });
  const [form, setForm] = useState({ fullName: '', email: '', password: '', university: '', companyName: '', universityName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function fillDemo(email) {
    setMode('login');
    setForm((f) => ({ ...f, email, password: 'password123' }));
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { ...form, role };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      router.push(`/${data.user.role}/dashboard`);
      router.refresh();
    } catch (err) {
      setError('Could not reach the server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="font-display font-semibold text-lg tracking-tight">
            NexSkill
          </Link>

          <div className="flex gap-1 mt-8 mb-6 bg-white border border-line rounded p-1 w-fit">
            <button
              onClick={() => setMode('login')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'login' ? 'bg-ink text-paper' : 'text-ink/60'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('register')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'register' ? 'bg-ink text-paper' : 'text-ink/60'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label-eyebrow block mb-2">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {['student', 'company', 'university'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-2 rounded border text-sm font-medium capitalize transition-colors ${
                        role === r ? 'border-indigo bg-indigo-soft text-indigo-deep' : 'border-line text-ink/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="label-eyebrow block mb-2">
                  {role === 'company' ? 'Your name' : role === 'university' ? 'Contact name' : 'Full name'}
                </label>
                <input className="input-field" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
              </div>
            )}

            {mode === 'register' && role === 'student' && (
              <div>
                <label className="label-eyebrow block mb-2">University</label>
                <input className="input-field" value={form.university} onChange={(e) => update('university', e.target.value)} placeholder="e.g. SLTC Research University" required />
              </div>
            )}

            {mode === 'register' && role === 'company' && (
              <div>
                <label className="label-eyebrow block mb-2">Company name</label>
                <input className="input-field" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} required />
              </div>
            )}

            {mode === 'register' && role === 'university' && (
              <div>
                <label className="label-eyebrow block mb-2">University name</label>
                <input className="input-field" value={form.universityName} onChange={(e) => update('universityName', e.target.value)} required />
              </div>
            )}

            <div>
              <label className="label-eyebrow block mb-2">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-eyebrow">Password</label>
                {mode === 'login' && (
                  <Link href="/forgot-password" className="text-xs text-indigo hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <input type="password" className="input-field" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
            </div>

            {error && <div className="text-sm text-coral bg-coral/5 border border-coral/20 rounded px-3 py-2">{error}</div>}

            {mode === 'register' && role !== 'student' && (
              <p className="text-xs text-ink/45">
                {role === 'company' ? 'Company' : 'University'} accounts require admin verification before posting or viewing analytics.
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-ink text-paper flex-col justify-between p-12">
        <div className="label-eyebrow text-paper/50">Demo accounts &middot; password123</div>
        <div className="space-y-3">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              onClick={() => fillDemo(a.email)}
              className="w-full text-left px-4 py-3 rounded border border-paper/15 hover:border-signal hover:bg-paper/5 transition-colors group"
            >
              <div className="text-xs font-mono text-paper/40 uppercase tracking-wide">{a.role}</div>
              <div className="font-medium group-hover:text-signal transition-colors">{a.email}</div>
            </button>
          ))}
        </div>
        <p className="text-sm text-paper/40 max-w-sm">
          Click any account to autofill the sign-in form — every seeded account shares the same password.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
