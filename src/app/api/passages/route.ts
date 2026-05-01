import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'teacher') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }
  const db = getDb();
  const passages = (await db.execute({ sql:
    'SELECT * FROM passages ORDER BY created_at DESC LIMIT 50', args: []
  })).rows;
  return NextResponse.json({ passages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'teacher') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }
  try {
    const { id, title, text, topic, level, word_count, source } = await req.json();
    const db = getDb();
    await db.execute({ sql: `
      INSERT OR REPLACE INTO passages (id, title, text, topic, level, word_count, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, args: [id, title, text, topic, level, word_count, source ?? '직접 입력'] });
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[/api/passages POST]', err);
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }
}
