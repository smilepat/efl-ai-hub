import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import { Brain, HelpCircle, RotateCcw, TrendingUp, Target, Zap, AlertCircle, BarChart3 } from 'lucide-react';

const SKILL_KR: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름', structure: '구조',
};

async function getStudentData(studentId: string) {
  const db = getDb();
  const total   = ((await db.execute({ sql: 'SELECT COUNT(*) as c FROM student_attempts WHERE student_id = ?', args: [studentId] })).rows[0] as unknown as { c: number }).c;
  const correct = ((await db.execute({ sql: 'SELECT COUNT(*) as c FROM student_attempts WHERE student_id = ? AND is_correct = 1', args: [studentId] })).rows[0] as unknown as { c: number }).c;
  const rate    = total > 0 ? Math.round((correct / total) * 100) : 0;
  const skills  = (await db.execute({ sql:
    'SELECT skill, correct_rate, total, correct FROM skill_diagnostics WHERE student_id = ? ORDER BY correct_rate ASC', args: [studentId]
  })).rows as unknown as Array<{ skill: string; correct_rate: number; total: number; correct: number }>;
  return { total, correct, rate, skills };
}

export default async function StudentDashboard() {
  const session = await auth();
  const { total, correct, rate, skills } = await getStudentData(session?.user?.id ?? '');

  const weakestSkill = skills[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="fade-in pt-4">
        <p className="text-slate-400 text-sm">오늘의 학습</p>
        <h1 className="text-2xl font-extrabold mt-1">
          안녕하세요, <span className="gradient-text">{session?.user?.name ?? '학생'}</span> 🎓
        </h1>
      </div>

      {/* 점수 카드 */}
      <div className="glass-card p-6 fade-in fade-in-delay-1">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-sm">나의 학습 현황</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          {[
            { label: '풀이 수', value: total },
            { label: '정답 수', value: correct },
            { label: '정답률', value: `${rate}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-2xl font-bold gradient-text">{value}</div>
              <div className="text-xs text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
        {/* 진행 바 */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* 스킬 진단 (풀이 기록 있을 때만) */}
      {skills.length > 0 && (
        <div className="glass-card p-5 fade-in fade-in-delay-2">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-sm">스킬별 정답률</span>
          </div>
          <div className="space-y-3">
            {skills.map(s => {
              const pct = Math.round((s.correct_rate ?? 0) * 100);
              return (
                <div key={s.skill} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-16 shrink-0">{SKILL_KR[s.skill] ?? s.skill}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
          {weakestSkill && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300">
                <span className="font-bold">{SKILL_KR[weakestSkill.skill] ?? weakestSkill.skill}</span> 스킬이 가장 약합니다.
                복습 과제를 확인해보세요.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 메뉴 카드 */}
      <div className="space-y-3 fade-in fade-in-delay-3">
        {[
          {
            href: '/student/quiz',
            icon: HelpCircle,
            color: 'from-purple-500 to-pink-500',
            title: '문제 풀기',
            desc: '배정된 문항을 풀고 실력을 확인하세요',
          },
          {
            href: '/student/review',
            icon: RotateCcw,
            color: 'from-amber-500 to-orange-500',
            title: '복습 과제',
            desc: 'AI가 추천한 복습 어휘와 문항',
          },
          {
            href: '/student/wrong-notes',
            icon: AlertCircle,
            color: 'from-red-500 to-rose-500',
            title: '오답 노트',
            desc: 'AI 해설과 함께 틀린 문항을 복습하세요',
          },
          {
            href: '/student/report',
            icon: BarChart3,
            color: 'from-indigo-500 to-violet-500',
            title: '진단 리포트',
            desc: '나의 스킬별 강점과 약점을 확인하세요',
          },
          {
            href: '/student/passage',
            icon: Brain,
            color: 'from-blue-500 to-cyan-500',
            title: '오늘의 지문',
            desc: '교사가 배정한 지문을 읽어보세요',
          },
        ].map(({ href, icon: Icon, color, title, desc }) => (
          <Link key={href} href={href}>
            <div className="glass-card p-5 flex items-center gap-4 hover:border-slate-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm">{title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
