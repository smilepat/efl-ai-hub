import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const db = getDb();
  const studentId = session.user?.id;

  // 1. 학생의 평균 능력치(theta) 산출 (없을 경우 기본값 0.0)
  const thetaRes = await db.execute({
    sql: 'SELECT AVG(theta) as avg_theta FROM skill_diagnostics WHERE student_id = ?',
    args: [studentId ?? '']
  });
  const avgTheta = (thetaRes.rows[0]?.avg_theta as number) ?? 0.0;

  // 2. 학생의 theta와 가장 근접한 난이도(irt_b)를 가진 지문(Passage) 추천
  // 이미 푼 문항은 제외하거나 우선순위를 낮추는 것도 좋지만, 현재는 난이도(diff_score) 기준으로 상위 10개 제공
  const passages = (await db.execute({ sql: `
    SELECT p.id, p.title, p.topic, p.level, p.word_count,
           COUNT(q.id) as q_count,
           AVG(q.irt_b) as avg_irt_b,
           ABS(AVG(q.irt_b) - ?) as diff_score
    FROM passages p
    JOIN questions q ON q.passage_id = p.id
    GROUP BY p.id
    ORDER BY diff_score ASC
    LIMIT 10
  `, args: [avgTheta] })).rows as unknown as Array<{
    id: string; title: string; topic: string;
    level: string; word_count: number; q_count: number;
    avg_irt_b: number; diff_score: number;
  }>;

  return NextResponse.json({ passages, studentTheta: avgTheta });
}
