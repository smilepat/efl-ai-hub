import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: '학생 권한이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  const db = getDb();

  try {
    if (taskId) {
      const task = (await db.execute({
        sql: `SELECT * FROM questions WHERE id = ? AND type LIKE 'logicflow_%'`,
        args: [taskId]
      })).rows[0];

      if (!task) return NextResponse.json({ error: '과업을 찾을 수 없습니다.' }, { status: 404 });
      return NextResponse.json({ task });
    }

    // 모든 Task 가져오기 (필요시)
    const tasks = (await db.execute({
      sql: `SELECT id, type, prompt FROM questions WHERE type LIKE 'logicflow_%' LIMIT 50`
    })).rows;
    return NextResponse.json({ tasks });

  } catch (err) {
    console.error('[/api/student/tasks]', err);
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }
}
