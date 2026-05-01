import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateQuestions, QuestionType } from '@/lib/agents/generateAgent';
import { getDb } from '@/lib/db';
import type { PassageAnalysis } from '@/lib/agents/analyzeAgent';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'teacher') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  try {
    const { passageId, passageText, analysis, types } = await req.json() as {
      passageId: string;
      passageText: string;
      analysis: PassageAnalysis;
      types: QuestionType[];
    };

    if (!passageText || !analysis) {
      return NextResponse.json({ error: '지문 텍스트와 분석 결과가 필요합니다.' }, { status: 400 });
    }

    const questions = await generateQuestions(passageText, analysis, types);
    const db = getDb();

    const savedIds: string[] = [];
    const statements = questions.map(q => {
      const id = `Q_${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
      savedIds.push(id);
      return {
        sql: `INSERT OR REPLACE INTO questions
          (id, passage_id, type, depth, prompt, options, answer, explanation, skill, irt_b, irt_a, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai')`,
        args: [
          id, passageId, q.type, q.depth,
          q.prompt, JSON.stringify(q.options),
          q.answer, q.explanation ?? null,
          q.skill, q.irt_b, 1.0
        ]
      };
    });
    
    await db.batch(statements, 'write');

    return NextResponse.json({ success: true, questions, savedIds });

  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('[/api/generate]', err);
    return NextResponse.json({ error: `문항 생성 실패: ${message}` }, { status: 500 });
  }
}
