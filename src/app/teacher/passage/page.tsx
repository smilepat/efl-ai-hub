import { getDb } from '@/lib/db';
import Link from 'next/link';
import { Plus, FileText, BookOpen, ChevronRight, Clock } from 'lucide-react';

const CEFR_COLOR: Record<string, string> = {
  A2: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  B1: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  B2: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  C1: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

async function getPassages() {
  const db = getDb();
  return (await db.execute({ sql:
    'SELECT p.*, (SELECT COUNT(*) FROM questions q WHERE q.passage_id = p.id) as q_count FROM passages p ORDER BY p.created_at DESC', args: []
  })).rows as unknown as Array<{
    id: string; title: string; topic: string; level: string;
    word_count: number; source: string; created_at: string; q_count: number;
  }>;
}

export default async function PassageListPage() {
  const passages = await getPassages();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between fade-in">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-blue-400" />
            지문 라이브러리
          </h1>
          <p className="text-slate-400 text-sm mt-1">저장된 지문 {passages.length}개</p>
        </div>
        <Link href="/teacher/passage/new" className="btn-glow px-5 py-2.5 text-sm relative z-10 flex items-center gap-2">
          <Plus className="w-4 h-4" /> 새 지문 분석
        </Link>
      </div>

      {passages.length === 0 ? (
        <div className="glass-card p-16 text-center fade-in">
          <FileText className="w-14 h-14 mx-auto mb-4 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-400 mb-2">저장된 지문이 없습니다</h2>
          <p className="text-slate-500 text-sm mb-6">첫 번째 지문을 분석해보세요!</p>
          <Link href="/teacher/passage/new" className="btn-glow px-6 py-3 text-sm relative z-10 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> 지문 분석 시작
          </Link>
        </div>
      ) : (
        <div className="space-y-3 fade-in fade-in-delay-1">
          {passages.map(p => (
            <Link key={p.id} href={`/teacher/passage/${p.id}`}>
              <div className="glass-card p-5 flex items-center gap-4 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:border-blue-500/50 transition-colors">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{p.title}</h3>
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-medium shrink-0 ${CEFR_COLOR[p.level] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                      {p.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="text-slate-400">{p.topic}</span>
                    <span>·</span>
                    <span>{p.word_count ?? 0}단어</span>
                    <span>·</span>
                    <span>문항 {p.q_count}개</span>
                    {p.source && <><span>·</span><span>{p.source}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {new Date(p.created_at).toLocaleDateString('ko-KR')}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
