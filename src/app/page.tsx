'use client';

import Link from 'next/link';
import {
  BookOpen,
  Brain,
  FileText,
  BarChart3,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Target,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    title: '지문 분석',
    desc: '영어 지문을 붙여넣으면 핵심 어휘, 난이도, 주제를 AI가 즉시 분석합니다.',
  },
  {
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    title: '문항 자동 생성',
    desc: '어휘·빈칸·요지·순서·삽입 문제를 5가지 유형으로 자동 생성합니다.',
  },
  {
    icon: BarChart3,
    color: 'from-amber-500 to-orange-500',
    title: '학생 진단',
    desc: '오답 패턴을 분석해 어떤 스킬이 약한지 IRT 기반으로 진단합니다.',
  },
  {
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-500',
    title: '맞춤 과제 추천',
    desc: '진단 결과를 바탕으로 복습 지문·단어·문항 유형을 AI가 추천합니다.',
  },
];

const STATS = [
  { value: '9,183', label: '탑재 어휘', icon: BookOpen },
  { value: '39,842', label: '문항 뱅크', icon: Target },
  { value: 'B1~C1', label: 'CEFR 레벨', icon: GraduationCap },
  { value: 'A→Z', label: 'AI 자동화', icon: Zap },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">
            EFL <span className="gradient-text">Mini AI Hub</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="btn-glow px-5 py-2 text-sm relative z-10"
          >
            시작하기
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-slate-300 mb-8 fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
          Gemini AI · 9,183 어휘 · IRT 진단 탑재
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 fade-in fade-in-delay-1">
          영어교사를 위한
          <br />
          <span className="gradient-text">AI 교무실</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mb-10 fade-in fade-in-delay-2">
          지문을 넣으면 AI가 분석·문항생성·학생진단·맞춤추천까지
          <br className="hidden md:block" />
          모든 영어수업 준비를 자동으로 처리합니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 fade-in fade-in-delay-3 justify-center">
          <Link
            href="/register"
            className="btn-glow px-8 py-4 text-base flex items-center justify-center gap-2 relative z-10"
          >
            무료로 시작하기
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 text-base font-medium glass-card hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
          >
            로그인
          </Link>
          <Link
            href="/guide"
            className="px-8 py-4 text-base font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-indigo-400" />
            앱 가이드
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="glass-card p-5 text-center">
              <Icon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold gradient-text">{value}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            4단계 AI 파이프라인
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <div
                key={title}
                className={`glass-card p-7 hover:border-slate-500 transition-all duration-300 hover:-translate-y-1 fade-in`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        © 2026 EFL Mini AI Hub · Built with Next.js + Gemini API
      </footer>
    </main>
  );
}
