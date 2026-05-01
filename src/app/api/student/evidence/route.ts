import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * POST /api/student/evidence
 * 마이크로 태스크(ChunkingTask 등)의 상세 행동 데이터를 수집하고,
 * skill_diagnostics의 structure 마스터리를 더 정밀하게 업데이트합니다.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: '학생 권한이 필요합니다.' }, { status: 401 });
  }

  try {
    const {
      questionId,
      taskType,
      isCorrect,
      attemptCount,
      timeMs,
      clickLog,   // JSON: [{ wordIndex, timestamp }, ...]
      score,      // 0.0 ~ 1.0
    } = await req.json();

    const studentId = session.user.id;
    const db = getDb();

    // 1. learner_evidence 테이블에 행동 데이터 저장
    const evidenceId = `EV_${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    await db.execute({
      sql: `INSERT INTO learner_evidence (id, student_id, question_id, task_type, is_correct, attempt_count, time_ms, click_log, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        evidenceId,
        studentId,
        questionId ?? null,
        taskType ?? 'chunking',
        isCorrect ? 1 : 0,
        attemptCount ?? 1,
        timeMs ?? 0,
        typeof clickLog === 'string' ? clickLog : JSON.stringify(clickLog ?? []),
        score ?? (isCorrect ? 1.0 : 0.0),
      ],
    });

    // 2. skill_diagnostics 의 'structure' 마스터리를 Evidence 기반으로 정밀 업데이트
    //    마이크로 과업의 정확도(score)를 반영하여 theta를 조정
    const skill = 'structure'; // chunking 과업은 structure 스킬에 매핑
    const thetaDelta = isCorrect ? 0.15 : -0.1; // 맞으면 올리고, 틀리면 내림

    await db.execute({
      sql: `INSERT INTO skill_diagnostics (id, student_id, skill, total, correct, correct_rate, theta, updated_at)
            VALUES (?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(student_id, skill) DO UPDATE SET
              total        = total + 1,
              correct      = correct + excluded.correct,
              correct_rate = CAST(correct + excluded.correct AS REAL) / (total + 1),
              theta        = theta + ?,
              updated_at   = CURRENT_TIMESTAMP`,
      args: [
        `SD_${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`,
        studentId,
        skill,
        isCorrect ? 1 : 0,
        isCorrect ? 1.0 : 0.0,
        thetaDelta,
        thetaDelta,
      ],
    });

    return NextResponse.json({
      success: true,
      evidenceId,
      message: '행동 데이터가 기록되었습니다.',
    });
  } catch (err) {
    console.error('[/api/student/evidence]', err);
    return NextResponse.json({ error: '증거 데이터 저장 실패' }, { status: 500 });
  }
}

/**
 * GET /api/student/evidence
 * 현재 학생의 최근 Evidence 기록 조회
 */
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: '학생 권한이 필요합니다.' }, { status: 401 });
  }

  const db = getDb();
  const rows = (await db.execute({
    sql: `SELECT * FROM learner_evidence WHERE student_id = ? ORDER BY created_at DESC LIMIT 20`,
    args: [session.user.id],
  })).rows;

  return NextResponse.json({ evidence: rows });
}
