# EFL AI Hub 🎓

> 수능 영어 기출 데이터 기반 AI 맞춤형 학습 플랫폼
>
> **Live:** https://efl-ai-hub.vercel.app

## 🚀 Quick Start (다른 PC에서 clone 후 바로 실행)

```bash
# 1. 저장소 복제
git clone https://github.com/smilepat/efl-ai-hub.git
cd efl-ai-hub

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 에 실제 값을 입력 (아래 "환경 변수" 섹션 참고)

# 4. 개발 서버 실행
npm run dev
```

> **참고:** Turso 클라우드 DB를 사용하므로 로컬 DB 세팅 없이 바로 실행 가능합니다.
> `TURSO_DATABASE_URL`과 `TURSO_AUTH_TOKEN`을 설정하면 원격 DB에 자동 연결됩니다.

## 📋 환경 변수

| 변수명 | 설명 | 발급처 | 필수 |
|---|---|---|---|
| `TURSO_DATABASE_URL` | Turso libSQL 데이터베이스 URL | [turso.tech](https://turso.tech) | ✅ |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 | [turso.tech](https://turso.tech) | ✅ |
| `GEMINI_API_KEY` | Google Gemini API 키 | [AI Studio](https://aistudio.google.com/apikey) | ✅ |
| `NEXTAUTH_SECRET` | NextAuth JWT 시크릿 (임의 문자열) | `openssl rand -base64 32` | ✅ |
| `NEXTAUTH_URL` | 앱 베이스 URL | 로컬: `http://localhost:3000` | ✅ |

## 🏗️ 기술 스택

- **Framework:** Next.js 15 (App Router, RSC)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS v4, Lucide Icons
- **Database:** Turso (libSQL) — Edge-optimized SQLite
- **AI/LLM:** Google Gemini 2.5 Flash
- **Auth:** NextAuth.js v5 (beta) + bcrypt

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/           # REST API 엔드포인트
│   ├── student/       # 학생 뷰 (대시보드, 퀴즈, 복습, 오답노트 등)
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
├── generate_explanations.ts          # AI 해설 자동 생성 배치
├── generate_logicflow_task.ts        # Chunking Task 자동 생성
├── generate_linking_highlight_tasks.ts # Linking/Highlight Task 생성
├── import_csat_graphdb.ts            # CSAT GraphDB 데이터 임포트
├── seed_turso.ts                     # Turso 초기 시딩
└── check_status.ts                   # DB 상태 확인 도구
```

## 🎯 핵심 기능

1. **AI 기반 콘텐츠 자동 생성** — 지문 분석, 5종 문항 생성, 오답 해설 자동 생성
2. **IRT 스킬 진단** — 문항반응이론 기반 5개 스킬 실시간 추적
3. **LogicFlow 마이크로 과업** — Chunking, Linking, Highlight (Component Registry)
4. **AI 추천 에이전트** — 딥링크 기반 맞춤형 Task 추천
5. **학생 행동 로깅 (Evidence)** — 클릭 위치, 시도 횟수, 소요 시간 수집
6. **교사 대시보드** — 반 전체 스킬 현황, 학생별 Radar Chart, 문항 강제 배정

## 📦 Turso DB 현황

| 데이터 | 건수 |
|---|---|
| CSAT 문항 | 321 |
| AI 해설 | 321 (100%) |
| LogicFlow Chunking | 5 |
| LogicFlow Linking | 20 |
| LogicFlow Highlight | 18 |

## ☁️ Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 저장소(`efl-ai-hub`) 연결
2. **Environment Variables**에 위 표의 5개 변수 모두 입력 (Production + Preview + Development)
3. **Deploy** 클릭 — 자동으로 빌드 & 배포

## 🔧 유틸리티 스크립트

```bash
# DB 상태 확인
npx tsx scripts/check_status.ts

# AI 해설 일괄 생성 (미해설 문항만 처리)
npx tsx scripts/generate_explanations.ts

# Linking/Highlight Task 생성
npx tsx scripts/generate_linking_highlight_tasks.ts
```
