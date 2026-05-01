'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface HighlightTaskData {
  type: string;
  passage: string;
  question: string;          // 예: "이 글의 주제문(Topic Sentence)을 찾으세요."
  correct_indices: number[]; // 정답 문장 인덱스들
  explanation: string;
}

interface HighlightTaskProps {
  taskData: HighlightTaskData;
  onComplete?: (isCorrect: boolean) => void;
}

export default function HighlightTask({ taskData, onComplete }: HighlightTaskProps) {
  // 문장 단위로 분할
  const sentences = taskData.passage.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) ?? [taskData.passage];
  const [selectedSentences, setSelectedSentences] = useState<Set<number>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  const toggleSentence = (index: number) => {
    if (isSubmitted) return;
    const newSet = new Set(selectedSentences);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedSentences(newSet);
  };

  const checkAnswer = async () => {
    setIsSubmitted(true);
    const correctSet = new Set(taskData.correct_indices);
    let isCorrect = selectedSentences.size === correctSet.size;
    for (const idx of selectedSentences) {
      if (!correctSet.has(idx)) isCorrect = false;
    }

    // Evidence 전송
    try {
      await fetch('/api/student/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: (taskData as any).questionId ?? null,
          taskType: 'highlight',
          isCorrect,
          attemptCount: 1,
          timeMs: Date.now() - startTime,
          clickLog: Array.from(selectedSentences),
          score: isCorrect ? 1.0 : 0.0,
        }),
      });
    } catch (e) {
      console.warn('Evidence 전송 실패:', e);
    }

    if (onComplete) onComplete(isCorrect);
  };

  const reset = () => {
    setIsSubmitted(false);
    setSelectedSentences(new Set());
  };

  const correctSet = new Set(taskData.correct_indices);

  return (
    <div className="glass-card p-6 fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-amber-400">🖍️ Highlight Task (핵심 문장 찾기)</h3>
        <span className="text-xs px-2 py-1 bg-slate-800 rounded-lg text-slate-400 border border-slate-700">
          AI 추천 마이크로 과업
        </span>
      </div>

      <p className="text-sm text-slate-300 mb-6">{taskData.question}</p>

      {/* 문장 렌더링 */}
      <div className="space-y-2 mb-6">
        {sentences.map((sentence, i) => {
          const isSelected = selectedSentences.has(i);
          const isCorrectSentence = correctSet.has(i);

          let classes = 'p-3 rounded-xl border cursor-pointer transition-all duration-200 text-sm leading-relaxed ';
          if (isSubmitted) {
            if (isSelected && isCorrectSentence) {
              classes += 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.15)]';
            } else if (isSelected && !isCorrectSentence) {
              classes += 'bg-red-500/15 border-red-500/50 text-red-300';
            } else if (!isSelected && isCorrectSentence) {
              classes += 'bg-amber-500/10 border-amber-500/40 border-dashed text-amber-300';
            } else {
              classes += 'bg-slate-800/30 border-slate-700/50 text-slate-400';
            }
          } else if (isSelected) {
            classes += 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.1)]';
          } else {
            classes += 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:border-amber-500/30 hover:bg-amber-500/5';
          }

          return (
            <div
              key={i}
              className={classes}
              onClick={() => toggleSentence(i)}
            >
              <span className="text-xs text-slate-500 mr-2">[{i + 1}]</span>
              {sentence}
            </div>
          );
        })}
      </div>

      {/* 결과 */}
      {isSubmitted && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700 fade-in">
          <div className="flex items-start gap-3">
            {(() => {
              let isCorrect = selectedSentences.size === correctSet.size;
              for (const idx of selectedSentences) {
                if (!correctSet.has(idx)) isCorrect = false;
              }
              return isCorrect
                ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                : <XCircle className="w-6 h-6 text-amber-400 shrink-0" />;
            })()}
            <div>
              <h4 className="font-bold mb-1">
                {selectedSentences.size === correctSet.size && Array.from(selectedSentences).every(i => correctSet.has(i))
                  ? <span className="text-emerald-400">정확하게 찾았습니다!</span>
                  : <span className="text-amber-400">핵심 문장을 놓치거나 잘못 선택했습니다.</span>}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed mt-2">{taskData.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* 컨트롤 */}
      <div className="flex justify-end gap-3">
        {isSubmitted ? (
          <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-semibold">
            <RotateCcw className="w-4 h-4" /> 다시 해보기
          </button>
        ) : (
          <button onClick={checkAnswer} className="btn-glow px-8 py-2.5 text-sm font-bold relative z-10">
            정답 확인
          </button>
        )}
      </div>
    </div>
  );
}
