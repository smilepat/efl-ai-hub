import Link from 'next/link';
import {
  ArrowLeft, Target, Network, Database, BookOpen, Brain,
  ShieldCheck, Cpu, Users, HelpCircle, AlertCircle, BarChart3,
  Zap, Sparkles, RotateCcw, ChevronRight, Lightbulb, Rocket,
} from 'lucide-react';

export default function GuidePage() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto space-y-14 pb-20">
      {/* Header */}
      <div className="fade-in">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
          EFL <span className="gradient-text">Mini AI Hub</span> 가이드
        </h1>
        <p className="text-lg text-slate-400">시스템 목적 · 작동방식 · 테크스펙 · 사용법 · 개선 방향</p>
      </div>

      {/* ━━━ 1. 목적 ━━━ */}
      <section className="glass-card p-8 fade-in fade-in-delay-1">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-blue-400">
          <Target className="w-6 h-6" /> 1. 시스템 목적
        </h2>
        <p className="text-slate-300 leading-relaxed mb-5">
          EFL Mini AI Hub는 <strong>수능·모의고사 영어 기출 데이터</strong>와 <strong>생성형 AI(Gemini)</strong>를 결합하여,
          교사와 학생 모두의 학습 생산성을 극대화하는 <strong>AI 기반 완전학습 플랫폼</strong>입니다.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <h3 className="font-bold text-blue-300 mb-2">🧑‍🏫 교사</h3>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              <li>지문 입력 → 5종 문항 + 해설 <strong>원클릭 자동 생성</strong></li>
              <li>319개 수능 기출 문항 즉시 활용 (수동 입력 0%)</li>
              <li>반 전체/개인별 스킬 현황 실시간 모니터링</li>
              <li>학생에게 특정 문항·과업 <strong>강제 배정</strong></li>
            </ul>
          </div>
          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <h3 className="font-bold text-purple-300 mb-2">🧑‍🎓 학생</h3>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              <li>IRT 기반 <strong>적응형 문항 추천</strong> (본인 수준에 딱 맞는 문항)</li>
              <li>5개 스킬별 Radar/Bar Chart <strong>실시간 진단</strong></li>
              <li>AI가 약점 보완 마이크로 과업(Task) 자동 추천</li>
              <li>오답 노트에서 AI 해설과 함께 복습</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ━━━ 2. 작동 방식 ━━━ */}
      <section className="glass-card p-8 fade-in fade-in-delay-2">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-emerald-400">
          <Network className="w-6 h-6" /> 2. 작동 방식
        </h2>
        <p className="text-slate-300 leading-relaxed mb-6">
          W3Schools 스타일의 <strong>이론 → 즉시 연습 → 실전</strong>으로 이어지는 LogicFlow 전략을 채택합니다.
        </p>
        <div className="space-y-4">
          {[
            { step: '①', title: '데이터 적재', desc: 'CSAT 기출 지문·문항이 Turso Cloud DB에 관계형 매핑되어 저장됩니다. 교사가 새 지문을 입력하면 AI가 즉시 문항을 생성합니다.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { step: '②', title: 'IRT 기반 진단', desc: '학생이 문제를 풀 때마다 IRT(문항반응이론) 알고리즘이 스킬별 능력치(θ)를 실시간 업데이트합니다. 5개 스킬(어휘·추론·주제·흐름·구조)을 독립적으로 추적합니다.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { step: '③', title: 'AI 콘텐츠 생성', desc: 'Gemini 2.5 Flash가 오답 해설을 자동 생성하고, Chunking/Linking/Highlight 등의 마이크로 과업(Task) 데이터를 JSON 형태로 일괄 생성합니다.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { step: '④', title: '초개인화 추천', desc: '학생의 취약 스킬에 가장 적합한 기출 지문을 선별하고, 딥링크를 통해 전용 Task로 유도합니다. 교사도 특정 문항을 직접 배정할 수 있습니다.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { step: '⑤', title: '행동 데이터 수집', desc: '마이크로 과업에서 클릭 위치, 시도 횟수, 소요 시간 등 상세 행동 데이터(Evidence)를 수집하여 스킬 마스터리를 더 정밀하게 추적합니다.', color: 'text-pink-400', bg: 'bg-pink-500/10' },
          ].map(({ step, title, desc, color, bg }) => (
            <div key={step} className={`flex gap-4 p-4 rounded-xl ${bg} border border-slate-700/30`}>
              <span className={`text-2xl font-black ${color} shrink-0`}>{step}</span>
              <div>
                <h3 className="font-bold text-slate-200 mb-1">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ 3. 테크 스펙 ━━━ */}
      <section className="glass-card p-8 fade-in fade-in-delay-3">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-amber-400">
          <Database className="w-6 h-6" /> 3. 테크 스펙
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="py-3 px-4">분류</th>
                <th className="py-3 px-4">기술</th>
                <th className="py-3 px-4">설명</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-400">
              {[
                ['Frontend', 'Next.js 15 · React 19 · TypeScript', 'App Router 기반 SSR/RSC, Turbopack 빌드'],
                ['Styling', 'Tailwind CSS v4 · Lucide Icons', 'Glassmorphism, Fade-in 애니메이션, 다크모드 기반 프리미엄 UI'],
                ['Database', 'Turso (libSQL)', 'Edge 최적화 SQLite. 지문·문항·진단·추천·증거 6개 핵심 테이블'],
                ['AI / LLM', 'Google Gemini 2.5 Flash', 'JSON 구조화 응답으로 해설·추천·Task 데이터 자동 생성'],
                ['Auth', 'NextAuth.js v5 (beta)', 'Credentials 기반 JWT. 교사/학생 Role 라우팅 보호'],
                ['Architecture', 'LogicFlow v2 + Component Registry', '문항 유형별 플러그인 컴포넌트 동적 렌더링 (무한 확장 가능)'],
                ['배포', 'Vercel (Serverless)', 'GitHub 연동 자동 배포. 전세계 Edge CDN'],
                ['데이터', '319개 CSAT 기출 + 9,183 어휘', 'import 파이프라인으로 자동 적재. 수동 입력 0%'],
              ].map(([cat, tech, desc]) => (
                <tr key={cat} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-medium text-slate-300">{cat}</td>
                  <td className="py-3 px-4">{tech}</td>
                  <td className="py-3 px-4">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <h3 className="font-bold text-sm text-slate-300 mb-2">📁 핵심 DB 테이블</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-400">
            {['passages (지문)', 'questions (문항)', 'student_attempts (응답)', 'skill_diagnostics (진단)', 'recommendations (추천)', 'learner_evidence (행동 증거)', 'csat_items (수능 메타)', 'users (교사/학생)', 'skill_map (스킬 정의)'].map(t => (
              <span key={t} className="px-2 py-1 bg-slate-700/50 rounded text-center">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 4. 사용자 설명서 ━━━ */}
      <section className="glass-card p-8">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-indigo-400">
          <BookOpen className="w-6 h-6" /> 4. 사용자 설명서
        </h2>

        {/* 교사 가이드 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> 교사 사용법
          </h3>
          <div className="space-y-3">
            {[
              { step: '1', title: '회원가입 & 로그인', desc: '홈 → "시작하기" → 역할을 "교사"로 선택하여 가입 후 로그인합니다.' },
              { step: '2', title: '지문 등록', desc: '교사 대시보드 → "새 지문 등록" → 영어 지문 텍스트를 붙여넣고 저장합니다.' },
              { step: '3', title: 'AI 문항 생성', desc: '"문항 관리" 메뉴에서 지문을 선택하고 "AI 문항 생성" 버튼을 클릭하면 5종 문항이 자동 생성됩니다.' },
              { step: '4', title: 'CSAT 기출 임포트', desc: '"기출 임포트" 메뉴에서 수능 기출 데이터를 일괄 적재할 수 있습니다.' },
              { step: '5', title: '학생 분석', desc: '"학생 현황" 메뉴에서 반 전체 스킬 평균, 개인별 Radar Chart, 풀이 이력, 행동 데이터를 확인합니다.' },
              { step: '6', title: '과업 강제 배정', desc: '학생 상세 페이지 하단에서 문항 ID를 입력하여 특정 학생에게 직접 과업을 배정합니다.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">{step}</span>
                <div><strong className="text-slate-200 text-sm">{title}</strong><p className="text-xs text-slate-400 mt-0.5">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* 학생 가이드 */}
        <div>
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" /> 학생 사용법
          </h3>
          <div className="space-y-3">
            {[
              { step: '1', title: '회원가입 & 로그인', desc: '홈 → "시작하기" → 역할을 "학생"으로 선택하여 가입 후 로그인합니다.' },
              { step: '2', title: '문제 풀기', desc: '대시보드 → "문제 풀기" → AI가 IRT 기반으로 추천한 지문을 선택하고 퀴즈를 풉니다. 60초 제한 시간이 있습니다.' },
              { step: '3', title: '진단 리포트 확인', desc: '"진단 리포트"에서 5개 스킬(어휘·추론·주제·흐름·구조)별 정답률과 Radar Chart를 확인합니다.' },
              { step: '4', title: '오답 노트 복습', desc: '"오답 노트"에서 틀린 문항의 보기 비교 + AI 해설 + 관련 지문을 아코디언 UI로 열어 복습합니다.' },
              { step: '5', title: 'AI 복습 추천', desc: '"복습 과제"에서 AI가 분석한 약점 보완 추천 사항과 LogicFlow 마이크로 과업 딥링크를 확인합니다.' },
              { step: '6', title: '마이크로 과업 수행', desc: 'Chunking(끊어 읽기) · Linking(지시어 연결) · Highlight(핵심 문장 찾기) 3종 인터랙티브 과업을 수행합니다.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">{step}</span>
                <div><strong className="text-slate-200 text-sm">{title}</strong><p className="text-xs text-slate-400 mt-0.5">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 5. 개선 방향 ━━━ */}
      <section className="glass-card p-8">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-pink-400">
          <Rocket className="w-6 h-6" /> 5. 향후 개선 방향
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Lightbulb, color: 'text-amber-400', title: 'Spaced Repetition 통합', desc: '에빙하우스 망각 곡선 기반 복습 알림. 학생이 잊을 시점에 자동으로 오답 문항을 다시 추천합니다.' },
            { icon: Brain, color: 'text-purple-400', title: 'Multi-Agent 협업', desc: '분석·생성·추천·라벨링 4개 AI 에이전트가 체인으로 연결되어 교사의 커리큘럼 설계를 자동화합니다.' },
            { icon: BarChart3, color: 'text-blue-400', title: 'IRT θ 시계열 추적', desc: '학생의 능력치(θ) 변화를 시간축 그래프로 시각화하여, 어느 시점에 실력이 향상되었는지 추적합니다.' },
            { icon: Zap, color: 'text-emerald-400', title: 'Task 유형 무한 확장', desc: 'Summarizing(요약), Reordering(순서 배치), Gap-fill(빈칸 드래그) 등 Component Registry에 새 과업 추가.' },
            { icon: Users, color: 'text-indigo-400', title: '교사 협업 & 문항 마켓플레이스', desc: '교사들이 AI 생성 문항을 검수·공유하는 마켓플레이스. 크라우드소싱으로 문항 품질을 지속적으로 개선합니다.' },
            { icon: ShieldCheck, color: 'text-pink-400', title: 'LMS 연동 (Google Classroom)', desc: 'Google Classroom, Canvas 등 기존 LMS와 SSO 연동하여, 별도 가입 없이 기존 반 구조를 그대로 활용합니다.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <Icon className={`w-7 h-7 ${color} mb-3`} />
              <h3 className="font-bold text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center fade-in">
        <Link href="/register" className="btn-glow px-8 py-3 font-bold inline-flex items-center gap-2 relative z-10">
          EFL Mini AI Hub 시작하기 <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </main>
  );
}
