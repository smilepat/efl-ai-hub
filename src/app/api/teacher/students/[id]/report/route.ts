import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'teacher') {
    return NextResponse.json({ error: '교사 로그인이 필요합니다.' }, { status: 401 });
  }

  const studentId = (await params).id;
  const db = getDb();

  try {
    const student = (await db.execute({ sql: 'SELECT id, name, email FROM users WHERE id = ?', args: [studentId] })).rows[0];
    if (!student) return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });

    const skills = (await db.execute({ sql: `
      SELECT skill, total, correct, correct_rate, theta, updated_at
      FROM skill_diagnostics
      WHERE student_id = ?
    `, args: [studentId] })).rows;

    const recentAttempts = (await db.execute({ sql: `
      SELECT a.id, a.selected, a.is_correct, a.attempted_at,
             q.prompt, q.options, q.answer, q.type, q.skill
      FROM student_attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.student_id = ?
      ORDER BY a.attempted_at DESC
      LIMIT 10
    `, args: [studentId] })).rows;

    return NextResponse.json({ student, skills, recentAttempts });
  } catch (err) {
    console.error('[/api/teacher/students/[id]/report]', err);
    return NextResponse.json({ error: '상세 조회 실패' }, { status: 500 });
  }
}
