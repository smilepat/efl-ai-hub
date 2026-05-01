import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'teacher') {
    return NextResponse.json({ error: '교사 로그인이 필요합니다.' }, { status: 401 });
  }

  const db = getDb();

  try {
    // 학생 목록과 가장 취약한 스킬(오답률이 높은) 조회
    const students = (await db.execute({ sql: `
      SELECT 
        u.id, u.name, u.email,
        (SELECT COUNT(*) FROM student_attempts WHERE student_id = u.id) as attempt_count,
        (SELECT skill FROM skill_diagnostics 
         WHERE student_id = u.id AND total > 0 
         ORDER BY correct_rate ASC LIMIT 1) as weakest_skill
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.name ASC
    `, args: [] })).rows as any[];

    return NextResponse.json({ students });
  } catch (err) {
    console.error('[/api/teacher/students]', err);
    return NextResponse.json({ error: '학생 목록 조회 실패' }, { status: 500 });
  }
}
