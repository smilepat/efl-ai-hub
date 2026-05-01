'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Brain,
  LayoutDashboard,
  FileText,
  HelpCircle,
  Users,
  LogOut,
  ChevronRight,
  Download,
} from 'lucide-react';

const NAV = [
  { href: '/teacher/dashboard',  icon: LayoutDashboard, label: '대시보드' },
  { href: '/teacher/passage',    icon: FileText,         label: '지문 관리' },
  { href: '/teacher/questions',  icon: HelpCircle,       label: '문항 관리' },
  { href: '/teacher/students',   icon: Users,            label: '학생 현황' },
  { href: '/teacher/import',     icon: Download,         label: '수능 문항 Import' },
];

interface Props {
  user: { name?: string | null; email?: string | null; role?: string };
}

export default function TeacherSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 glass-card rounded-none border-y-0 border-l-0 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">EFL Mini AI Hub</div>
            <div className="text-xs text-blue-400 font-medium">교사 모드</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {user.name?.[0] ?? 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.name ?? '교사'}</div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
