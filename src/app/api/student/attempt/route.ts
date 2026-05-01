import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  try {
    const { questionId, selected, timeSec } = await req.json() as {
      questionId: string;
      selected: string;
      timeSec: number;
    };

    const db = getDb();

    // 정답 확인
    const question = (await db.execute({ sql: 'SELECT answer, skill, irt_b FROM questions WHERE id = ?', args: [questionId] }))
      .rows[0] as unknown as { answer: string; skill: string; irt_b: number } | undefined;

    if (!question) return NextResponse.json({ error: '문항을 찾을 수 없습니다.' }, { status: 404 });

    const isCorrect = selected === question.answer ? 1 : 0;
    const studentId = session.user.id;

    // 응답 저장
    const attemptId = `A_${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    await db.execute({ sql: `
      INSERT INTO student_attempts (id, student_id, question_id, selected, is_correct, time_sec)
      VALUES (?, ?, ?, ?, ?, ?)
    `, args: [attemptId, studentId, questionId, selected, isCorrect, timeSec ?? 0] });

    // 스킬별 진단 통계 갱신 (UPSERT)
    if (question.skill) {
      await db.execute({ sql: `
        INSERT INTO skill_diagnostics (id, student_id, skill, total, correct, correct_rate, theta, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, skill) DO UPDATE SET
          total        = total + 1,
          correct      = correct + excluded.correct,
          correct_rate = CAST(correct + excluded.correct AS REAL) / (total + 1),
          theta        = (theta * total + ?) / (total + 1),
          updated_at   = CURRENT_TIMESTAMP
      `, args: [`SD_${randomUUID().replace(/-/g,'').slice(0,10).toUpperCase()}`,
        studentId, question.skill,
        isCorrect, isCorrect ? question.irt_b : -0.5,
        isCorrect ? question.irt_b : -0.5] });
    }

    return NextResponse.json({ success: true, isCorrect: !!isCorrect, correctAnswer: question.answer });

  } catch (err) {
    console.error('[/api/student/attempt]', err);
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }
}
