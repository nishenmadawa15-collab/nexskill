'use client';
import { useEffect, useState } from 'react';

const ROLE_STYLE = {
  student: 'bg-indigo-soft text-indigo-deep',
  company: 'bg-amber/15 text-amber',
  university: 'bg-signal/20 text-ink',
  admin: 'bg-coral/10 text-coral',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState(null);

  function load() {
    fetch('/api/admin/users').then((r) => r.json()).then((d) => setUsers(d.users || []));
  }

  useEffect(load, []);

  async function toggleSuspend(u) {
    setActing(u.id);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, suspended: !u.suspended }),
    });
    setActing(null);
    load();
  }

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);

  return (
    <div className="space-y-6">
      <div>
        <div className="label-eyebrow mb-1">FR-ADM-02</div>
        <h1 className="font-display text-3xl font-semibold">All Users</h1>
      </div>

      <div className="flex gap-2">
        {['all', 'student', 'company', 'university', 'admin'].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-colors ${filter === r ? 'bg-ink text-paper' : 'bg-white border border-line text-ink/60'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-line">
        {filtered.map((u) => (
          <div key={u.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-sm">{u.fullName}</div>
              <div className="text-sm text-ink/50">{u.email}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {u.suspended && (
                <span className="text-xs font-medium px-2.5 py-1 rounded bg-coral/10 text-coral">Suspended</span>
              )}
              <span className={`text-xs font-medium px-2.5 py-1 rounded capitalize ${ROLE_STYLE[u.role]}`}>{u.role}</span>
              {u.role !== 'admin' && (
                <button
                  onClick={() => toggleSuspend(u)}
                  disabled={acting === u.id}
                  className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50"
                >
                  {u.suspended ? 'Unsuspend' : 'Suspend'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
