import { getDb } from '@/lib/db';
import Link from 'next/link';
import { HelpCircle, Plus, Brain, CheckCircle2 } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  vocab: '어휘', blank: '빈칸', main_idea: '주제·요지', order: '글의 순서', insert: '문장 삽입',
};
const TYPE_COLOR: Record<string, string> = {
  vocab: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  blank: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  main_idea: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  order: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  insert: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};
const SKILL_COLOR: Record<string, string> = {
  vocabulary: 'text-blue-400', inference: 'text-amber-400',
  main_idea: 'text-purple-400', cohesion: 'text-teal-400', structure: 'text-pink-400',
};

async function getQuestions() {
  const db = getDb();
  return (await db.execute({ sql: `
    SELECT q.*, p.title as passage_title, p.level as passage_level
    FROM questions q
    LEFT JOIN passages p ON q.passage_id = p.id
    ORDER BY q.rowid DESC LIMIT 100
  `, args: [] })).rows as unknown as Array<{
    id: string; type: string; prompt: string; answer: string;
    skill: string; irt_b: number; created_by: string;
    passage_title: string; passage_level: string;
  }>;
}

export default async function QuestionsPage() {
  const questions = await getQuestions();

  const typeCounts = questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between fade-in">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-purple-400" />
            문항 관리
          </h1>
          <p className="text-slate-400 text-sm mt-1">총 {questions.length}개 문항</p>
        </div>
        <Link href="/teacher/passage/new" className="btn-glow px-5 py-2.5 text-sm relative z-10 flex items-center gap-2">
          <Plus className="w-4 h-4" /> 새 문항 생성
        </Link>
      </div>

      {/* 유형별 통계 */}
      {questions.length > 0 && (
        <div className="flex flex-wrap gap-3 fade-in fade-in-delay-1">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${TYPE_COLOR[type] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
              <span>{TYPE_LABELS[type] ?? type}</span>
              <span className="opacity-70">{count}개</span>
            </div>
          ))}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="glass-card p-16 text-center fade-in">
          <Brain className="w-14 h-14 mx-auto mb-4 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-400 mb-2">생성된 문항이 없습니다</h2>
          <p className="text-slate-500 text-sm mb-6">지문을 분석하고 AI 문항 생성을 실행해보세요!</p>
          <Link href="/teacher/passage/new" className="btn-glow px-6 py-3 text-sm relative z-10 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> 지문 분석 시작
          </Link>
        </div>
      ) : (
        <div className="space-y-3 fade-in fade-in-delay-2">
          {questions.map((q, i) => (
            <div key={q.id} className="glass-card p-5 hover:border-slate-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${TYPE_COLOR[q.type] ?? ''}`}>
                      {TYPE_LABELS[q.type] ?? q.type}
                    </span>
                    {q.skill && (
                      <span className={`text-xs font-medium ${SKILL_COLOR[q.skill] ?? 'text-slate-400'}`}>
                        #{q.skill}
                      </span>
                    )}
                    {q.passage_title && (
                      <span className="text-xs text-slate-500 truncate">
                        📄 {q.passage_title}
                      </span>
                    )}
                    {q.created_by === 'ai' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <Brain className="w-3 h-3" /> AI 생성
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">{q.prompt}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>정답: <span className="text-emerald-400 font-bold">{q.answer}</span></span>
                    {q.irt_b != null && (
                      <><span>·</span><span>난이도 b={q.irt_b.toFixed(1)}</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
