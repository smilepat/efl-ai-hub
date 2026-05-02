/**
 * LogicFlow Linking + Highlight Task 배치 생성 스크립트
 * - Linking Task: 대명사/지시어가 가리키는 대상 찾기
 * - Highlight Task: 주제문/핵심 문장 찾기
 * 
 * 실행: npx tsx scripts/generate_linking_highlight_tasks.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';

// ⚠️ 반드시 다른 import 전에 dotenv 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@libsql/client';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  },
});

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── Linking Task 생성 ─────────────────────────────────
async function generateLinkingTask(passageId: string, passageText: string): Promise<boolean> {
  // 대명사/지시어가 있는 문장을 찾기 위해 Gemini에 맡김
  const prompt = `당신은 수능 영어 구문 분석 전문가입니다.
다음 영어 지문을 읽고, 학생이 대명사/지시어가 무엇을 가리키는지 연습할 수 있는 Linking Task를 만들어주세요.

[지문]
${passageText}

요구사항:
1. 지문에서 대명사(they, it, this, that, these, those, them, their, its 등) 또는 지시어가 명확한 대상을 가리키는 문장 하나를 선택하세요.
2. 선택한 문장을 단어 단위로 분리하여, 대명사의 인덱스와 가리키는 대상(referent)의 인덱스를 정확히 표시하세요.
3. 결과는 반드시 아래 JSON 형식으로만 출력하세요.

형식:
{
  "type": "linking",
  "sentence": "선택한 영어 문장 전체",
  "pronoun": "대명사/지시어 (예: they)",
  "pronoun_index": 0,
  "referent": "가리키는 대상 구/단어 (예: social scientists)",
  "referent_indices": [0, 1],
  "explanation": "왜 이 대명사가 해당 대상을 가리키는지 한국어 1-2줄 해설"
}

*주의: 
- pronoun_index는 sentence를 공백으로 split한 배열에서의 0-based 인덱스입니다.
- referent_indices도 같은 배열에서의 인덱스입니다.
- referent가 같은 문장에 없고 앞 문장에 있는 경우, 해당 앞 문장까지 포함하여 sentence로 사용하세요.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const payload = parseJson<any>(text);

    // 유효성 검증
    if (!payload.sentence || !payload.pronoun || payload.pronoun_index === undefined || !payload.referent_indices) {
      console.warn('  ⚠️ 불완전한 응답');
      return false;
    }

    const taskId = `Q_LINK_${passageId.replace('P_', '')}`;

    // 중복 체크
    const existing = await db.execute({
      sql: "SELECT id FROM questions WHERE id = ?",
      args: [taskId],
    });
    if (existing.rows.length > 0) {
      console.log(`  ⏭ 이미 존재: ${taskId}`);
      return true;
    }

    await db.execute({
      sql: `INSERT INTO questions (id, passage_id, type, prompt, options, answer, skill, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        taskId,
        passageId,
        'logicflow_linking',
        `다음 문장에서 "${payload.pronoun}"이(가) 가리키는 대상을 찾으세요.`,
        JSON.stringify(payload),
        'A',
        'reference',
        'ai_agent',
      ],
    });

    console.log(`  ✅ Linking Task 저장: ${taskId}`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ Linking 오류: ${err.message?.slice(0, 100)}`);
    if (err.status === 429) {
      console.log('  ⏳ Rate limit 대기 (30초)...');
      await new Promise(r => setTimeout(r, 30000));
    }
    return false;
  }
}

// ─── Highlight Task 생성 ─────────────────────────────────
async function generateHighlightTask(passageId: string, passageText: string): Promise<boolean> {
  const prompt = `당신은 수능 영어 독해 전문가입니다.
다음 영어 지문을 읽고, 학생이 주제문(Topic Sentence)이나 핵심 문장을 찾는 연습을 할 수 있는 Highlight Task를 만들어주세요.

[지문]
${passageText}

요구사항:
1. 이 지문의 주제문(Topic Sentence) 또는 글의 핵심을 가장 잘 나타내는 문장 1~2개를 찾으세요.
2. 지문 전체를 passage 필드에 넣고, 정답 문장의 인덱스(0-based)를 correct_indices 배열에 넣으세요.
3. 인덱스는 지문을 문장 단위로 분리했을 때의 순서입니다. (마침표/물음표/느낌표 기준)
4. 결과는 반드시 아래 JSON 형식으로만 출력하세요.

형식:
{
  "type": "highlight",
  "passage": "지문 전체 텍스트",
  "question": "이 글의 주제문(Topic Sentence)을 찾으세요.",
  "correct_indices": [0],
  "explanation": "왜 이 문장이 주제문인지 한국어 1-2줄 해설"
}

*주의:
- passage는 원본 지문 전체를 넣으세요.
- correct_indices는 지문을 [^.!?]+[.!?]+ 정규식으로 split한 배열에서의 0-based 인덱스입니다.
- 주제문이 여러 개인 경우 모두 포함하세요.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const payload = parseJson<any>(text);

    // 유효성 검증
    if (!payload.passage || !payload.correct_indices || !Array.isArray(payload.correct_indices)) {
      console.warn('  ⚠️ 불완전한 응답');
      return false;
    }

    const taskId = `Q_HIGH_${passageId.replace('P_', '')}`;

    // 중복 체크
    const existing = await db.execute({
      sql: "SELECT id FROM questions WHERE id = ?",
      args: [taskId],
    });
    if (existing.rows.length > 0) {
      console.log(`  ⏭ 이미 존재: ${taskId}`);
      return true;
    }

    await db.execute({
      sql: `INSERT INTO questions (id, passage_id, type, prompt, options, answer, skill, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        taskId,
        passageId,
        'logicflow_highlight',
        payload.question || '이 글의 주제문(Topic Sentence)을 찾으세요.',
        JSON.stringify(payload),
        'A',
        'main_idea',
        'ai_agent',
      ],
    });

    console.log(`  ✅ Highlight Task 저장: ${taskId}`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ Highlight 오류: ${err.message?.slice(0, 100)}`);
    if (err.status === 429) {
      console.log('  ⏳ Rate limit 대기 (30초)...');
      await new Promise(r => setTimeout(r, 30000));
    }
    return false;
  }
}

// ─── 메인 ─────────────────────────────────
async function main() {
  console.log('🚀 LogicFlow Linking + Highlight Task 배치 생성 시작');
  console.log(`🔑 API Key: ${apiKey!.slice(0, 10)}...`);

  // CSAT 기출 지문 중 충분히 긴 지문 20개 선택
  const res = await db.execute(`
    SELECT p.id, p.title, p.text 
    FROM passages p 
    WHERE p.id LIKE 'P_CSAT_%'
      AND LENGTH(p.text) > 200
    ORDER BY p.id ASC
    LIMIT 20
  `);

  console.log(`📊 대상 지문: ${res.rows.length}개\n`);

  let linkSuccess = 0, highlightSuccess = 0;

  for (let i = 0; i < res.rows.length; i++) {
    const p = res.rows[i];
    console.log(`\n[${i + 1}/${res.rows.length}] 📄 ${p.title} (${p.id})`);

    // Linking Task 생성
    console.log('  🔗 Linking Task 생성 중...');
    if (await generateLinkingTask(p.id as string, p.text as string)) {
      linkSuccess++;
    }
    await new Promise(r => setTimeout(r, 3000));

    // Highlight Task 생성
    console.log('  🖍️ Highlight Task 생성 중...');
    if (await generateHighlightTask(p.id as string, p.text as string)) {
      highlightSuccess++;
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n🎉 배치 완료!`);
  console.log(`  🔗 Linking Tasks: ${linkSuccess}개 성공`);
  console.log(`  🖍️ Highlight Tasks: ${highlightSuccess}개 성공`);
}

main().catch(console.error);
