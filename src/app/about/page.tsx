import Link from 'next/link';
import { ArrowLeft, BookOpen, Brain, Server, ShieldCheck, Cpu, Database, Network, Target, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto space-y-12">
      <div className="fade-in">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-2 mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          EFL <span className="gradient-text">Mini AI Hub</span>
        </h1>
        <p className="text-xl text-slate-300">
          수능 및 모의고사 영어 데이터를 기반으로 한 지능형 맞춤 학습 플랫폼
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 fade-in fade-in-delay-1">
        {/* 목적 */}
        <section className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
            <Target className="w-6 h-6" /> 앱의 목적 (Purpose)
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            EFL Mini AI Hub는 영어 교사와 학생 모두를 위한 <strong>AI 기반 완전 학습 생태계</strong>를 구축하는 것을 목적으로 합니다. 
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
            <li><strong>교사:</strong> 반복적인 문제 출제, 채점, 약점 분석 업무를 AI로 자동화하여 학생 코칭에 집중.</li>
            <li><strong>학생:</strong> 획일적인 기출문제 풀이에서 벗어나, 본인의 미세 약점(Micro-Skill)을 실시간으로 진단받고 맞춤형 추천 과업(Task)을 통해 학습 효율 극대화.</li>
          </ul>
        </section>

        {/* 작동 방식 */}
        <section className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
            <Network className="w-6 h-6" /> 작동 방식 (Mechanism)
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            W3Schools 스타일의 <strong>이론 ➔ 즉시 연습 ➔ 실전</strong>으로 이어지는 LogicFlow 전략을 차용합니다.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
            <li><strong>데이터 적재:</strong> CSAT(수능) 기출 지문과 문항이 Turso GraphDB 모델로 관계형 매핑되어 저장됩니다.</li>
            <li><strong>진단 테스트:</strong> 학생이 퀴즈를 풀 때마다 IRT(문항반응이론) 기반 알고리즘이 학생의 능력치(Theta)를 실시간 업데이트합니다.</li>
            <li><strong>AI 파이프라인:</strong> 백그라운드 AI 에이전트가 오답 해설과 'Chunking' 등의 미세 역량 과업(Task Payload)을 일괄 자동 생성합니다.</li>
            <li><strong>초개인화 추천:</strong> 학생의 취약 스킬에 가장 적합한 기출 지문을 선별하고 딥링크(Deep Link)를 통해 전용 Task로 유도합니다.</li>
          </ol>
        </section>
      </div>

      {/* 주요 기능 */}
      <section className="glass-card p-8 fade-in fade-in-delay-2">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-400">
          <Sparkles className="w-6 h-6" /> 주요 기능 (Key Features)
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <Brain className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">LLM 기반 콘텐츠 자동화</h3>
            <p className="text-sm text-slate-400">지문을 입력하면 5종의 수능형 문제와 명쾌한 오답 해설, 인터랙티브 훈련용 Task Data(JSON)를 Gemini 2.5가 자동 생성합니다.</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">실시간 IRT 스킬 진단</h3>
            <p className="text-sm text-slate-400">문항 난이도와 학생의 응답 데이터를 실시간 계산하여, '어휘', '추론', '구조' 등 5개 주요 스킬별 성취도(Correct Rate)를 시각화합니다.</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <Cpu className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="font-bold text-lg mb-2">Component Registry 구조</h3>
            <p className="text-sm text-slate-400">단순 객관식을 넘어 Chunking(구문분석), Linking(지시어 찾기) 등 무한한 마이크로 과업을 수용할 수 있는 플러그인 아키텍처를 채택했습니다.</p>
          </div>
        </div>
      </section>

      {/* 테크 스펙 */}
      <section className="glass-card p-8 fade-in fade-in-delay-3">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-amber-400">
          <Database className="w-6 h-6" /> 테크 스펙 (Technical Specification)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="py-3 px-4">분류</th>
                <th className="py-3 px-4">사용 기술 및 스택</th>
                <th className="py-3 px-4">상세 설명</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-400">
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 font-medium text-slate-300">Frontend / Framework</td>
                <td className="py-3 px-4">Next.js 15, React 19, TypeScript</td>
                <td className="py-3 px-4">App Router 기반 SSR/RSC 활용, 빠르고 안정적인 페이지 렌더링</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 font-medium text-slate-300">Styling & UI</td>
                <td className="py-3 px-4">Tailwind CSS v4, Lucide Icons</td>
                <td className="py-3 px-4">Vibrant Color, Glassmorphism, Fade-in Animation 등 모던 프리미엄 UI</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 font-medium text-slate-300">Database (Cloud)</td>
                <td className="py-3 px-4">Turso (libSQL)</td>
                <td className="py-3 px-4">Edge 지원 초고속 SQLite 기반 DB. 수능 지문(Passages), 문항(Questions), 진단(Diagnostics) 매핑</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 font-medium text-slate-300">AI / LLM</td>
                <td className="py-3 px-4">Google Gemini 2.5 Flash</td>
                <td className="py-3 px-4"><code>@google/generative-ai</code> SDK를 활용한 JSON 구조화 응답(해설, 추천사, Task 데이터) 생성</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 font-medium text-slate-300">Auth & Security</td>
                <td className="py-3 px-4">NextAuth.js (v5 beta)</td>
                <td className="py-3 px-4">Credentials 기반 JWT 인증 체계 (교사/학생 Role 기반 라우팅 보호)</td>
              </tr>
              <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 font-medium text-slate-300">Architecture Pattern</td>
                <td className="py-3 px-4">LogicFlow v2 & Component Registry</td>
                <td className="py-3 px-4">문항 렌더링을 플러그인 컴포넌트로 분리하여 확장성(Scalability) 확보</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      <div className="text-center pb-10">
        <Link href="/register" className="btn-glow px-8 py-3 font-bold inline-block">
          EFL Mini AI Hub 무료로 시작하기
        </Link>
      </div>
    </main>
  );
}
