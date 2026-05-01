import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import {
  FileText,
  Brain,
  HelpCircle,
  Users,
  TrendingUp,
  Plus,
  ChevronRight,
  BookOpen,
  Target,
} from 'lucide-react';

async function getStats() {
  const db = getDb();
  const passages  = ((await db.execute({ sql: 'SELECT COUNT(*) as c FROM passages', args: [] })).rows[0] as unknown as { c: number }).c;
  const questions = ((await db.execute({ sql: 'SELECT COUNT(*) as c FROM questions', args: [] })).rows[0] as unknown as { c: number }).c;
  const students  = ((await db.execute({ sql: 'SELECT COUNT(*) as c FROM users WHERE role = ?', args: ['student'] })).rows[0] as unknown as { c: number }).c;
  const attempts  = ((await db.execute({ sql: 'SELECT COUNT(*) as c FROM student_attempts', args: [] })).rows[0] as unknown as { c: number }).c;
  return { passages, questions, students, attempts };
}

const STAT_CARDS = (s: Awaited<ReturnType<typeof getStats>>) => [
  { label: '등록 지문',    value: s.passages,  icon: FileText,    color: 'from-blue-500 to-cyan-500',    href: '/teacher/passage' },
  { label: '생성 문항',    value: s.questions, icon: HelpCircle,  color: 'from-purple-500 to-pink-500',  href: '/teacher/questions' },
  { label: '등록 학생',    value: s.students,  icon: Users,       color: 'from-amber-500 to-orange-500', href: '/teacher/students' },
  { label: '총 풀이 수',   value: s.attempts,  icon: TrendingUp,  color: 'from-emerald-500 to-teal-500', href: '/teacher/students' },
];

const QUICK_ACTIONS = [
  { href: '/teacher/passage/new',        icon: Plus,      label: '지문 분석 시작',    desc: '새 지문을 입력하고 AI 분석 실행' },
  { href: '/teacher/questions/generate', icon: Brain,     label: 'AI 문항 생성',      desc: '분석된 지문으로 문항 자동 생성' },
  { href: '/teacher/students',           icon: Target,    label: '학생 진단 보기',    desc: '오답 패턴 및 약점 스킬 분석' },
  { href: '/teacher/passage',            icon: BookOpen,  label: '지문 라이브러리',   desc: '저장된 모든 지문 조회 및 관리' },
];

export default async function TeacherDashboard() {
  const session = await auth();
  const stats = await getStats();
  const statCards = STAT_CARDS(stats);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-3xl font-extrabold">
          안녕하세요, <span className="gradient-text">{session?.user?.name ?? '선생님'}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          오늘도 AI와 함께 효율적인 수업을 준비하세요.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in fade-in-delay-1">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <div className="glass-card p-5 hover:border-slate-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold">{value.toLocaleString()}</div>
              <div className="text-sm text-slate-400 mt-0.5">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="fade-in fade-in-delay-2">
        <h2 className="text-lg font-bold mb-4">빠른 실행</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}>
              <div className="glass-card p-5 flex items-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-200 group cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-slate-700/60 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors shrink-0">
                  <Icon className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm group-hover:text-blue-300 transition-colors">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Vocab DB Status */}
      <div className="fade-in fade-in-delay-3">
        <div className="glass-card p-6 border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base mb-1">어휘 DB 현황</h3>
              <p className="text-slate-400 text-sm mb-4">
                기존 vocabulary-db에서 가져온 9,183개 단어와 39,842개 IRT 문항이 탑재 준비 중입니다.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'A1–A2', desc: '3,898 단어' },
                  { label: 'B1',    desc: '2,734 단어' },
                  { label: 'B2',    desc: '2,505 단어' },
                  { label: 'C1',    desc: '46 단어' },
                ].map(({ label, desc }) => (
                  <div key={label} className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                    <span className="font-bold text-blue-400">{label}</span>
                    <span className="text-slate-400 ml-1.5">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/teacher/passage/new"
              className="btn-glow px-4 py-2 text-xs relative z-10 shrink-0"
            >
              시작하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
