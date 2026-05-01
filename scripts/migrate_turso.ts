/**
 * Turso 원격 DB에 누락된 테이블을 마이그레이션하는 스크립트
 * 실행: npx tsx scripts/migrate_turso.ts
 */
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 환경변수가 필요합니다.');
    return;
  }

  console.log(`🔗 Turso 연결: ${url}`);
  const db = createClient({ url, authToken });

  // 테이블 존재 확인
  const tables = (await db.execute("SELECT name FROM sqlite_master WHERE type='table'")).rows;
  console.log('📋 현재 테이블:', tables.map(t => t.name).join(', '));

  // learner_evidence 테이블 추가
  console.log('\n🧪 learner_evidence 테이블 마이그레이션...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS learner_evidence (
      id            TEXT PRIMARY KEY,
      student_id    TEXT NOT NULL,
      question_id   TEXT REFERENCES questions(id),
      task_type     TEXT NOT NULL,
      is_correct    INTEGER DEFAULT 0,
      attempt_count INTEGER DEFAULT 1,
      time_ms       INTEGER DEFAULT 0,
      click_log     TEXT,
      score         REAL DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_evidence_student ON learner_evidence(student_id)`);
  console.log('✅ learner_evidence 생성 완료');

  // 최종 확인
  const tablesAfter = (await db.execute("SELECT name FROM sqlite_master WHERE type='table'")).rows;
  console.log('\n📋 마이그레이션 후 테이블:', tablesAfter.map(t => t.name).join(', '));
  console.log('🎉 마이그레이션 완료!');
}

main().catch(console.error);
