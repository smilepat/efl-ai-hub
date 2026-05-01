'use client';

import { useState, useEffect } from 'react';
import { Target, Zap, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { RecommendResult } from '@/lib/agents/recommendAgent';

const SKILL_KR: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름', structure: '구조',
};

export default function StudentReviewPage() {
  const [rec, setRec] = useState<RecommendResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = () => {
    setLoading(true);
    fetch('/api/recommend')
      .then(res => res.json())
      .then(data => {
        if (data.recommendation) {
          setRec(data.recommendation);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const generateNewRec = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/recommend', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.recommendation) {
        setRec(data.recommendation);
      } else {
        alert(data.error || '추천 생성 실패');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-purple-100">
          <Zap className="w-6 h-6 text-yellow-400" /> AI 맞춤 복습
        </h1>
        <button
          onClick={generateNewRec}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-xl transition-colors border border-purple-500/30 disabled:opacity-50 text-sm"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          최신 분석 업데이트
        </button>
      </div>

      {!rec ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-300 mb-2">아직 분석된 데이터가 부족해요!</h2>
          <p className="text-slate-400 text-sm mb-6">퀴즈를 더 풀어서 진단 데이터를 쌓아주세요.</p>
          <button onClick={generateNewRec} disabled={generating} className="btn-glow px-6 py-2">
            AI 분석 다시 시도
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-300">
              <Sparkles className="w-5 h-5 text-yellow-400" /> AI 선생님의 조언
            </h2>
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
              {rec.study_tip}
            </p>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-base font-bold mb-4 text-slate-300">집중 보완 스킬</h2>
              <div className="flex flex-wrap gap-2">
                {rec.weak_skills?.map(sk => (
                  <span key={sk} className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> {SKILL_KR[sk] || sk}
                  </span>
                ))}
                {(!rec.weak_skills || rec.weak_skills.length === 0) && (
                  <span className="text-slate-500 text-sm">취약 스킬이 없습니다. 훌륭해요!</span>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-base font-bold mb-4 text-slate-300">추천 복습 문항 유형</h2>
              <div className="flex flex-wrap gap-2">
                {rec.recommended_question_types?.map(t => (
                  <span key={t} className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {rec.recommended_task_id && (
              <div className="glass-card p-6 border-indigo-500/30 bg-indigo-500/10">
                <h2 className="text-base font-bold mb-3 text-indigo-300 flex items-center gap-2">
                  <Target className="w-5 h-5" /> 추천 마이크로 과업
                </h2>
                <p className="text-sm text-slate-300 mb-4">{rec.recommended_task_desc}</p>
                <button
                  onClick={() => window.location.href = `/student/task-test?taskId=${rec.recommended_task_id}`}
                  className="btn-glow w-full py-2.5 text-sm"
                >
                  과업 시작하기 (Task {rec.recommended_task_id.replace('Q_TASK_CSAT_', '')})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
