import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user?.role !== 'teacher') redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden">
      <TeacherSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
