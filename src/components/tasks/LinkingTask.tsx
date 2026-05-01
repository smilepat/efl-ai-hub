'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface LinkingTaskData {
  type: string;
  sentence: string;
  pronoun: string;           // 예: "they", "it", "this"
  pronoun_index: number;     // 문장 내 단어 인덱스
  referent: string;          // 정답: 가리키는 대상
  referent_indices: number[];// 정답 단어 인덱스들
  explanation: string;
}

interface LinkingTaskProps {
  taskData: LinkingTaskData;
  onComplete?: (isCorrect: boolean) => void;
}

export default function LinkingTask({ taskData, onComplete }: LinkingTaskProps) {
  const words = taskData.sentence.split(' ');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  const toggleWord = (index: number) => {
    if (isSubmitted) return;
    // 대명사 자체는 선택 불가
    if (index === taskData.pronoun_index) return;
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const checkAnswer = async () => {
    setIsSubmitted(true);
    const correctSet = new Set(taskData.referent_indices);
    let isCorrect = selectedIndices.size === correctSet.size;
    for (const idx of selectedIndices) {
      if (!correctSet.has(idx)) isCorrect = false;
    }

    // Evidence 전송
    try {
      await fetch('/api/student/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: (taskData as any).questionId ?? null,
          taskType: 'linking',
          isCorrect,
          attemptCount: 1,
          timeMs: Date.now() - startTime,
          clickLog: Array.from(selectedIndices),
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
    setSelectedIndices(new Set());
  };

  const correctSet = new Set(taskData.referent_indices);

  return (
    <div className="glass-card p-6 fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-emerald-400">🔗 Linking Task (지시어 연결)</h3>
        <span className="text-xs px-2 py-1 bg-slate-800 rounded-lg text-slate-400 border border-slate-700">
          AI 추천 마이크로 과업
        </span>
      </div>

      <p className="text-sm text-slate-300 mb-2">
        아래 문장에서 <span className="text-emerald-400 font-bold">&quot;{taskData.pronoun}&quot;</span>이(가)
        가리키는 대상(단어)을 클릭하세요.
      </p>
      <p className="text-xs text-slate-500 mb-6">
        💡 여러 단어로 된 구(phrase)의 경우, 해당 단어들을 모두 클릭하세요.
      </p>

      {/* 문장 렌더링 */}
      <div className="flex flex-wrap gap-y-3 gap-x-1 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 mb-6 text-lg">
        {words.map((word, i) => {
          const isPronoun = i === taskData.pronoun_index;
          const isSelected = selectedIndices.has(i);
          const isCorrectWord = correctSet.has(i);

          let classes = 'px-1.5 py-0.5 rounded cursor-pointer transition-all select-none ';
          if (isPronoun) {
            classes += 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold cursor-default';
          } else if (isSubmitted) {
            if (isSelected && isCorrectWord) classes += 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50';
            else if (isSelected && !isCorrectWord) classes += 'bg-red-500/30 text-red-300 border border-red-500/50';
            else if (!isSelected && isCorrectWord) classes += 'bg-amber-500/20 text-amber-300 border border-amber-500/40 border-dashed';
            else classes += 'text-slate-300';
          } else if (isSelected) {
            classes += 'bg-blue-500/30 text-blue-200 border border-blue-500/50';
          } else {
            classes += 'text-slate-200 hover:bg-blue-500/10';
          }

          return (
            <span
              key={i}
              className={classes}
              onClick={() => toggleWord(i)}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* 결과 */}
      {isSubmitted && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700 fade-in">
          <div className="flex items-start gap-3">
            {(() => {
              let isCorrect = selectedIndices.size === correctSet.size;
              for (const idx of selectedIndices) {
                if (!correctSet.has(idx)) isCorrect = false;
              }
              return isCorrect
                ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                : <XCircle className="w-6 h-6 text-amber-400 shrink-0" />;
            })()}
            <div>
              <h4 className="font-bold mb-1">
                {selectedIndices.size === correctSet.size && Array.from(selectedIndices).every(i => correctSet.has(i))
                  ? <span className="text-emerald-400">정확합니다!</span>
                  : <span className="text-amber-400">정답: &quot;{taskData.referent}&quot;</span>}
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
