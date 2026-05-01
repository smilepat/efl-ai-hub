'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Target, AlertCircle, BookOpen, Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

const SKILL_KR: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름', structure: '구조',
};

const SKILL_AXES = ['vocabulary', 'inference', 'main_idea', 'cohesion', 'structure'];

export default function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teacher/students/${resolvedParams.id}/report`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="glass-card p-12 text-center text-slate-400">
        데이터를 불러오지 못했습니다.
      </div>
    );
  }

  const { student, skills: skillData, recentAttempts } = data;

  // Radar Chart coordinates
  const radius = 80;
  const cx = 100;
  const cy = 100;
  
  const getPoint = (val: number, angle: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: cx + (val / 100) * radius * Math.cos(rad),
      y: cy + (val / 100) * radius * Math.sin(rad)
    };
  };

  const getPointsStr = () => {
    return SKILL_AXES.map((key, i) => {
      const val = (skillData.find((s:any) => s.skill === key)?.correct_rate ?? 0) * 100;
      const pt = getPoint(val, i * 72);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  };

  return (
    <div className="space-y-6 pt-4 fade-in">
      <Link href="/teacher/students" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 학생 목록으로
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-100">
            {student.name} 학생의 진단 리포트
          </h1>
          <p className="text-sm text-slate-400 mt-1">{student.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="glass-card p-6 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-4">스킬 밸런스</h2>
          <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible">
            {/* Background polygons */}
            {[20, 40, 60, 80, 100].map(level => (
              <polygon
                key={level}
                points={SKILL_AXES.map((_, i) => {
                  const pt = getPoint(level, i * 72);
                  return `${pt.x},${pt.y}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            ))}
            
            {/* Axes */}
            {SKILL_AXES.map((key, i) => {
              const pt = getPoint(100, i * 72);
              const labelPt = getPoint(125, i * 72);
              return (
                <g key={key}>
                  <line x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <text 
                    x={labelPt.x} y={labelPt.y} 
                    fill="rgba(255,255,255,0.6)" 
                    fontSize="10" 
                    textAnchor="middle" 
                    alignmentBaseline="middle"
                  >
                    {SKILL_KR[key] || key}
                  </text>
                </g>
              );
            })}

            {/* Data Polygon */}
            {skillData.length > 0 && (
              <polygon
                points={getPointsStr()}
                fill="rgba(59, 130, 246, 0.4)"
                stroke="rgba(59, 130, 246, 0.8)"
                strokeWidth="2"
              />
            )}
            
            {/* Data Points */}
            {skillData.length > 0 && SKILL_AXES.map((key, i) => {
              const val = (skillData.find((s:any) => s.skill === key)?.correct_rate ?? 0) * 100;
              const pt = getPoint(val, i * 72);
              return <circle key={key} cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />;
            })}
          </svg>
        </div>

        {/* Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">스킬별 상세 데이터</h2>
          <div className="space-y-4">
            {SKILL_AXES.map(key => {
              const stat = skillData.find((s:any) => s.skill === key);
              const rate = stat ? Math.round(stat.correct_rate * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-20 shrink-0">{SKILL_KR[key] || key}</span>
                  <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 w-20 text-xs">
                    <span className="font-bold text-slate-300">{rate}%</span>
                    <span className="text-slate-500">({stat?.correct || 0}/{stat?.total || 0})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Attempts */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" /> 최근 풀이 이력
        </h2>
        {recentAttempts && recentAttempts.length > 0 ? (
          <div className="space-y-4">
            {recentAttempts.map((a: any) => {
              let opts = typeof a.options === 'string' ? JSON.parse(a.options) : a.options;
              const isCorrect = !!a.is_correct;
              return (
                <div key={a.id} className={`p-4 bg-slate-800/30 rounded-lg border ${isCorrect ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCorrect ? '정답' : '오답'}
                    </span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                      {SKILL_KR[a.skill] || a.skill}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {new Date(a.attempted_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mb-3">{a.prompt}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 font-bold shrink-0">선택한 답:</span>
                      <span className={isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                        {a.selected}) {opts[a.selected] ?? '미선택'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">정답:</span>
                        <span className="text-slate-300">{a.answer}) {opts[a.answer]}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            풀이 이력이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
