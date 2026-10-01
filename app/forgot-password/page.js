'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseBrowser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError(err.message);
      setStatus('error');
      return;
    }
    setStatus('sent');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display font-semibold text-lg tracking-tight">
          NexSkill
        </Link>

        <h1 className="font-display text-2xl font-semibold mt-8 mb-2">Reset your password</h1>
        <p className="text-sm text-ink/60 mb-6">
          Enter the email on your account and we&rsquo;ll send a link to reset your password.
        </p>

        {status === 'sent' ? (
          <div className="card p-5 text-sm">
            <p className="font-medium mb-1">Check your email</p>
            <p className="text-ink/60">
              If an account exists for <span className="font-medium text-ink">{email}</span>, a reset link is on its way.
            </p>
            <Link href="/login" className="btn-secondary text-sm py-2 px-4 mt-4 inline-block">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-eyebrow block mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-coral bg-coral/5 border border-coral/20 rounded px-3 py-2">{error}</div>}
            <button type="submit" disabled={status === 'sending'} className="btn-primary w-full disabled:opacity-50">
              {status === 'sending' ? 'Sending…' : 'Send reset link'}
            </button>
            <Link href="/login" className="block text-center text-sm text-ink/50 hover:text-ink">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
