import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzePassage } from '@/lib/agents/analyzeAgent';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'teacher') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json(
        { error: '지문이 너무 짧습니다. 50자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    const analysis = await analyzePassage(text.trim());
    return NextResponse.json({ success: true, analysis });

  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('[/api/analyze]', err);
    return NextResponse.json({ error: `분석 실패: ${message}` }, { status: 500 });
  }
}
