'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Sparkles, BookOpen, Tag, BarChart2,
  AlertTriangle, Link2, ChevronDown, ChevronUp,
  Save, Brain, ArrowRight, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import type { PassageAnalysis, KeyVocab, Connective } from '@/lib/agents/analyzeAgent';

// ── 상수 ──────────────────────────────────────────────────────
const CEFR_COLOR: Record<string, string> = {
  A1: 'bg-green-500/20 text-green-300 border-green-500/30',
  A2: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  B1: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  B2: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  C1: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   'bg-emerald-500/15 text-emerald-300',
  medium: 'bg-amber-500/15 text-amber-300',
  hard:   'bg-red-500/15 text-red-300',
};

const CONNECTIVE_COLOR: Record<string, string> = {
  contrast: 'bg-red-500/20 text-red-300',
  addition: 'bg-blue-500/20 text-blue-300',
  cause:    'bg-amber-500/20 text-amber-300',
  result:   'bg-purple-500/20 text-purple-300',
  sequence: 'bg-teal-500/20 text-teal-300',
  example:  'bg-emerald-500/20 text-emerald-300',
  other:    'bg-slate-500/20 text-slate-300',
};

const TYPE_LABELS: Record<string, string> = {
  vocab: '어휘', blank: '빈칸', main_idea: '주제·요지',
  order: '글의 순서', insert: '문장 삽입',
};

// ── 헬퍼 ──────────────────────────────────────────────────────
function generatePassageId() {
  const d = new Date();
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `P_${ts}_${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function NewPassagePage() {
  const router = useRouter();

  // 단계: input → analyzing → analyzed → saving → generating → done
  const [step, setStep]           = useState<'input'|'analyzing'|'analyzed'|'saving'|'generating'|'done'>('input');
  const [text, setText]           = useState('');
  const [title, setTitle]         = useState('');
  const [source, setSource]       = useState('');
  const [analysis, setAnalysis]   = useState<PassageAnalysis | null>(null);
  const [passageId, setPassageId] = useState('');
  const [error, setError]         = useState('');
  const [showSentences, setShowSentences] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['vocab','blank','main_idea','order','insert']);
  const [savedQCount, setSavedQCount] = useState(0);

  // ── STEP 1: 지문 분석 ────────────────────────────────────────
  async function handleAnalyze() {
    if (text.trim().split(/\s+/).length < 30) {
      setError('지문이 너무 짧습니다. 30단어 이상 입력해주세요.');
      return;
    }
    setError('');
    setStep('analyzing');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      if (!title) setTitle(data.analysis.topic.charAt(0).toUpperCase() + data.analysis.topic.slice(1));
      setStep('analyzed');
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 오류 발생');
      setStep('input');
    }
  }

  // ── STEP 2: 지문 저장 ────────────────────────────────────────
  async function handleSave() {
    if (!analysis) return;
    setStep('saving');
    const pid = generatePassageId();
    try {
      const res = await fetch('/api/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pid, title: title || analysis.topic,
          text, topic: analysis.topic,
          level: analysis.level, word_count: analysis.word_count, source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassageId(pid);
      setStep('analyzed'); // 저장 후 다시 analyzed 상태로 (문항 생성 가능)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류 발생');
      setStep('analyzed');
    }
  }

  // ── STEP 3: 문항 생성 ────────────────────────────────────────
  async function handleGenerate() {
    if (!analysis) return;
    setStep('generating');
    try {
      const pid = passageId || generatePassageId();

      // 지문이 아직 저장 안된 경우 자동 저장
      if (!passageId) {
        await fetch('/api/passages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: pid, title: title || analysis.topic,
            text, topic: analysis.topic,
            level: analysis.level, word_count: analysis.word_count, source,
          }),
        });
        setPassageId(pid);
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageId: pid, passageText: text,
          analysis, types: selectedTypes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedQCount(data.questions.length);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '문항 생성 중 오류 발생');
      setStep('analyzed');
    }
  }

  // ── 문항 유형 토글 ───────────────────────────────────────────
  function toggleType(type: string) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-2xl font-extrabold flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-400" />
          지문 분석 <span className="gradient-text">+ AI 문항 생성</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">영어 지문을 붙여넣으면 AI가 분석하고 수능 스타일 문항을 자동 생성합니다.</p>
      </div>

      {/* ── DONE 상태 ── */}
      {step === 'done' && (
        <div className="glass-card p-8 text-center fade-in border-emerald-500/30">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">완료!</h2>
          <p className="text-slate-400 mb-6">
            {savedQCount}개 문항이 생성되어 저장되었습니다.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/teacher/questions')}
              className="btn-glow px-6 py-3 text-sm relative z-10 flex items-center gap-2"
            >
              <Brain className="w-4 h-4" /> 문항 목록 보기
            </button>
            <button
              onClick={() => { setStep('input'); setAnalysis(null); setText(''); setTitle(''); }}
              className="px-6 py-3 text-sm glass-card hover:border-slate-500 transition-colors"
            >
              새 지문 분석
            </button>
          </div>
        </div>
      )}

      {step !== 'done' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── 왼쪽: 지문 입력 ── */}
          <div className="space-y-4 fade-in">
            <div className="glass-card p-5">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                📄 지문 정보
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="지문 제목 (예: The Power of Habit)"
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                />
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="출처 (예: 2024 수능, 교과서YBM3)"
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                />
              </div>
            </div>

            <div className="glass-card p-5">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                ✍️ 영어 지문 입력
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="영어 지문을 여기에 붙여넣으세요...

예시:
Habits are powerful forces in our lives. According to researchers, about 40 percent of our daily actions are habits, not conscious decisions..."
                rows={14}
                disabled={step === 'analyzing'}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors resize-none font-mono leading-relaxed disabled:opacity-50"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  {text.trim() ? `${text.trim().split(/\s+/).length} 단어` : '0 단어'}
                </span>
                {analysis && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 분석 완료
                  </span>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* 분석 버튼 */}
            {step === 'input' && (
              <button
                onClick={handleAnalyze}
                disabled={text.trim().length < 10}
                className="btn-glow w-full py-3.5 text-sm relative z-10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" /> AI 지문 분석 시작
              </button>
            )}
            {step === 'analyzing' && (
              <div className="w-full py-3.5 glass-card flex items-center justify-center gap-2 text-sm text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                Gemini AI가 지문을 분석 중입니다...
              </div>
            )}
            {(step === 'analyzed' || step === 'saving' || step === 'generating') && (
              <button
                onClick={handleAnalyze}
                className="w-full py-3 text-sm glass-card hover:border-blue-500/50 text-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> 다시 분석
              </button>
            )}
          </div>

          {/* ── 오른쪽: 분석 결과 ── */}
          <div className="space-y-4 fade-in fade-in-delay-1">
            {!analysis && step !== 'analyzing' && (
              <div className="glass-card p-12 text-center text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">지문을 입력하고 분석 버튼을 누르면<br />분석 결과가 여기에 표시됩니다.</p>
              </div>
            )}
            {step === 'analyzing' && (
              <div className="glass-card p-12 text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
                  <Brain className="absolute inset-0 m-auto w-7 h-7 text-blue-400" />
                </div>
                <p className="text-sm text-slate-300 font-medium">분석 중...</p>
                <p className="text-xs text-slate-500 mt-1">핵심 어휘·난이도·연결어·요지 추출</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                {/* 개요 카드 */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm">지문 개요</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: '주제', value: analysis.topic },
                      { label: '레벨', value: analysis.level },
                      { label: '단어 수', value: `${analysis.word_count}개` },
                      { label: '독해 스킬', value: `${analysis.reading_skills.length}가지` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                        <div className="text-sm font-semibold">
                          {label === '레벨' ? (
                            <span className={`px-2 py-0.5 rounded-md border text-xs ${CEFR_COLOR[value] ?? ''}`}>{value}</span>
                          ) : value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-800/40 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">요지</div>
                    <p className="text-sm text-slate-200 leading-relaxed">{analysis.main_idea}</p>
                  </div>
                </div>

                {/* 핵심 어휘 */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-sm">핵심 어휘 ({analysis.key_vocab.length}개)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.key_vocab.map((v: KeyVocab) => (
                      <div
                        key={v.word}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${CEFR_COLOR[v.cefr] ?? 'bg-slate-700/50 text-slate-300 border-slate-600'}`}
                      >
                        <span className="font-bold">{v.word}</span>
                        <span className="opacity-70">·</span>
                        <span>{v.meaning_kr}</span>
                        <span className="opacity-50 text-[10px]">{v.cefr}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 연결어 */}
                {analysis.connectives.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm">연결어 ({analysis.connectives.length}개)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.connectives.map((c: Connective, i: number) => (
                        <span
                          key={i}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${CONNECTIVE_COLOR[c.type] ?? 'bg-slate-700/50 text-slate-300'}`}
                        >
                          {c.word} <span className="opacity-60">({c.type})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 문장 분석 (토글) */}
                <div className="glass-card overflow-hidden">
                  <button
                    onClick={() => setShowSentences(!showSentences)}
                    className="w-full flex items-center justify-between p-5 text-sm font-bold hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      문장별 분석 ({analysis.sentences.length}문장)
                      <span className="text-xs font-normal text-slate-500">
                        — 긴 문장 {analysis.sentences.filter(s => s.is_long).length}개
                      </span>
                    </div>
                    {showSentences ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {showSentences && (
                    <div className="px-5 pb-4 space-y-2">
                      {analysis.sentences.map(s => (
                        <div
                          key={s.index}
                          className={`p-3 rounded-lg text-xs leading-relaxed border-l-2 ${
                            s.is_long ? 'border-amber-500 bg-amber-500/5' : 'border-slate-700 bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-500 font-mono">#{s.index + 1}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DIFFICULTY_COLOR[s.difficulty]}`}>
                              {s.difficulty}
                            </span>
                            <span className="text-slate-500">{s.word_count}단어</span>
                            {s.is_long && <span className="text-amber-400 text-[10px]">⚠ 긴 문장</span>}
                          </div>
                          <p className="text-slate-300">{s.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 문항 생성 설정 */}
                <div className="glass-card p-5 border-blue-500/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm">AI 문항 생성 설정</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">생성할 문항 유형을 선택하세요:</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(['vocab','blank','main_idea','order','insert'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedTypes.includes(type)
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {/* 저장 버튼 */}
                    {!passageId && (
                      <button
                        onClick={handleSave}
                        disabled={step === 'saving'}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-sm text-slate-200 transition-all disabled:opacity-50"
                      >
                        {step === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        지문만 저장
                      </button>
                    )}
                    {passageId && (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> 저장됨
                      </div>
                    )}

                    {/* 문항 생성 버튼 */}
                    <button
                      onClick={handleGenerate}
                      disabled={selectedTypes.length === 0 || step === 'generating'}
                      className="btn-glow flex-1 py-2.5 text-sm relative z-10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {step === 'generating' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> 문항 생성 중...</>
                      ) : (
                        <><Brain className="w-4 h-4" /> {selectedTypes.length}개 유형 문항 생성 <ArrowRight className="w-3 h-3" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
