import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import Shell from '@/components/Shell';

const NAV = [
  { href: '/university/dashboard', label: 'Placement Analytics' },
];

export default async function UniversityLayout({ children }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'university') redirect('/login');

  return (
    <Shell role="university" fullName={user.full_name} roleLabel="University Partner" navItems={NAV}>
      {children}
    </Shell>
  );
}
