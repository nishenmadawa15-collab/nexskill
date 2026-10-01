'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Shell({ role, fullName, roleLabel, navItems, children }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setNavOpen(false); }, [pathname]);

  useEffect(() => {
    let active = true;
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      });
    return () => { active = false; };
  }, [pathname]);

  async function markRead(id) {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' });
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, readStatus: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen md:flex">
      {navOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-30 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-line bg-white flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-6 border-b border-line flex items-center justify-between">
          <div>
            <Link href="/" className="font-display font-semibold text-lg tracking-tight">
              NexSkill
            </Link>
            <div className="label-eyebrow mt-1">{roleLabel}</div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded hover:bg-paper text-ink/60"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  active ? 'bg-indigo-soft text-indigo-deep' : 'text-ink/70 hover:bg-paper hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-line">
          <div className="text-sm font-medium truncate">{fullName}</div>
          <button onClick={logout} className="text-xs text-ink/50 hover:text-coral mt-1">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-line bg-white flex items-center justify-between md:justify-end px-6 relative">
          <button
            onClick={() => setNavOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded hover:bg-paper text-ink/70"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded hover:bg-paper"
            aria-label="Notifications"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute top-14 right-6 w-80 max-h-96 overflow-y-auto bg-white border border-line rounded-lg shadow-lg z-20">
              <div className="px-4 py-3 border-b border-line label-eyebrow">Notifications</div>
              {notifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-ink/50">Nothing yet.</div>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-line last:border-0 text-sm hover:bg-paper ${
                    n.readStatus ? 'text-ink/50' : 'text-ink font-medium'
                  }`}
                >
                  {n.message}
                  <div className="text-[11px] font-mono text-ink/40 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </header>
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
