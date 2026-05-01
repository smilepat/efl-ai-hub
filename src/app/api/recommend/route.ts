import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { generateRecommendations } from '@/lib/agents/recommendAgent';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: '학생 권한이 필요합니다.' }, { status: 401 });
  }

  const studentId = session.user.id;
  const db = getDb();

  try {
    const skills = (await db.execute({ sql: `SELECT skill, total, correct, correct_rate FROM skill_diagnostics WHERE student_id = ?`, args: [studentId] })).rows;
    
    if (skills.length === 0) {
       return NextResponse.json({ error: '충분한 진단 데이터가 없습니다.' }, { status: 400 });
    }

    const recentWrongs = (await db.execute({ sql: `
      SELECT q.type, q.skill, q.prompt
      FROM student_attempts a
      JOIN questions q ON a.question_id = q.id
      WHERE a.student_id = ? AND a.is_correct = 0
      ORDER BY a.attempted_at DESC LIMIT 5
    `, args: [studentId] })).rows;

    const candidateTasks = (await db.execute({ sql: `
      SELECT id, type, prompt
      FROM questions
      WHERE type LIKE 'logicflow_%'
      ORDER BY RANDOM() LIMIT 5
    ` })).rows;

    const recommendation = await generateRecommendations(skills, recentWrongs, candidateTasks);

    // AI 조언을 DB에 저장
    const recId = `REC_${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    
    // type = 'ai_tip' 로 저장
    await db.execute({ sql: `
      INSERT INTO recommendations (id, student_id, type, reason, is_done)
      VALUES (?, ?, ?, ?, ?)
    `, args: [recId, studentId, 'ai_tip', JSON.stringify(recommendation), 0] });

    return NextResponse.json({ success: true, recommendation });
  } catch (err) {
    console.error('[/api/recommend]', err);
    return NextResponse.json({ error: '추천 생성 실패' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: '학생 권한이 필요합니다.' }, { status: 401 });
  }

  const studentId = session.user.id;
  const db = getDb();

  try {
    // 가장 최근에 생성된 ai_tip 추천 1개 가져오기
    const rec = (await db.execute({ sql: `
      SELECT id, reason, created_at, is_done
      FROM recommendations
      WHERE student_id = ? AND type = 'ai_tip'
      ORDER BY created_at DESC LIMIT 1
    `, args: [studentId] })).rows[0] as any;

    if (!rec) return NextResponse.json({ recommendation: null });

    const data = JSON.parse(rec.reason);
    return NextResponse.json({ recommendation: data, id: rec.id, is_done: !!rec.is_done });
  } catch (err) {
    return NextResponse.json({ error: '추천 조회 실패' }, { status: 500 });
  }
}
