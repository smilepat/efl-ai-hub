'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen, AlertCircle, CheckCircle2, XCircle, Loader2,
  ChevronDown, ChevronUp, Target, Zap, ArrowRight,
} from 'lucide-react';

const SKILL_KR: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름', structure: '구조',
};

export default function WrongNotesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/student/wrong-notes')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
      </div>
    );
  }

  const wrongNotes = data?.wrongNotes ?? [];
  const skillBreakdown = data?.skillBreakdown ?? [];
  const relatedTasks = data?.relatedTasks ?? [];

  return (
    <div className="space-y-6 pt-4 pb-20 fade-in">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-400" /> 오답 노트
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          틀린 문항을 해설과 함께 복습하세요. 총 {wrongNotes.length}개
        </p>
      </div>

      {/* 스킬별 오답 분포 */}
      {skillBreakdown.length > 0 && (
        <div className="glass-card p-5 fade-in fade-in-delay-1">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-300">
            <Target className="w-4 h-4 text-red-400" /> 스킬별 오답 분포
          </h2>
          <div className="flex flex-wrap gap-2">
            {skillBreakdown.map((s: any) => (
              <span
                key={s.skill}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-sm font-medium"
              >
                {SKILL_KR[s.skill] || s.skill} · {s.wrong_count}회
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 관련 Task 추천 */}
      {relatedTasks.length > 0 && (
        <div className="glass-card p-5 border-indigo-500/30 bg-indigo-500/5 fade-in fade-in-delay-2">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2 text-indigo-300">
            <Zap className="w-4 h-4" /> 약점 보완 마이크로 과업
          </h2>
          <div className="space-y-2">
            {relatedTasks.map((t: any) => (
              <Link
                key={t.id}
                href={`/student/task-test?taskId=${t.id}`}
                className="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-colors group"
              >
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{t.type.replace('logicflow_', '')}</span>
                <span className="text-sm text-slate-300 flex-1 truncate">{t.prompt}</span>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 오답 문항 목록 */}
      {wrongNotes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-emerald-300 mb-2">오답이 없습니다!</h2>
          <p className="text-slate-400 text-sm">모든 문항을 맞혔어요. 훌륭합니다!</p>
        </div>
      ) : (
        <div className="space-y-3 fade-in fade-in-delay-3">
          {wrongNotes.map((w: any) => {
            const isExpanded = expandedId === w.attempt_id;
            let opts: Record<string, string> = {};
            try {
              opts = typeof w.options === 'string' ? JSON.parse(w.options) : (w.options ?? {});
            } catch { /* ignore */ }

            return (
              <div
                key={w.attempt_id}
                className="glass-card overflow-hidden transition-all duration-300"
              >
                {/* 헤더 (클릭으로 토글) */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : w.attempt_id)}
                  className="w-full p-5 flex items-start gap-3 text-left hover:bg-slate-800/30 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">{w.prompt}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {SKILL_KR[w.skill] || w.skill}
                      </span>
                      {w.passage_title && (
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">
                          📄 {w.passage_title}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto shrink-0">
                        {new Date(w.attempted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                  }
                </button>

                {/* 상세 (확장) */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 fade-in border-t border-slate-700/50 pt-4">
                    {/* 보기 비교 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(['A', 'B', 'C', 'D'] as const).map(label => {
                        if (!opts[label]) return null;
                        const isCorrectAnswer = label === w.answer;
                        const isMyAnswer = label === w.selected;
                        let border = 'border-slate-700/50';
                        let bg = 'bg-slate-800/30';
                        if (isCorrectAnswer) { border = 'border-emerald-500/50'; bg = 'bg-emerald-500/10'; }
                        else if (isMyAnswer) { border = 'border-red-500/50'; bg = 'bg-red-500/10'; }

                        return (
                          <div key={label} className={`p-3 rounded-xl border ${border} ${bg} flex items-start gap-2`}>
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrectAnswer ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' :
                              isMyAnswer ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                              'bg-slate-700 text-slate-400 border border-slate-600'
                            }`}>{label}</span>
                            <span className={`text-sm leading-relaxed ${
                              isCorrectAnswer ? 'text-emerald-200' :
                              isMyAnswer ? 'text-red-300' :
                              'text-slate-400'
                            }`}>{opts[label]}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI 해설 */}
                    {w.explanation ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <h4 className="font-bold text-sm text-amber-300 mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" /> AI 해설
                        </h4>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{w.explanation}</p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center text-sm text-slate-500">
                        해설이 아직 준비되지 않았습니다.
                      </div>
                    )}

                    {/* 지문 보기 */}
                    {w.passage_text && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> 관련 지문 보기
                        </summary>
                        <div className="mt-2 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                          {w.passage_text}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
