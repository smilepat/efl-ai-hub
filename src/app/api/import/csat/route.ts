/**
 * /api/import/csat — 수능 기출 문항 관리 API
 *
 * GET  /api/import/csat          — csat_items 목록 반환 (필터: year, type, status)
 * POST /api/import/csat          — 지문+보기 입력으로 questions 테이블에 등록
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { labelCsatItem } from '@/lib/agents/labelAgent';

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year   = searchParams.get('year');
  const type   = searchParams.get('type');
  const status = searchParams.get('status'); // 'pending' | 'completed' | 'all'
  const page   = parseInt(searchParams.get('page') ?? '1');
  const limit  = parseInt(searchParams.get('limit') ?? '20');
  const offset = (page - 1) * limit;

  const db = getDb();

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (year) {
    where += ' AND c.year = ?';
    params.push(parseInt(year));
  }
  if (type) {
    where += ' AND c.question_type = ?';
    params.push(type);
  }
  if (status === 'pending') {
    where += ' AND c.question_id IS NULL';
  } else if (status === 'completed') {
    where += ' AND c.question_id IS NOT NULL';
  }

  const items = (await db.execute({ sql: `
    SELECT c.*, q.prompt as question_prompt
    FROM csat_items c
    LEFT JOIN questions q ON c.question_id = q.id
    ${where}
    ORDER BY c.year DESC, c.item_number ASC
    LIMIT ? OFFSET ?
  `, args: [...params, limit, offset] })).rows;

  const total = ((await db.execute({ sql: `
    SELECT COUNT(*) as cnt FROM csat_items c ${where}
  `, args: params })).rows[0] as unknown as { cnt: number }).cnt;

  // 통계
  const stats = (await db.execute({ sql: `
    SELECT
      COUNT(*) as total,
      COUNT(question_id) as completed,
      COUNT(*) - COUNT(question_id) as pending
    FROM csat_items
  `, args: [] })).rows[0] as unknown as { total: number; completed: number; pending: number };

  // 연도 목록
  const years = (await db.execute({ sql: `
    SELECT DISTINCT year FROM csat_items ORDER BY year DESC
  `, args: [] })).rows as unknown as { year: number }[];

  // 유형 목록
  const types = (await db.execute({ sql: `
    SELECT DISTINCT question_type, COUNT(*) as cnt
    FROM csat_items
    WHERE question_type IS NOT NULL
    GROUP BY question_type
    ORDER BY cnt DESC
  `, args: [] })).rows as unknown as { question_type: string; cnt: number }[];

  return NextResponse.json({ items, total, page, stats, years, types });
}

// ── POST ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    csatId,        // csat_items.id
    passageText,   // 지문 원문
    questionStem,  // 문항 발문 (예: "밑줄 친 부분에 들어갈 말로 가장 적절한 것은?")
    options,       // { a, b, c, d, e } — 보기 5개
    explanation,   // 교사/AI 해설 (optional)
  } = body;

  if (!csatId || !passageText || !questionStem || !options) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();

  // csat_items 조회
  const csat = (await db.execute({ sql: 'SELECT * FROM csat_items WHERE id = ?', args: [csatId] })).rows[0] as unknown as {
    id: string; year: number; item_number: number; question_type: string;
    correct_answer: number; points: number; lexile_estimated: number;
    mapped_skill: string; mapped_irt_b: number;
  } | null;

  if (!csat) {
    return NextResponse.json({ error: 'CSAT item not found' }, { status: 404 });
  }
  if ((csat as any).question_id) {
    return NextResponse.json({ error: 'Already completed' }, { status: 409 });
  }

  // 스킬 라벨 (이미 매핑됨, 재사용)
  const label = labelCsatItem(csat.question_type, csat.points, csat.lexile_estimated);

  // 지문 등록 (passages)
  const passageId = `PASS-CSAT-${csat.year}-${csat.item_number}`;
  await db.execute({ sql: `
    INSERT OR IGNORE INTO passages (id, title, content, level, source, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `, args: [passageId,
    `${csat.year}학년도 수능 ${csat.item_number}번`,
    passageText,
    label.level,
    `수능 ${csat.year}년 ${csat.item_number}번`,
    session.user?.id ?? 'teacher',] });

  // 문항 등록 (questions)
  const questionId = `Q-CSAT-${csat.year}-${csat.item_number}`;
  await db.execute({ sql: `
    INSERT OR IGNORE INTO questions (
      id, passage_id, type, skill, prompt, options,
      answer, explanation,
      irt_a, irt_b, irt_c
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, args: [questionId,
    passageId,
    label.type,
    label.skill,
    questionStem,
    JSON.stringify(options),
    csat.correct_answer ?? 1,
    explanation ?? '',
    1.0,          // irt_a (discrimination) — 기본값
    label.irt_b,
    0.2           // irt_c (guessing)
  ] });

  // csat_items 완성 처리
  await db.execute({ sql: `
    UPDATE csat_items
    SET question_id = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, args: [questionId, csatId] });

  return NextResponse.json({
    success: true,
    questionId,
    passageId,
    skill: label.skill,
    irt_b: label.irt_b,
  });
}
