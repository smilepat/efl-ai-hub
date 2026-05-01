import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: '학생 로그인이 필요합니다.' }, { status: 401 });
  }

  const db = getDb();
  const studentId = session.user.id;

  try {
    // 스킬별 진단 결과
    const skills = (await db.execute({ sql: `
      SELECT skill, total, correct, correct_rate, theta, updated_at
      FROM skill_diagnostics
      WHERE student_id = ?
    `, args: [studentId] })).rows as any[];

    // 최근 오답 5개
    const recentWrongs = (await db.execute({ sql: `
      SELECT a.id, a.selected, a.attempted_at,
             q.prompt, q.options, q.answer, q.type, q.skill
      FROM student_attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.student_id = ? AND a.is_correct = 0
      ORDER BY a.attempted_at DESC
      LIMIT 5
    `, args: [studentId] })).rows as any[];

    return NextResponse.json({ skills, recentWrongs });
  } catch (err) {
    console.error('[/api/student/report]', err);
    return NextResponse.json({ error: '리포트 조회 실패' }, { status: 500 });
  }
}
