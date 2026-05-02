import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }
    if (!['teacher', 'student'].includes(role)) {
      return NextResponse.json({ error: '유효하지 않은 역할입니다.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
    }

    const db = getDb();

    const existing = (await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] })).rows[0];
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });
    }

    // bcrypt 해싱 (cost factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = `U_${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    await db.execute({ sql:
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
    , args: [id, name, email, hashedPassword, role] });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
