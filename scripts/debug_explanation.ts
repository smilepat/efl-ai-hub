import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@libsql/client';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
});

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  // 실패한 문항 1개 가져오기
  const res = await db.execute(
    "SELECT q.id, q.prompt, q.options, q.answer, p.text as passage_text FROM questions q JOIN passages p ON q.passage_id = p.id WHERE (q.explanation IS NULL OR q.explanation = '') AND q.type NOT LIKE 'logicflow_%' LIMIT 1"
  );

  const q = res.rows[0];
  console.log('문항:', q.id);

  let optionsStr = '';
  try {
    const optObj = typeof q.options === 'string' ? JSON.parse(q.options as string) : q.options;
    for (const [k, v] of Object.entries(optObj as Record<string, string>)) {
      optionsStr += `${k}) ${v}\n`;
    }
  } catch { optionsStr = String(q.options); }

  const prompt = `당신은 수능 영어 일타 강사입니다.
다음 문제의 해설을 한국어로 1~3줄로 작성해주세요.

[지문] ${(q.passage_text as string).slice(0, 500)}
[문항] ${q.prompt}
[보기] ${optionsStr}
[정답] ${q.answer}

해설만 순수 텍스트로 출력하세요. JSON이나 마크다운 형식을 사용하지 마세요.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log('\n=== RAW RESPONSE ===');
  console.log(text);
  console.log('=== END ===');
  console.log('Length:', text.length);
}

main().catch(console.error);
