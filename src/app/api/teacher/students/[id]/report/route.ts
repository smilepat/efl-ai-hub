import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

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

    // Evidence 이력
    const evidence = (await db.execute({ sql: `
      SELECT id, task_type, is_correct, attempt_count, time_ms, score, created_at
      FROM learner_evidence
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, args: [studentId] })).rows;

    // 배정된 추천 목록
    const assignments = (await db.execute({ sql: `
      SELECT id, type, ref_id, reason, is_done, created_at
      FROM recommendations
      WHERE student_id = ? AND type = 'teacher_assign'
      ORDER BY created_at DESC
      LIMIT 10
    `, args: [studentId] })).rows;

    return NextResponse.json({ student, skills, recentAttempts, evidence, assignments });
  } catch (err) {
    console.error('[/api/teacher/students/[id]/report]', err);
    return NextResponse.json({ error: '상세 조회 실패' }, { status: 500 });
  }
}

// POST: 교사가 특정 학생에게 Task/문항을 강제 할당
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'teacher') {
    return NextResponse.json({ error: '교사 로그인이 필요합니다.' }, { status: 401 });
  }

  const studentId = (await params).id;
  const { questionId, reason } = await req.json();
  const db = getDb();

  try {
    const recId = `REC_${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    await db.execute({
      sql: `INSERT INTO recommendations (id, student_id, type, ref_id, reason, is_done)
            VALUES (?, ?, 'teacher_assign', ?, ?, 0)`,
      args: [recId, studentId, questionId, reason ?? '교사 직접 배정'],
    });
    return NextResponse.json({ success: true, id: recId });
  } catch (err) {
    console.error('[/api/teacher/students/[id]/report POST]', err);
    return NextResponse.json({ error: '배정 실패' }, { status: 500 });
  }
}
