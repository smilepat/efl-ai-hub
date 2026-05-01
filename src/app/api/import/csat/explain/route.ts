import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { genAI as gemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'teacher') {
    return NextResponse.json({ error: '교사 권한이 필요합니다.' }, { status: 401 });
  }

  try {
    const { passageText, questionStem, options, answer } = await req.json();

    const prompt = `
당신은 고등학교 영어교사입니다. 아래 수능 기출 문항 정보를 바탕으로 학생이 이해하기 쉬운 상세한 해설을 3~4문장으로 작성해주세요.

[지문]
${passageText}

[문항]
${questionStem}

[보기]
1) ${options.a}
2) ${options.b}
3) ${options.c}
4) ${options.d}
5) ${options.e}

[정답]
${answer}번

[출력 형식]
오직 해설 텍스트만 출력하세요. 불필요한 서술은 제외하세요.
`;

    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    
    return NextResponse.json({ success: true, explanation: result.response.text().trim() });
  } catch (err) {
    console.error('[/api/import/csat/explain]', err);
    return NextResponse.json({ error: '해설 생성 실패' }, { status: 500 });
  }
}
