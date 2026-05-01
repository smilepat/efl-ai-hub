import { getDb } from '../src/lib/db';
import { geminiModel, parseGeminiJson } from '../src/lib/gemini';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('🚀 LogicFlow Task(Chunking) 자동 생성 (Batch) 시작');
  const db = getDb();

  // 1. 적당한 수능 기출 지문 5개 가져오기
  const res = await db.execute(`
    SELECT p.id, p.title, p.text 
    FROM passages p 
    WHERE p.id LIKE 'P_CSAT_%'
    ORDER BY p.id ASC
    LIMIT 5
  `);
  
  if (res.rows.length === 0) {
    console.error('❌ CSAT 지문을 찾을 수 없습니다.');
    return;
  }

  for (const passage of res.rows) {
    const passageText = passage.text as string;
    console.log(`\n📄 처리 중: ${passage.title} (${passage.id})`);
    
    // 이미 Chunking Task가 생성되었는지 확인
    const checkRes = await db.execute({
      sql: `SELECT id FROM questions WHERE passage_id = ? AND type = 'logicflow_chunking'`,
      args: [passage.id]
    });
    
    if (checkRes.rows.length > 0) {
      console.log(`⏭ 이미 처리된 지문입니다. 건너뜁니다.`);
      continue;
    }

    const sentences = passageText.match(/[^.!?]+[.!?]+/g) || [];
    let targetSentence = sentences.reduce((a, b) => a.length > b.length ? a : b, '');
    targetSentence = targetSentence.trim().replace(/\n/g, ' ');

    console.log(`🎯 타겟 복합문:\n${targetSentence}`);

    const prompt = `
당신은 수능 영어 구문 분석 전문가입니다.
학생들이 복잡한 문장을 읽을 때, 의미 단위(절, 구, 접속사 앞 등)로 올바르게 끊어 읽는 연습(Chunking Task)을 하려고 합니다.

다음 영어 문장이 주어집니다:
"${targetSentence}"

이 문장에서 의미가 크게 나뉘는 경계(boundary)를 1~3곳 찾아주세요.
경계는 단어와 단어 사이의 띄어쓰기 위치를 말합니다.
결과는 반드시 아래 JSON 형식으로만 출력하세요.

형식:
{
  "type": "chunking",
  "sentence": "원본 문장",
  "chunks": [
    "첫 번째 청크 ",
    "두 번째 청크 ",
    "세 번째 청크"
  ],
  "explanation": "왜 이렇게 끊어 읽어야 하는지 한국어로 1줄 설명"
}

*주의사항: chunks 배열에 있는 모든 문자열을 차례대로 합치면 원본 sentence와 정확히 일치해야 합니다. (띄어쓰기 포함)
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const taskPayload = parseGeminiJson(text);

      const taskId = `Q_TASK_${String(passage.id).replace('P_', '')}`;
      await db.execute({
        sql: `
          INSERT INTO questions (id, passage_id, type, prompt, options, answer, skill, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          taskId,
          passage.id,
          'logicflow_chunking',
          '다음 문장을 의미 단위로 알맞게 끊어 보세요.',
          JSON.stringify(taskPayload),
          'A', 
          'structure',
          'ai_agent'
        ]
      });
      
      console.log(`✅ 생성 및 DB 저장 완료: ${taskId}`);
    } catch (err) {
      console.error('❌ AI 생성 중 오류:', err);
    }
    
    // API Rate limit 고려하여 2초 대기
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\\n🎉 LogicFlow Task 배치 생성 완료!');
}

main().catch(console.error);
