/**
 * AI 오답 해설 자동 생성 배치 파이프라인
 * dotenv를 최상단에서 로딩하여 API 키 초기화 문제 해결
 * 실행: npx tsx scripts/generate_explanations.ts
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
    temperature: 0.4,
    topP: 0.9,
    maxOutputTokens: 4096,
    // text mode — JSON 이스케이프 실패 방지
  },
});

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

function parseExplanation(raw: string): string {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // 1차: 직접 JSON 파싱 시도
  try {
    const obj = JSON.parse(cleaned);
    if (obj.explanation) return obj.explanation;
  } catch {}

  // 2차: 줄바꿈 이스케이프 후 재시도
  try {
    const escaped = cleaned
      .replace(/\r?\n/g, '\\n')
      .replace(/\t/g, '\\t');
    const obj = JSON.parse(escaped);
    if (obj.explanation) return obj.explanation;
  } catch {}

  // 3차: Regex fallback — "explanation" 필드 값 추출
  const match = cleaned.match(/"explanation"\s*:\s*"([\s\S]*?)"\s*\}?\s*$/);
  if (match) {
    return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }

  // 4차: 그냥 텍스트 자체를 해설로 사용 (JSON이 아닌 경우)
  if (cleaned.length > 20 && !cleaned.startsWith('{')) {
    return cleaned;
  }

  throw new Error('해설 추출 실패');
}

async function main() {
  console.log('🚀 AI 오답 해설 자동 생성 배치 파이프라인 시작');
  console.log(`🔑 API Key: ${apiKey!.slice(0, 10)}...`);

  // 해설이 없는 모든 문항 조회 (logicflow 제외)
  const res = await db.execute(
    "SELECT q.id, q.type, q.prompt, q.options, q.answer, p.text as passage_text FROM questions q JOIN passages p ON q.passage_id = p.id WHERE (q.explanation IS NULL OR q.explanation = '') AND q.type NOT LIKE 'logicflow_%' ORDER BY q.id"
  );

  console.log(`📊 해설 미생성 문항: ${res.rows.length}개`);

  if (res.rows.length === 0) {
    console.log('✅ 해설이 없는 문항이 없습니다. (모두 완료)');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < res.rows.length; i++) {
    const q = res.rows[i];
    const questionId = q.id as string;
    console.log(`\n[${i + 1}/${res.rows.length}] 📄 처리 중: ${questionId}`);

    // 객관식 보기 텍스트 복원
    let optionsStr = '';
    try {
      const optObj = typeof q.options === 'string' ? JSON.parse(q.options as string) : q.options;
      for (const [k, v] of Object.entries(optObj as Record<string, string>)) {
        optionsStr += `${k}) ${v}\n`;
      }
    } catch {
      optionsStr = String(q.options);
    }

    const prompt = `당신은 수능 영어 일타 강사입니다.
다음 문제의 해설을 한국어로 작성해주세요. 정답이 왜 정답인지 지문의 핵심 문장을 근거로 1~3줄로 설명하고, 매력적인 오답이 있다면 왜 오답인지 간단히 언급해주세요.
해설만 순수 텍스트로 출력하세요. JSON이나 마크다운 형식을 사용하지 마세요.

[지문] ${(q.passage_text as string).slice(0, 1000)}
[문항] ${q.prompt}
[보기] ${optionsStr}
[정답] ${q.answer}`;

    try {
      const result = await model.generateContent(prompt);
      const explanation = result.response.text().trim();

      if (explanation.length < 10) {
        failCount++;
        console.warn(`  ⚠️ 너무 짧은 해설 (${explanation.length}자)`);
      } else {
        await db.execute({
          sql: 'UPDATE questions SET explanation = ? WHERE id = ?',
          args: [explanation, questionId],
        });
        successCount++;
        console.log(`  ✅ 해설 저장 완료 (${successCount}개 성공)`);
      }
    } catch (err: any) {
      failCount++;
      console.error(`  ❌ 오류: ${err.message?.slice(0, 100)}`);

      // Rate limit인 경우 30초 대기
      if (err.status === 429) {
        console.log('  ⏳ Rate limit 대기 (30초)...');
        await new Promise(r => setTimeout(r, 30000));
      }
    }

    // API Rate limit 고려 — 4초 간격
    await new Promise(r => setTimeout(r, 4000));
  }

  console.log(`\n🎉 배치 완료! 성공: ${successCount}개, 실패: ${failCount}개`);
}

main().catch(console.error);
