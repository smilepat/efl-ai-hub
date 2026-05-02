import { getDb } from '../src/lib/db';
import { geminiModel, parseGeminiJson } from '../src/lib/gemini';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('🚀 AI 오답 해설 자동 생성 배치 파이프라인 시작');
  const db = getDb();

  // 해설이 없는 모든 문항 조회 (logicflow 제외)
  const res = await db.execute(`
    SELECT q.id, q.type, q.prompt, q.options, q.answer, p.text as passage_text 
    FROM questions q 
    JOIN passages p ON q.passage_id = p.id
    WHERE (q.explanation IS NULL OR q.explanation = '')
      AND q.type NOT LIKE 'logicflow_%'
    ORDER BY q.id
  `);

  console.log(`📊 해설 미생성 문항: ${res.rows.length}개`);
  
  if (res.rows.length === 0) {
    console.log('✅ 해설이 없는 문항이 없습니다. (모두 완료)');
    return;
  }

  for (const q of res.rows) {
    const questionId = q.id as string;
    console.log(`\n📄 처리 중: 문항 ID [${questionId}]`);
    
    // 객관식 보기 텍스트 복원
    let optionsStr = '';
    try {
      const optObj = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      for (const [k, v] of Object.entries(optObj as Record<string, string>)) {
        optionsStr += `${k}) ${v}\n`;
      }
    } catch (e) {
      optionsStr = String(q.options);
    }

    const prompt = `
당신은 수능 영어 일타 강사입니다.
다음 수능 영어 지문과 문제, 보기, 그리고 정답이 주어집니다.
학생이 이 문제를 틀렸을 때 읽고 즉시 이해할 수 있도록 명쾌한 해설을 작성해주세요.

[지문]
${q.passage_text}

[문항]
${q.prompt}

[보기]
${optionsStr}

[정답]
${q.answer}

요구사항:
1. 정답이 왜 정답인지 지문의 핵심 문장을 근거로 1~2줄로 설명하세요.
2. 매력적인 오답이 있다면 왜 오답인지 간단히 언급해주세요.
3. 결과는 반드시 아래 JSON 형식으로만 출력하세요.

형식:
{
  "explanation": "여기에 상세하고 친절한 해설 텍스트 (줄바꿈 가능)"
}
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const payload = parseGeminiJson<{ explanation: string }>(text);

      if (payload.explanation) {
        await db.execute({
          sql: `UPDATE questions SET explanation = ? WHERE id = ?`,
          args: [payload.explanation, questionId]
        });
        console.log(`✅ 해설 생성 및 DB 업데이트 완료`);
      } else {
        console.warn(`⚠️ 해설 생성 실패 (빈 값 반환)`);
      }
    } catch (err) {
      console.error('❌ AI 해설 생성 중 오류:', err);
    }
    
    // API Rate limit 고려
    // Gemini Flash rate limit: 15 RPM free tier → 1회/4초
    await new Promise(r => setTimeout(r, 4000));
  }
  
  console.log('\n🎉 AI 오답 해설 배치 생성 완료!');
}

main().catch(console.error);
