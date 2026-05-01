'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ChevronRight, Target, Loader2, BarChart3, Zap } from 'lucide-react';

const SKILL_KR: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름', structure: '구조',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classSkills, setClassSkills] = useState<any[]>([]);
  const [evidenceSummary, setEvidenceSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/students')
      .then(res => res.json())
      .then(data => {
        setStudents(data.students ?? []);
        setClassSkills(data.classSkills ?? []);
        setEvidenceSummary(data.evidenceSummary ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between fade-in">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" /> 학생 진단 현황
        </h1>
        <span className="text-sm text-slate-400">총 {students.length}명</span>
      </div>

      {/* 반 전체 스킬 평균 */}
      {classSkills.length > 0 && (
        <div className="glass-card p-6 fade-in fade-in-delay-1">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-300">
            <BarChart3 className="w-5 h-5" /> 반 전체 스킬 평균
          </h2>
          <div className="space-y-3">
            {classSkills.map((s: any) => {
              const pct = Math.round((s.avg_rate ?? 0) * 100);
              return (
                <div key={s.skill} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-20 shrink-0">{SKILL_KR[s.skill] || s.skill}</span>
                  <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-28 justify-end text-xs">
                    <span className="font-bold text-slate-300">{pct}%</span>
                    <span className="text-slate-500">({s.student_count}명)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LogicFlow Evidence 요약 */}
      {evidenceSummary.length > 0 && (
        <div className="glass-card p-6 fade-in fade-in-delay-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-300">
            <Zap className="w-5 h-5" /> LogicFlow 마이크로 과업 현황
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {evidenceSummary.map((e: any) => (
              <div key={e.task_type} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <div className="text-xs text-slate-400 mb-2">{e.task_type}</div>
                <div className="text-2xl font-bold gradient-text">{e.total}회</div>
                <div className="text-xs text-slate-500 mt-1">
                  정답률 {e.total > 0 ? Math.round((e.correct / e.total) * 100) : 0}% · 평균 {e.avg_score ?? 0}점
                </div>
                <div className="text-xs text-slate-500">평균 {e.avg_time_sec ?? 0}초</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학생 카드 목록 */}
      {students.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          가입된 학생이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in fade-in-delay-3">
          {students.map(s => {
            const rate = s.attempt_count > 0 ? Math.round((s.correct_count / s.attempt_count) * 100) : 0;
            return (
              <Link key={s.id} href={`/teacher/students/${s.id}`}>
                <div className="glass-card p-5 hover:-translate-y-1 hover:border-blue-500/30 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-200">{s.name}</h3>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t border-slate-700/50 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">풀이 / 정답률</span>
                      <span className="font-medium text-slate-300">
                        {s.attempt_count}문항 · <span className={rate >= 80 ? 'text-emerald-400' : rate >= 60 ? 'text-amber-400' : 'text-red-400'}>{rate}%</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">취약 스킬</span>
                      <span className="flex items-center gap-1 font-medium text-red-400">
                        {s.weakest_skill ? (
                          <><Target className="w-3.5 h-3.5" /> {SKILL_KR[s.weakest_skill] || s.weakest_skill}</>
                        ) : '데이터 부족'}
                      </span>
                    </div>
                    {/* 미니 정답률 바 */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
