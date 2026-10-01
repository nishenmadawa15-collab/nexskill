import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import Shell from '@/components/Shell';

const NAV = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/profile', label: 'My Profile' },
  { href: '/student/cv-upload', label: 'Upload CV' },
  { href: '/student/internships', label: 'Matched Internships' },
  { href: '/student/applications', label: 'My Applications' },
  { href: '/student/offers', label: 'Offer Letters' },
];

export default async function StudentLayout({ children }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  return (
    <Shell role="student" fullName={user.full_name} roleLabel="Student Portal" navItems={NAV}>
      {children}
    </Shell>
  );
}
