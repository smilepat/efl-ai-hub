'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface ChunkingTaskData {
  type: string;
  sentence: string;
  chunks: string[];
  explanation: string;
}

interface ChunkingTaskProps {
  taskData: ChunkingTaskData;
  onComplete?: (isCorrect: boolean) => void;
}

export default function ChunkingTask({ taskData, onComplete }: ChunkingTaskProps) {
  // 문장을 단어 단위로 쪼개기 (띄어쓰기 기준)
  const words = taskData.sentence.split(' ');

  // 정답 경계 계산 (각 단어 인덱스 기준으로 정답 경계 위치 확인)
  const correctBoundaries = new Set<number>();
  let currentLength = 0;
  let wordIdx = 0;
  
  for (let i = 0; i < taskData.chunks.length - 1; i++) {
    const chunkTargetLength = currentLength + taskData.chunks[i].length;
    // 이 청크의 끝에 해당하는 단어 인덱스 찾기
    let tempLen = currentLength;
    while (wordIdx < words.length) {
      tempLen += words[wordIdx].length + 1; // +1 for space
      if (tempLen >= chunkTargetLength - 1) { // -1 for trailing space tolerance
        correctBoundaries.add(wordIdx);
        currentLength = tempLen;
        wordIdx++;
        break;
      }
      wordIdx++;
    }
  }

  const [selectedBoundaries, setSelectedBoundaries] = useState<Set<number>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [clickLog, setClickLog] = useState<Array<{ wordIndex: number; timestamp: number }>>([]);
  const [attemptCount, setAttemptCount] = useState(1);
  const [startTime] = useState(Date.now());

  const toggleBoundary = (index: number) => {
    if (isSubmitted) return;
    const newSet = new Set(selectedBoundaries);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedBoundaries(newSet);
    // 클릭 로그 기록
    setClickLog(prev => [...prev, { wordIndex: index, timestamp: Date.now() - startTime }]);
  };

  const checkAnswer = async () => {
    setIsSubmitted(true);
    let isCorrect = selectedBoundaries.size === correctBoundaries.size;
    for (let b of selectedBoundaries) {
      if (!correctBoundaries.has(b)) isCorrect = false;
    }

    // 정확도 점수 계산 (0~1)
    const totalBoundaries = correctBoundaries.size;
    let matchCount = 0;
    for (let b of selectedBoundaries) {
      if (correctBoundaries.has(b)) matchCount++;
    }
    const score = totalBoundaries > 0 ? matchCount / totalBoundaries : 0;
    const timeMs = Date.now() - startTime;

    // Evidence API로 행동 데이터 전송
    try {
      await fetch('/api/student/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: (taskData as any).questionId ?? null,
          taskType: 'chunking',
          isCorrect,
          attemptCount,
          timeMs,
          clickLog,
          score,
        }),
      });
    } catch (e) {
      // 실패해도 UI는 정상 동작
      console.warn('Evidence 전송 실패:', e);
    }

    if (onComplete) onComplete(isCorrect);
  };

  const reset = () => {
    setIsSubmitted(false);
    setSelectedBoundaries(new Set());
    setAttemptCount(prev => prev + 1);
    setClickLog([]);
  };

  return (
    <div className="glass-card p-6 fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-blue-400">📝 Chunking Task (절 끊어 읽기)</h3>
        <span className="text-xs px-2 py-1 bg-slate-800 rounded-lg text-slate-400 border border-slate-700">
          AI 추천 마이크로 과업
        </span>
      </div>
      
      <p className="text-sm text-slate-300 mb-6">
        문맥에 맞게 의미 단위(절, 구 등)가 나뉘는 경계 부분을 클릭하여 슬래시(<span className="text-blue-400 font-bold">/</span>)를 그어보세요.
      </p>

      {/* 인터랙티브 문장 영역 */}
      <div className="flex flex-wrap gap-y-3 gap-x-1 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 mb-6 text-lg">
        {words.map((word, i) => {
          const hasBoundary = selectedBoundaries.has(i);
          const isCorrectBoundary = correctBoundaries.has(i);
          const isLast = i === words.length - 1;
          
          let boundaryColor = 'text-blue-400';
          if (isSubmitted) {
            if (hasBoundary && isCorrectBoundary) boundaryColor = 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]';
            else if (hasBoundary && !isCorrectBoundary) boundaryColor = 'text-red-400';
            else if (!hasBoundary && isCorrectBoundary) boundaryColor = 'text-amber-400 border-b-2 border-amber-400/50 border-dashed'; // 놓친 곳
          }

          return (
            <div key={i} className="flex items-center group">
              <span className="text-slate-200 select-none">{word}</span>
              {!isLast && (
                <div 
                  className={`w-4 h-full flex items-center justify-center cursor-pointer mx-1 
                    ${isSubmitted ? 'pointer-events-none' : 'hover:bg-blue-500/20'} rounded transition-colors
                  `}
                  onClick={() => toggleBoundary(i)}
                >
                  {hasBoundary ? (
                    <span className={`font-black ${boundaryColor}`}>/</span>
                  ) : (
                    <span className={`font-bold opacity-0 ${isSubmitted && isCorrectBoundary ? 'opacity-100 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'group-hover:opacity-30 text-blue-400'}`}>
                      /
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 결과 피드백 영역 */}
      {isSubmitted && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700 fade-in">
          <div className="flex items-start gap-3">
            {(() => {
              let isCorrect = selectedBoundaries.size === correctBoundaries.size;
              for (let b of selectedBoundaries) {
                if (!correctBoundaries.has(b)) isCorrect = false;
              }
              return isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-amber-400 shrink-0" />
              );
            })()}
            <div>
              <h4 className="font-bold mb-1">
                {selectedBoundaries.size === correctBoundaries.size && Array.from(selectedBoundaries).every(b => correctBoundaries.has(b))
                  ? <span className="text-emerald-400">정확하게 끊어 읽었습니다!</span>
                  : <span className="text-amber-400">틀린 부분이 있거나 놓친 경계가 있습니다.</span>}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed mt-2">{taskData.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* 컨트롤 버튼 */}
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
