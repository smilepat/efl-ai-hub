'use client';

import { useEffect, useState, Suspense } from 'react';
import ChunkingTask from '@/components/tasks/ChunkingTask';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function TaskTestContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  
  const [taskData, setTaskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    // 간단하게 API 호출 (미구현 시 더미 데이터 fallback 가능)
    fetch(`/api/student/tasks?taskId=${taskId}`)
      .then(res => res.json())
      .then(data => {
        if (data.task) setTaskData(JSON.parse(data.task.options));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6 pt-4 pb-20">
      <div className="fade-in">
        <Link href="/student/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </Link>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          🧪 LogicFlow Task PoC 
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {taskId ? `학습 과업 [${taskId}]` : 'AI가 생성한 인터랙티브 학습 과업 (Chunking) 미리보기입니다.'}
        </p>
      </div>

      {taskData ? (
        <ChunkingTask taskData={taskData} />
      ) : (
        <div className="p-10 text-center text-slate-400">
          올바른 Task ID가 없거나 로드에 실패했습니다.
        </div>
      )}
      
      <div className="glass-card p-5 mt-8 border-purple-500/30 bg-purple-500/5">
        <h3 className="font-bold text-purple-300 mb-2">💡 향후 확장 로드맵</h3>
        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
          <li>학생이 취약한 &quot;하위 스킬(Micro-Skill)&quot;을 발견하면 이런 마이크로 태스크를 먼저 풀게 합니다.</li>
          <li>태스크 결과(클릭 위치, 시간 등)를 <code>learner_evidence</code>에 기록하여 마스터리를 올립니다.</li>
          <li>Chunking 외에도 대명사 찾기(Linking), 순서 맞추기 등 다양한 플러그인 컴포넌트를 추가할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}

export default function TaskTestPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <TaskTestContent />
    </Suspense>
  );
}
