import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: '학생 권한이 필요합니다.' }, { status: 401 });
  }

  const db = getDb();
  const studentId = session.user.id;

  try {
    // 최근 오답 문항 + 해설 + 지문 제목
    const wrongNotes = (await db.execute({
      sql: `
        SELECT 
          a.id as attempt_id,
          a.selected,
          a.time_sec,
          a.attempted_at,
          q.id as question_id,
          q.prompt,
          q.options,
          q.answer,
          q.explanation,
          q.type,
          q.skill,
          q.irt_b,
          p.title as passage_title,
          p.text as passage_text
        FROM student_attempts a
        JOIN questions q ON a.question_id = q.id
        LEFT JOIN passages p ON q.passage_id = p.id
        WHERE a.student_id = ? AND a.is_correct = 0
        ORDER BY a.attempted_at DESC
        LIMIT 30
      `,
      args: [studentId],
    })).rows;

    // 스킬별 오답 수 집계
    const skillBreakdown = (await db.execute({
      sql: `
        SELECT q.skill, COUNT(*) as wrong_count
        FROM student_attempts a
        JOIN questions q ON a.question_id = q.id
        WHERE a.student_id = ? AND a.is_correct = 0
        GROUP BY q.skill
        ORDER BY wrong_count DESC
      `,
      args: [studentId],
    })).rows;

    // 관련 LogicFlow Task 추천 (structure 약점이면 chunking)
    const relatedTasks = (await db.execute({
      sql: `
        SELECT id, type, prompt
        FROM questions
        WHERE type LIKE 'logicflow_%'
        ORDER BY RANDOM()
        LIMIT 3
      `,
    })).rows;

    return NextResponse.json({ wrongNotes, skillBreakdown, relatedTasks });
  } catch (err) {
    console.error('[/api/student/wrong-notes]', err);
    return NextResponse.json({ error: '오답 노트 조회 실패' }, { status: 500 });
  }
}
