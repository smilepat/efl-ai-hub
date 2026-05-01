'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, HelpCircle, RotateCcw } from 'lucide-react';

const NAV = [
  { href: '/student/dashboard', icon: Home,        label: '홈' },
  { href: '/student/passage',   icon: BookOpen,    label: '오늘의 지문' },
  { href: '/student/quiz',      icon: HelpCircle,  label: '문제 풀기' },
  { href: '/student/review',    icon: RotateCcw,   label: '복습' },
];

export default function StudentNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 glass-card rounded-none border-x-0 border-b-0 px-2 py-2 safe-area-bottom">
      <div className="flex justify-around max-w-2xl mx-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                active
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
