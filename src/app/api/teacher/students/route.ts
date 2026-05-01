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
    // 학생 목록 + 취약 스킬 + 정답률
    const students = (await db.execute({ sql: `
      SELECT 
        u.id, u.name, u.email,
        (SELECT COUNT(*) FROM student_attempts WHERE student_id = u.id) as attempt_count,
        (SELECT COUNT(*) FROM student_attempts WHERE student_id = u.id AND is_correct = 1) as correct_count,
        (SELECT skill FROM skill_diagnostics 
         WHERE student_id = u.id AND total > 0 
         ORDER BY correct_rate ASC LIMIT 1) as weakest_skill,
        (SELECT theta FROM skill_diagnostics 
         WHERE student_id = u.id AND total > 0 
         ORDER BY correct_rate ASC LIMIT 1) as weakest_theta
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.name ASC
    `, args: [] })).rows as any[];

    // 반 전체 스킬 평균
    const classSkills = (await db.execute({ sql: `
      SELECT 
        skill,
        ROUND(AVG(correct_rate), 3) as avg_rate,
        SUM(total) as total_attempts,
        SUM(correct) as total_correct,
        COUNT(DISTINCT student_id) as student_count
      FROM skill_diagnostics
      WHERE total > 0
      GROUP BY skill
      ORDER BY avg_rate ASC
    `, args: [] })).rows;

    // 반 전체 LogicFlow Evidence 요약
    const evidenceSummary = (await db.execute({ sql: `
      SELECT 
        task_type,
        COUNT(*) as total,
        SUM(is_correct) as correct,
        ROUND(AVG(score), 2) as avg_score,
        ROUND(AVG(time_ms) / 1000.0, 1) as avg_time_sec
      FROM learner_evidence
      GROUP BY task_type
    `, args: [] })).rows;

    return NextResponse.json({ students, classSkills, evidenceSummary });
  } catch (err) {
    console.error('[/api/teacher/students]', err);
    return NextResponse.json({ error: '학생 목록 조회 실패' }, { status: 500 });
  }
}
