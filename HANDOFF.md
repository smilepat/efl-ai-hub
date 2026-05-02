# 🔄 Handoff — 다른 PC에서 작업 재개하기

> 최종 업데이트: 2026-05-02

## 1단계: 클론 & 환경 세팅

```bash
git clone https://github.com/smilepat/efl-ai-hub.git
cd efl-ai-hub
npm install

# Vercel CLI로 환경변수 자동 다운로드
npx vercel link          # 팀: prompt-improvement-dm-pat, 프로젝트: efl-ai-hub
npx vercel env pull .env.local --environment development

npm run dev              # http://localhost:3000
```

> **Vercel 로그인 필요:** `npx vercel login` (GitHub 계정: smilepat)

## 환경 변수 (5개 필수)

| 변수 | 용도 | 발급처 |
|---|---|---|
| `TURSO_DATABASE_URL` | Turso libSQL DB URL | [turso.tech](https://turso.tech) |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 | [turso.tech](https://turso.tech) |
| `GEMINI_API_KEY` | Google Gemini API | [AI Studio](https://aistudio.google.com/apikey) |
| `NEXTAUTH_SECRET` | JWT 시크릿 | 임의 문자열 |
| `NEXTAUTH_URL` | 앱 URL | 로컬: `http://localhost:3000` |

환경변수는 Vercel에 3개 환경(Production, Preview, Development) 모두 등록 완료.
`vercel env pull`로 자동 다운로드 가능.

## 배포

| 환경 | URL |
|---|---|
| **Production** | https://efl-ai-hub.vercel.app |
| **GitHub** | https://github.com/smilepat/efl-ai-hub |

`git push origin master` → Vercel 자동 배포

## 기술 스택

- **Framework:** Next.js 15 (App Router, RSC)
- **DB:** Turso (libSQL) — 클라우드 SQLite, 로컬 DB 설정 불필요
- **AI:** Google Gemini 2.5 Flash
- **Auth:** NextAuth.js v5 + bcrypt

## 데이터 현황 (Turso 원격 DB)

| 데이터 | 건수 |
|---|---|
| 테이블 수 | 10개 |
| CSAT 문항 (csat_items) | 326 |
| 문제 (questions) | 364 |
| AI 해설 포함 | 321 (88%) |

## 주요 디렉토리

```
src/
├── app/api/          # REST API 엔드포인트
├── app/student/      # 학생 뷰 (대시보드, 퀴즈, 복습, 오답노트)
├── app/teacher/      # 교사 뷰 (지문관리, 학생분석)
├── components/tasks/ # LogicFlow 마이크로 과업
├── lib/agents/       # AI 에이전트 (분석, 생성, 추천, 라벨링)
├── lib/db.ts         # Turso DB 연결 & 스키마
└── lib/gemini.ts     # Gemini SDK 래퍼

scripts/
├── generate_explanations.ts    # AI 해설 배치 생성
├── check_status.ts             # DB 상태 확인
└── sync_vercel_env.ts          # Vercel 환경변수 동기화
```

## 유틸리티 명령어

```bash
npx tsx scripts/check_status.ts              # DB 상태 확인
npx tsx scripts/generate_explanations.ts     # 미해설 문항 AI 해설 생성
```

## 관련 프로젝트

| 프로젝트 | 역할 | URL |
|---|---|---|
| vocabulary-db | 마스터 어휘 DB (9,183단어) | https://github.com/smilepat/vocabulary-db |
| vocab-cat-test | IRT 5D 진단 엔진 | https://vocab-cat-test.vercel.app |
| vocab-learn-pat | 5D 학습 엔진 | https://vocab-learn-pat.vercel.app |
