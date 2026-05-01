import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const passageId = req.nextUrl.searchParams.get('passageId');
  if (!passageId) return NextResponse.json({ error: 'passageId 필요' }, { status: 400 });

  const db = getDb();
  const questions = (await db.execute({ sql: `
    SELECT q.*, p.title as passage_title, p.text as passage_text
    FROM questions q
    LEFT JOIN passages p ON q.passage_id = p.id
    WHERE q.passage_id = ?
    ORDER BY q.rowid ASC
  `, args: [passageId] })).rows as unknown as Array<{
    id: string; type: string; prompt: string; options: string;
    answer: string; explanation: string; skill: string;
    irt_b: number; passage_title: string; passage_text: string;
  }>;

  return NextResponse.json({ questions });
}
