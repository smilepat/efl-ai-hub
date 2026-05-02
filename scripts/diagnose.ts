import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  console.log('═══════════════════════════════════════════');
  console.log(' EFL AI Hub — DB 자기진단');
  console.log('═══════════════════════════════════════════');

  // 1. 테이블 목록 & 행 수
  const tables = (await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")).rows;
  console.log(`\n📋 테이블 수: ${tables.length}`);
  for (const t of tables) {
    const c = (await db.execute({ sql: `SELECT COUNT(*) as cnt FROM "${t.name}"`, args: [] })).rows[0];
    console.log(`  ✓ ${String(t.name).padEnd(22)} ${String(c.cnt).padStart(6)} rows`);
  }

  // 2. 사용자
  const users = (await db.execute('SELECT id, name, email, role FROM users')).rows;
  console.log(`\n👤 사용자 (${users.length}명):`);
  for (const u of users) {
    console.log(`  ${u.role === 'teacher' ? '🧑‍🏫' : '🧑‍🎓'} ${u.name} (${u.email}) [${u.role}]`);
  }

  // 3. 지문
  const passages = (await db.execute('SELECT COUNT(*) as cnt FROM passages')).rows[0];
  const csatPassages = (await db.execute("SELECT COUNT(*) as cnt FROM passages WHERE id LIKE 'P_CSAT_%'")).rows[0];
  console.log(`\n📄 지문: 총 ${passages.cnt}개 (CSAT 기출: ${csatPassages.cnt}개)`);

  // 4. 문항
  const questions = (await db.execute('SELECT type, COUNT(*) as cnt FROM questions GROUP BY type ORDER BY cnt DESC')).rows;
  const totalQ = questions.reduce((s, q) => s + Number(q.cnt), 0);
  console.log(`\n❓ 문항: 총 ${totalQ}개`);
  for (const q of questions) {
    console.log(`  ${String(q.type).padEnd(22)} ${String(q.cnt).padStart(4)}개`);
  }

  // 5. 해설 여부
  const withExpl = (await db.execute("SELECT COUNT(*) as cnt FROM questions WHERE explanation IS NOT NULL AND explanation != ''")).rows[0];
  console.log(`\n📝 해설 보유 문항: ${withExpl.cnt}/${totalQ} (${Math.round(Number(withExpl.cnt) / totalQ * 100)}%)`);

  // 6. 학생 응답
  const attempts = (await db.execute('SELECT COUNT(*) as cnt FROM student_attempts')).rows[0];
  const correctAttempts = (await db.execute('SELECT COUNT(*) as cnt FROM student_attempts WHERE is_correct = 1')).rows[0];
  const aCnt = Number(attempts.cnt ?? 0);
  const cCnt = Number(correctAttempts.cnt ?? 0);
  console.log(`\n📊 학생 응답: ${aCnt}건 (정답: ${cCnt}건, 정답률: ${aCnt > 0 ? Math.round(cCnt / aCnt * 100) : 0}%)`);

  // 7. 스킬 진단
  const diag = (await db.execute('SELECT COUNT(*) as cnt FROM skill_diagnostics')).rows[0];
  console.log(`\n🎯 스킬 진단 레코드: ${diag.cnt}건`);

  // 8. 추천
  const recs = (await db.execute('SELECT COUNT(*) as cnt FROM recommendations')).rows[0];
  console.log(`\n🔄 추천 레코드: ${recs.cnt}건`);

  // 9. Evidence
  const ev = (await db.execute('SELECT COUNT(*) as cnt FROM learner_evidence')).rows[0];
  console.log(`\n🧪 행동 증거(Evidence): ${ev.cnt}건`);

  // 10. LogicFlow Tasks
  const tasks = (await db.execute("SELECT COUNT(*) as cnt FROM questions WHERE type LIKE 'logicflow_%'")).rows[0];
  console.log(`\n🧩 LogicFlow Task: ${tasks.cnt}개`);

  // 11. IRT 파라미터 검증
  const irtCheck = (await db.execute('SELECT COUNT(*) as cnt FROM questions WHERE irt_b IS NOT NULL')).rows[0];
  console.log(`\n📐 IRT 난이도 태깅: ${irtCheck.cnt}/${totalQ} (${Math.round(Number(irtCheck.cnt) / totalQ * 100)}%)`);

  console.log('\n═══════════════════════════════════════════');
  console.log(' 진단 완료');
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
