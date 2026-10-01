'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseBrowser';

function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | done | error
  const [error, setError] = useState('');

  useEffect(() => {
    // The Supabase client picks up the recovery token from the URL (set by
    // the reset-password email link) and establishes a session automatically.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
      if (!data.session) setError('This reset link is invalid or has expired. Request a new one.');
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('saving');
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setStatus('error');
      return;
    }
    setStatus('done');
    setTimeout(() => router.push('/login'), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display font-semibold text-lg tracking-tight">
          NexSkill
        </Link>
        <h1 className="font-display text-2xl font-semibold mt-8 mb-2">Set a new password</h1>

        {status === 'done' ? (
          <div className="card p-5 text-sm">
            <p className="font-medium">Password updated. Redirecting to sign in…</p>
          </div>
        ) : !ready && error ? (
          <div className="space-y-4">
            <div className="text-sm text-coral bg-coral/5 border border-coral/20 rounded px-3 py-2">{error}</div>
            <Link href="/forgot-password" className="btn-secondary text-sm py-2 px-4 inline-block">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-eyebrow block mb-2">New password</label>
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label-eyebrow block mb-2">Confirm password</label>
              <input type="password" className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            {error && <div className="text-sm text-coral bg-coral/5 border border-coral/20 rounded px-3 py-2">{error}</div>}
            <button type="submit" disabled={!ready || status === 'saving'} className="btn-primary w-full disabled:opacity-50">
              {status === 'saving' ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
