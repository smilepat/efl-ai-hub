'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ChevronRight, Target, Loader2 } from 'lucide-react';

const SKILL_KR: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름', structure: '구조',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/students')
      .then(res => res.json())
      .then(data => {
        setStudents(data.students ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between fade-in">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" /> 학생 진단 현황
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : students.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          가입된 학생이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in fade-in-delay-1">
          {students.map(s => (
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
                    <span className="text-slate-400">풀이 문항 수</span>
                    <span className="font-medium text-slate-300">{s.attempt_count}개</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">취약 스킬</span>
                    <span className="flex items-center gap-1 font-medium text-red-400">
                      {s.weakest_skill ? (
                        <><Target className="w-3.5 h-3.5" /> {SKILL_KR[s.weakest_skill] || s.weakest_skill}</>
                      ) : '데이터 부족'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
