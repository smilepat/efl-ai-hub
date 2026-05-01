import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import StudentNav from '@/components/student/StudentNav';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user?.role !== 'student') redirect('/login');

  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-2xl mx-auto px-4 pt-6">{children}</main>
      <StudentNav />
    </div>
  );
}
