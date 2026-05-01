'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Brain, CheckCircle2, XCircle, Clock,
  ChevronRight, Trophy, RotateCcw, ArrowRight,
  Loader2, Target, Zap, AlertCircle,
} from 'lucide-react';
import ChunkingTask from '@/components/tasks/ChunkingTask';

// ── 타입 ──────────────────────────────────────────────────────
interface PassageInfo {
  id: string; title: string; topic: string;
  level: string; word_count: number; q_count: number;
}

interface Question {
  id: string; type: string; prompt: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  answer: string; explanation: string; skill: string;
  irt_b: number; passage_title: string; passage_text: string;
}

interface AttemptResult {
  isCorrect: boolean;
  correctAnswer: string;
}

// ── 상수 ──────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  vocab: '어휘', blank: '빈칸', main_idea: '주제·요지',
  order: '글의 순서', insert: '문장 삽입',
};
const SKILL_KR: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름', structure: '구조',
};
const LEVEL_COLOR: Record<string, string> = {
  A2: 'text-teal-400', B1: 'text-blue-400',
  B2: 'text-purple-400', C1: 'text-pink-400',
};
const TIMER_SEC = 60; // 문항당 제한 시간

// ── 옵션 버튼 ──────────────────────────────────────────────────
function OptionButton({
  label, text, selected, result, disabled, onClick,
}: {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  selected: boolean;
  result: 'correct' | 'wrong' | 'reveal' | null;
  disabled: boolean;
  onClick: () => void;
}) {
  const base = 'w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-start gap-4 group';
  let style = 'border-slate-700 bg-slate-800/40 hover:border-blue-500/50 hover:bg-blue-500/5';

  if (result === 'correct') style = 'border-emerald-500 bg-emerald-500/15 text-emerald-200';
  else if (result === 'wrong') style = 'border-red-500 bg-red-500/15 text-red-300';
  else if (result === 'reveal') style = 'border-emerald-500/50 bg-emerald-500/8 text-emerald-300';
  else if (selected) style = 'border-blue-500 bg-blue-500/15 text-blue-200';

  return (
    <button className={`${base} ${style}`} onClick={onClick} disabled={disabled}>
      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
        result === 'correct' ? 'border-emerald-400 bg-emerald-500/30 text-emerald-200' :
        result === 'wrong'   ? 'border-red-400 bg-red-500/30 text-red-300' :
        result === 'reveal'  ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300' :
        selected             ? 'border-blue-400 bg-blue-500/30 text-blue-200' :
        'border-slate-600 group-hover:border-blue-400 text-slate-400'
      }`}>{label}</span>
      <span className="text-sm leading-relaxed">{text}</span>
    </button>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function StudentQuizPage() {
  // 단계: list → ready → quiz → answered → done
  const [step, setStep] = useState<'list' | 'ready' | 'quiz' | 'answered' | 'done'>('list');
  const [passages, setPassages] = useState<PassageInfo[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(TIMER_SEC);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [skillMap, setSkillMap] = useState<Record<string, { correct: number; total: number }>>({});
  const [chosenPassage, setChosenPassage] = useState<PassageInfo | null>(null);
  const [showPassage, setShowPassage] = useState(false);
  const startTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [startingQuiz, setStartingQuiz] = useState(false);

  // 지문 목록 로드
  useEffect(() => {
    fetch('/api/student/questions')
      .then(r => r.json())
      .then(d => { setPassages(d.passages ?? []); setLoadingList(false); })
      .catch(() => setLoadingList(false));
  }, []);

  // 타이머
  useEffect(() => {
    if (step !== 'quiz') { if (timerRef.current) clearInterval(timerRef.current); return; }
    setTimer(TIMER_SEC);
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { handleTimeUp(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentIdx]);

  const handleTimeUp = useCallback(() => {
    if (selected || step !== 'quiz') return;
    handleSubmit(null); // 시간 초과 처리
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, step]);

  // 퀴즈 시작 (지문 문항 로드)
  async function startQuiz(passage: PassageInfo) {
    if (startingQuiz) return;
    setStartingQuiz(true);
    setChosenPassage(passage);
    setStep('ready');
    try {
      const res = await fetch(`/api/student/quiz?passageId=${passage.id}`);
      const data = await res.json();
      const qs: Question[] = (data.questions ?? []).map((q: Question & { options: string }) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));
      setQuestions(qs);
      setCurrentIdx(0);
      setScore({ correct: 0, total: 0 });
      setSkillMap({});
      setSelected(null);
      setResult(null);
      setStep('quiz');
    } finally {
      setStartingQuiz(false);
    }
  }

  // 답 제출
  async function handleSubmit(sel: 'A' | 'B' | 'C' | 'D' | null) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (submitting) return;
    setSubmitting(true);

    const q = questions[currentIdx];
    const timeSec = Math.round((Date.now() - startTime.current) / 1000);
    const chosen = sel ?? 'X'; // 시간초과는 X

    setSelected(sel);

    const res = await fetch('/api/student/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, selected: chosen, timeSec }),
    });
    const data = await res.json();

    setResult(data);
    setScore(prev => ({
      correct: prev.correct + (data.isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setSkillMap(prev => {
      const sk = q.skill ?? 'unknown';
      const cur = prev[sk] ?? { correct: 0, total: 0 };
      return { ...prev, [sk]: { correct: cur.correct + (data.isCorrect ? 1 : 0), total: cur.total + 1 } };
    });

    setSubmitting(false);
    setStep('answered');
  }

  // 다음 문제
  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setStep('done');
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setResult(null);
      setStep('quiz');
    }
  }

  const q = questions[currentIdx];
  const progressPct = questions.length > 0 ? ((currentIdx + (step === 'done' ? 1 : 0)) / questions.length) * 100 : 0;
  const finalRate = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // ── RENDER ──────────────────────────────────────────────────

  /* 지문 선택 목록 */
  if (step === 'list') {
    return (
      <div className="pt-4 space-y-5">
        <div className="fade-in">
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" /> 문제 풀기
          </h1>
          <p className="text-slate-400 text-sm mt-1">풀 지문을 선택하세요</p>
        </div>

        {loadingList ? (
          <div className="glass-card p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">문항 목록 불러오는 중...</p>
          </div>
        ) : passages.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">아직 배정된 문항이 없습니다.</p>
            <p className="text-slate-500 text-xs mt-1">선생님이 문항을 생성하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-3 fade-in fade-in-delay-1">
            <div className="p-3 mb-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2">
              <Zap className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <p className="text-xs text-purple-300">
                AI가 학생의 실력(IRT Theta)을 분석하여 가장 도전적이고 성장에 도움되는 지문들을 추천합니다.
              </p>
            </div>
            {passages.map((p: any) => (
              <button
                key={p.id}
                id={`quiz-start-${p.id}`}
                onClick={() => startQuiz(p)}
                disabled={startingQuiz}
                className="w-full glass-card p-5 flex items-center gap-4 hover:border-purple-500/40 hover:-translate-y-0.5 transition-all duration-200 group text-left disabled:opacity-60"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:border-purple-500/50 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-full blur-md" />
                  {startingQuiz && chosenPassage?.id === p.id
                    ? <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    : <Target className="w-5 h-5 text-purple-400" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{p.title}</span>
                    <span className={`text-xs font-bold ${LEVEL_COLOR[p.level] ?? 'text-slate-400'}`}>{p.level}</span>
                    {p.avg_irt_b !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        난이도 {(p.avg_irt_b).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{p.topic || '기출 미분류'} · {p.word_count || 0}단어 · 문항 {p.q_count}개</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-400 font-medium shrink-0">
                  시작 <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* 완료 화면 */
  if (step === 'done') {
    const grade = finalRate >= 80 ? '🏆 우수' : finalRate >= 60 ? '👍 보통' : '📚 복습 필요';
    return (
      <div className="pt-4 space-y-5 fade-in">
        <div className="glass-card p-8 text-center border-purple-500/20">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-1">퀴즈 완료!</h2>
          <p className="text-slate-400 text-sm mb-6">{chosenPassage?.title}</p>

          {/* 점수 */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none"
                stroke={finalRate >= 80 ? '#10b981' : finalRate >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2.51 * finalRate} 251`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold gradient-text">{finalRate}%</span>
              <span className="text-xs text-slate-400">{score.correct}/{score.total}</span>
            </div>
          </div>
          <p className="text-lg font-bold mb-6">{grade}</p>

          {/* 스킬별 결과 */}
          {Object.keys(skillMap).length > 0 && (
            <div className="space-y-2 mb-6 text-left">
              <p className="text-xs text-slate-500 font-medium mb-3">스킬별 정답률</p>
              {Object.entries(skillMap).map(([skill, stat]) => {
                const rate = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div key={skill} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20 shrink-0">{SKILL_KR[skill] ?? skill}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right">{rate}%</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('list'); setChosenPassage(null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 glass-card hover:border-slate-500 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> 다른 지문
            </button>
            <button
              onClick={() => startQuiz(chosenPassage!)}
              className="flex-1 btn-glow py-3 text-sm relative z-10 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> 다시 풀기
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 퀴즈 / 정답 화면 */
  if (!q) return null;

  return (
    <div className="pt-4 space-y-4">
      {/* 상단 진행 바 */}
      <div className="fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">{chosenPassage?.title}</span>
          <span className="text-xs font-bold text-slate-300">{currentIdx + 1} / {questions.length}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 타이머 + 유형 */}
      <div className="flex items-center justify-between fade-in">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium">
            {TYPE_LABELS[q.type] ?? q.type}
          </span>
          {q.skill && (
            <span className="text-xs text-slate-500">#{SKILL_KR[q.skill] ?? q.skill}</span>
          )}
        </div>
        {step === 'quiz' && (
          <div className={`flex items-center gap-1.5 text-sm font-bold ${timer <= 10 ? 'text-red-400' : 'text-slate-300'}`}>
            <Clock className={`w-4 h-4 ${timer <= 10 ? 'animate-pulse' : ''}`} />
            {timer}s
          </div>
        )}
      </div>

      {/* 지문 토글 */}
      <button
        onClick={() => setShowPassage(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        {showPassage ? '지문 접기' : '지문 보기'}
      </button>
      {showPassage && (
        <div className="glass-card p-4 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto fade-in">
          {q.passage_text}
        </div>
      )}

      {/* 문항 */}
      <div className="glass-card p-5 fade-in">
        <p className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">{q.prompt}</p>
      </div>

      {/* 보기 또는 마이크로 과업 렌더링 (Component Registry Pattern) */}
      {q.type === 'logicflow_chunking' ? (
        <div className="mt-4">
          <ChunkingTask 
            taskData={q.options as unknown as any} 
            onComplete={(isCorrect) => {
              if (step !== 'answered') {
                // 더미 라벨 'A' 또는 'X' 전송 (마이크로 태스크 전용 로깅을 추후 추가 가능)
                handleSubmit(isCorrect ? 'A' : 'B');
              }
            }} 
          />
          {step === 'answered' && (
            <button
              onClick={nextQuestion}
              className="btn-glow w-full mt-4 py-3 text-sm relative z-10 flex items-center justify-center gap-2"
            >
              {currentIdx + 1 >= questions.length ? (
                <><Trophy className="w-4 h-4" /> 결과 보기</>
              ) : (
                <>다음 문제 <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 fade-in mt-4">
          {(['A', 'B', 'C', 'D'] as const).map(label => {
            let btnResult: 'correct' | 'wrong' | 'reveal' | null = null;
            if (step === 'answered' && result) {
              if (label === result.correctAnswer) btnResult = 'correct';
              else if (label === selected && !result.isCorrect) btnResult = 'wrong';
              else if (label === selected && result.isCorrect) btnResult = 'correct';
            }
            return (
              <OptionButton
                key={label}
                label={label}
                text={(q.options as any)[label] ?? ''}
                selected={selected === label}
                result={btnResult}
                disabled={step === 'answered' || submitting}
                onClick={() => { setSelected(label); handleSubmit(label); }}
              />
            );
          })}
        </div>
      )}

      {/* 일반 문항 정답 해설 */}
      {step === 'answered' && result && q.type !== 'logicflow_chunking' && (
        <div className={`glass-card p-5 fade-in border ${result.isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'} mt-4`}>
          <div className="flex items-center gap-2 mb-3">
            {result.isCorrect
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              : <XCircle className="w-5 h-5 text-red-400" />}
            <span className={`font-bold text-sm ${result.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.isCorrect ? '정답입니다! 🎉' : `오답입니다. 정답: ${result.correctAnswer}`}
            </span>
          </div>
          {q.explanation ? (
            <p className="text-sm text-slate-300 leading-relaxed">{q.explanation}</p>
          ) : (
            <p className="text-sm text-slate-500">해설이 없는 문항입니다.</p>
          )}
          <button
            onClick={nextQuestion}
            className="btn-glow w-full mt-4 py-3 text-sm relative z-10 flex items-center justify-center gap-2"
          >
            {currentIdx + 1 >= questions.length ? (
              <><Trophy className="w-4 h-4" /> 결과 보기</>
            ) : (
              <>다음 문제 <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {/* 제출 중 */}
      {submitting && (
        <div className="flex items-center justify-center gap-2 py-3 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          채점 중...
        </div>
      )}

      {/* 시간 초과 안내 */}
      {step === 'quiz' && timer === 0 && !submitting && (
        <div className="glass-card p-4 border-amber-500/30 flex items-center gap-2 text-amber-400 text-sm fade-in">
          <Zap className="w-4 h-4" />
          시간이 초과되었습니다.
        </div>
      )}

      {/* 하단 점수 */}
      <div className="flex items-center justify-center gap-4 py-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span>{score.correct}정답</span>
        </div>
        <span>·</span>
        <span>{score.total - score.correct}오답</span>
        <span>·</span>
        <span className="text-slate-400 font-medium">{score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%</span>
      </div>
    </div>
  );
}
