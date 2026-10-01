'use client';
import { useEffect, useState } from 'react';

export default function VerifyPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  function load() {
    fetch('/api/admin/analytics').then((r) => r.json()).then((d) => {
      setPending(d.pendingVerifications || []);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function decide(item, approve) {
    setActing(item.id);
    await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: item.type, id: item.id, approve }),
    });
    setActing(null);
    load();
  }

  if (loading) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="label-eyebrow mb-1">FR-ADM-01 · NFR-SEC-06</div>
        <h1 className="font-display text-3xl font-semibold">Verification Queue</h1>
      </div>

      {pending.length === 0 ? (
        <div className="card p-8 text-center text-ink/50 text-sm">Nothing pending — all accounts verified.</div>
      ) : (
        <div className="card divide-y divide-line">
          {pending.map((item) => (
            <div key={item.id} className="p-5 flex items-center justify-between">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs font-mono text-ink/40 uppercase">{item.type} account</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(item, true)} disabled={acting === item.id} className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50">Approve</button>
                <button onClick={() => decide(item, false)} disabled={acting === item.id} className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
