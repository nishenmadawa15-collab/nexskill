import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import Shell from '@/components/Shell';

const NAV = [
  { href: '/company/dashboard', label: 'Dashboard' },
  { href: '/company/post-internship', label: 'Post Internship' },
  { href: '/company/postings', label: 'My Postings' },
];

export default async function CompanyLayout({ children }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'company') redirect('/login');

  return (
    <Shell role="company" fullName={user.full_name} roleLabel="Company Portal" navItems={NAV}>
      {children}
    </Shell>
  );
}
