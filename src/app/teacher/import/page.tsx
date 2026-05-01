'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database, Filter, CheckCircle, Circle, ChevronRight,
  X, Save, Loader2, BarChart3, BookOpen, Zap,
} from 'lucide-react';

// ── 타입 ─────────────────────────────────────────────────────────────────
interface CsatItem {
  id: string;
  year: number;
  item_number: number;
  question_type: string | null;
  correct_answer: number | null;
  points: number;
  lexile_estimated: number | null;
  text_complexity_score: number | null;
  word_count: number | null;
  mapped_skill: string;
  mapped_irt_b: number;
  question_id: string | null;
  question_prompt?: string;
}
interface Stats { total: number; completed: number; pending: number; }
interface ApiData {
  items: CsatItem[];
  total: number;
  stats: Stats;
  years: { year: number }[];
  types: { question_type: string; cnt: number }[];
}

const SKILL_LABELS: Record<string, string> = {
  vocabulary: '어휘', inference: '추론', main_idea: '주제·요지',
  cohesion: '흐름·응집', structure: '구조',
};
const SKILL_COLORS: Record<string, string> = {
  vocabulary: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  inference:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  main_idea:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cohesion:   'bg-purple-500/20 text-purple-300 border-purple-500/30',
  structure:  'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

// ── 메인 페이지 ──────────────────────────────────────────────────────────
export default function CsatImportPage() {
  const [data, setData]           = useState<ApiData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [year, setYear]           = useState('');
  const [type, setType]           = useState('');
  const [status, setStatus]       = useState('all');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState<CsatItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [passageText,  setPassageText]  = useState('');
  const [questionStem, setQuestionStem] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [optE, setOptE] = useState('');
  const [explanation,  setExplanation]  = useState('');
  const [generatingExp, setGeneratingExp] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (year)   params.set('year',   year);
    if (type)   params.set('type',   type);
    if (status !== 'all') params.set('status', status);
    try {
      const res = await fetch(`/api/import/csat?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [year, type, status, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openItem = (item: CsatItem) => {
    setSelected(item);
    setPassageText(''); setQuestionStem('');
    setOptA(''); setOptB(''); setOptC(''); setOptD(''); setOptE('');
    setExplanation('');
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (!passageText || !questionStem || !optA || !optB || !optC || !optD || !optE) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/import/csat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csatId: selected.id,
          passageText,
          questionStem,
          options: { a: optA, b: optB, c: optC, d: optD, e: optE },
          explanation,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelected(null);
        fetchData();
      } else {
        alert(json.error ?? '오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateExplanation = async () => {
    if (!selected || !passageText || !questionStem || !optA || !optB || !optC || !optD || !optE) {
      alert('지문, 발문, 보기를 모두 입력한 후 생성할 수 있습니다.');
      return;
    }
    setGeneratingExp(true);
    try {
      const res = await fetch('/api/import/csat/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageText, questionStem,
          options: { a: optA, b: optB, c: optC, d: optD, e: optE },
          answer: selected.correct_answer
        })
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        setExplanation(data.explanation);
      } else {
        alert('해설 생성에 실패했습니다.');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setGeneratingExp(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            수능 기출 문항 Import
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            csat-graphdb 데이터베이스 기반 · 스킬 자동 태깅
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '전체 문항', value: data.stats.total, icon: BarChart3, color: 'text-blue-400' },
            { label: '등록 완료', value: data.stats.completed, icon: CheckCircle, color: 'text-emerald-400' },
            { label: '등록 대기', value: data.stats.pending, icon: Circle, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4 flex items-center gap-4">
              <Icon className={`w-8 h-8 ${color}`} />
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400" />

        <select
          value={year}
          onChange={(e) => { setYear(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">전체 연도</option>
          {data?.years.map(({ year: y }) => (
            <option key={y} value={y}>{y}학년도</option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">전체 유형</option>
          {data?.types.map(({ question_type: qt, cnt }) => (
            <option key={qt} value={qt}>{qt} ({cnt})</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">전체</option>
          <option value="pending">대기</option>
          <option value="completed">완료</option>
        </select>

        {(year || type || status !== 'all') && (
          <button
            onClick={() => { setYear(''); setType(''); setStatus('all'); setPage(1); }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" /> 초기화
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400">
          {loading ? '로딩 중...' : `총 ${data?.total ?? 0}건`}
        </span>
      </div>

      {/* 문항 목록 */}
      <div className="glass-card divide-y divide-slate-700/50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>문항이 없습니다.</p>
            <p className="text-xs mt-1">먼저 <code>npx tsx scripts/seed_csat.ts</code>를 실행하세요.</p>
          </div>
        ) : (
          data?.items.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.question_id && openItem(item)}
              className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors
                ${item.question_id
                  ? 'opacity-50 cursor-default'
                  : 'hover:bg-slate-700/30 cursor-pointer'}`}
            >
              {/* 완성 여부 */}
              {item.question_id
                ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                : <Circle className="w-5 h-5 text-slate-500 shrink-0" />}

              {/* 기본 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{item.year}학년도 {item.item_number}번</span>
                  <span className="text-xs text-slate-400">{item.question_type ?? '유형미상'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    item.points === 3 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600'
                  }`}>
                    {item.points}점
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {item.word_count && <span>📝 {item.word_count}단어</span>}
                  {item.lexile_estimated && <span>📊 Lexile {item.lexile_estimated}</span>}
                  {item.text_complexity_score && <span>⚡ 복잡도 {(item.text_complexity_score * 100).toFixed(0)}%</span>}
                </div>
              </div>

              {/* 스킬 태그 */}
              <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ${SKILL_COLORS[item.mapped_skill] ?? ''}`}>
                {SKILL_LABELS[item.mapped_skill] ?? item.mapped_skill}
              </span>

              {/* irt_b */}
              <span className="text-xs text-slate-500 font-mono w-12 text-right shrink-0">
                b={item.mapped_irt_b.toFixed(1)}
              </span>

              {!item.question_id && (
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm disabled:opacity-40 hover:bg-slate-700"
          >이전</button>
          <span className="text-sm text-slate-400">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm disabled:opacity-40 hover:bg-slate-700"
          >다음</button>
        </div>
      )}

      {/* 모달 — 문항 완성 입력 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-bold text-lg">
                  {selected.year}학년도 {selected.item_number}번 — {selected.question_type}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${SKILL_COLORS[selected.mapped_skill]}`}>
                    {SKILL_LABELS[selected.mapped_skill]} 스킬
                  </span>
                  <span className="text-xs text-slate-400">IRT b={selected.mapped_irt_b.toFixed(1)}</span>
                  {selected.lexile_estimated && <span className="text-xs text-slate-400">Lexile {selected.lexile_estimated}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                  지문 원문 *
                </label>
                <textarea
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  rows={6}
                  placeholder="수능 지문 원문을 붙여넣으세요..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  문항 발문 *
                </label>
                <input
                  value={questionStem}
                  onChange={(e) => setQuestionStem(e.target.value)}
                  placeholder="예: 밑줄 친 부분에 들어갈 말로 가장 적절한 것은?"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  보기 (정답: {selected.correct_answer}번) *
                </label>
                <div className="space-y-2">
                  {[
                    ['① ', optA, setOptA],
                    ['② ', optB, setOptB],
                    ['③ ', optC, setOptC],
                    ['④ ', optD, setOptD],
                    ['⑤ ', optE, setOptE],
                  ].map(([num, val, setter], idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`text-sm font-medium w-6 shrink-0 ${
                        (idx + 1) === selected.correct_answer ? 'text-emerald-400' : 'text-slate-500'
                      }`}>{num as string}</span>
                      <input
                        value={val as string}
                        onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                        placeholder={`보기 ${idx + 1}`}
                        className={`flex-1 bg-slate-800/80 border rounded-lg p-2 text-sm focus:outline-none ${
                          (idx + 1) === selected.correct_answer
                            ? 'border-emerald-500/50 focus:border-emerald-500'
                            : 'border-slate-700 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-slate-400 font-medium">
                    해설 (선택사항)
                  </label>
                  <button
                    onClick={handleGenerateExplanation}
                    disabled={generatingExp}
                    className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                  >
                    {generatingExp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    AI 해설 자동 생성
                  </button>
                </div>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={3}
                  placeholder="정답 해설을 입력하거나 비워두세요..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex gap-3 shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-sm hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> 등록 중...</>
                  : <><Save className="w-4 h-4" /> 문항 등록</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
