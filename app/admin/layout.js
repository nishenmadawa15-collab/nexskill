import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import Shell from '@/components/Shell';

const NAV = [
  { href: '/admin/dashboard', label: 'Platform Analytics' },
  { href: '/admin/verify', label: 'Verification Queue' },
  { href: '/admin/moderate', label: 'Moderate Listings' },
  { href: '/admin/users', label: 'Users' },
];

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login');

  return (
    <Shell role="admin" fullName={user.full_name} roleLabel="Admin Panel" navItems={NAV}>
      {children}
    </Shell>
  );
}
