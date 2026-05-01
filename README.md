# EFL AI Hub 🎓

> 수능 영어 기출 데이터 기반 AI 맞춤형 학습 플랫폼

## 🚀 Quick Start

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 에 실제 값을 입력

# 3. 개발 서버 실행
npm run dev
```

## 📋 환경 변수

| 변수명 | 설명 | 필수 |
|---|---|---|
| `TURSO_DATABASE_URL` | Turso libSQL 데이터베이스 URL | ✅ |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 | ✅ |
| `GEMINI_API_KEY` | Google Gemini API 키 | ✅ |
| `NEXTAUTH_SECRET` | NextAuth JWT 시크릿 | ✅ |
| `NEXTAUTH_URL` | 앱 베이스 URL (로컬: `http://localhost:3000`) | ✅ |

## 🏗️ 기술 스택

- **Framework:** Next.js 15 (App Router, RSC)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS v4, Lucide Icons
- **Database:** Turso (libSQL) — Edge-optimized SQLite
- **AI/LLM:** Google Gemini 2.5 Flash
- **Auth:** NextAuth.js v5 (beta)

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/           # REST API 엔드포인트
│   ├── student/       # 학생 뷰 (대시보드, 퀴즈, 복습 등)
│   ├── teacher/       # 교사 뷰 (지문관리, 학생분석 등)
│   ├── about/         # 테크 스펙 & 가이드 페이지
│   └── page.tsx       # 랜딩 페이지
├── components/
│   ├── tasks/         # LogicFlow 마이크로 과업 컴포넌트
│   ├── student/       # 학생용 UI 컴포넌트
│   └── teacher/       # 교사용 UI 컴포넌트
├── lib/
│   ├── agents/        # AI 에이전트 (분석, 생성, 추천, 라벨링)
│   ├── auth.ts        # NextAuth 설정
│   ├── db.ts          # Turso DB 연결 & 스키마
│   └── gemini.ts      # Gemini SDK 래퍼
scripts/
├── generate_explanations.ts   # AI 해설 자동 생성 배치
├── generate_logicflow_task.ts # LogicFlow Task 자동 생성 배치
├── import_csat_graphdb.ts     # CSAT GraphDB 데이터 임포트
└── seed_turso.ts              # Turso 초기 시딩
```

## 🎯 핵심 기능

1. **AI 기반 콘텐츠 자동 생성** — 지문 분석, 5종 문항 생성, 오답 해설 자동 생성
2. **IRT 스킬 진단** — 문항반응이론 기반 5개 스킬 실시간 추적
3. **LogicFlow 마이크로 과업** — Chunking 등 플러그인 아키텍처 (Component Registry)
4. **AI 추천 에이전트** — 딥링크 기반 맞춤형 Task 추천
5. **학생 행동 로깅 (Evidence)** — 클릭 위치, 시도 횟수, 소요 시간 수집
6. **교사 대시보드** — 반 전체 스킬 현황, 학생별 Radar Chart, 문항 강제 배정

## ☁️ Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 저장소(`efl-ai-hub`) 연결
2. **Environment Variables**에 위 표의 5개 변수 모두 입력
3. **Deploy** 클릭 — 자동으로 빌드 & 배포
