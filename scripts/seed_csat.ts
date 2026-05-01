/**
 * seed_csat.ts
 * csat-graphdb GitHub CSV → EFL Hub SQLite csat_items 테이블 일괄 적재
 *
 * 실행: npx tsx scripts/seed_csat.ts
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { labelCsatItem } from '../src/lib/agents/labelAgent';

const CSV_URL =
  'https://raw.githubusercontent.com/smilepat/csat-graphdb/main/data/csat_all.csv';

const DB_DIR  = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'efl_hub.sqlite');

// ── CSV 다운로드 ─────────────────────────────────────────────────────────────
function fetchCsv(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── CSV 파싱 (헤더 기반) ──────────────────────────────────────────────────────
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw
    .replace(/^\uFEFF/, '')   // BOM 제거
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];
  const headers = lines[0].split(',');

  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]));
  });
}

// ── 숫자 변환 헬퍼 ───────────────────────────────────────────────────────────
const toInt  = (v: string): number | null => v === '' ? null : Math.round(parseFloat(v));
const toReal = (v: string): number | null => v === '' ? null : parseFloat(v);

// ── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📥 GitHub에서 CSV 다운로드 중...');
  const raw = await fetchCsv(CSV_URL);
  const rows = parseCsv(raw);
  console.log(`✅ ${rows.length}건 파싱 완료`);

  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');  // csat_items 적재 시 questions 없어도 됨

  // csat_items 테이블 생성 (없으면)
  db.exec(`
    CREATE TABLE IF NOT EXISTS csat_items (
      id                    TEXT PRIMARY KEY,
      year                  INTEGER NOT NULL,
      month                 INTEGER NOT NULL,
      item_number           INTEGER NOT NULL,
      exam_type             TEXT DEFAULT '수능',
      question_type         TEXT,
      correct_answer        INTEGER,
      answer_rate           REAL,
      discrimination        REAL,
      points                INTEGER,
      word_count            INTEGER,
      sentence_count        INTEGER,
      avg_sentence_length   REAL,
      lexile_estimated      INTEGER,
      text_complexity_score REAL,
      elementary_ratio      REAL,
      intermediate_ratio    REAL,
      advanced_ratio        REAL,
      type_token_ratio      REAL,
      mapped_skill          TEXT,
      mapped_irt_b          REAL,
      question_id           TEXT,
      completed_at          DATETIME,
      created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_csat_year ON csat_items(year);
    CREATE INDEX IF NOT EXISTS idx_csat_type ON csat_items(question_type);
    CREATE INDEX IF NOT EXISTS idx_csat_completed ON csat_items(question_id);
  `);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO csat_items (
      id, year, month, item_number, exam_type,
      question_type, correct_answer, answer_rate, discrimination, points,
      word_count, sentence_count, avg_sentence_length,
      lexile_estimated, text_complexity_score,
      elementary_ratio, intermediate_ratio, advanced_ratio, type_token_ratio,
      mapped_skill, mapped_irt_b
    ) VALUES (
      @id, @year, @month, @item_number, @exam_type,
      @question_type, @correct_answer, @answer_rate, @discrimination, @points,
      @word_count, @sentence_count, @avg_sentence_length,
      @lexile_estimated, @text_complexity_score,
      @elementary_ratio, @intermediate_ratio, @advanced_ratio, @type_token_ratio,
      @mapped_skill, @mapped_irt_b
    )
  `);

  let inserted = 0;
  let skipped  = 0;

  const insertMany = db.transaction((rows: Record<string, string>[]) => {
    for (const row of rows) {
      const id = row['id'];
      if (!id || !id.startsWith('CSAT-')) { skipped++; continue; }

      const qType  = row['question_type'] || null;
      const pts    = toInt(row['points']) ?? 2;
      const lexile = toInt(row['lexile_estimated']);
      const label  = labelCsatItem(qType, pts, lexile);

      insert.run({
        id,
        year:                  toInt(row['year']),
        month:                 toInt(row['month']),
        item_number:           toInt(row['item_number']),
        exam_type:             row['exam_type'] || '수능',
        question_type:         qType,
        correct_answer:        toInt(row['correct_answer']),
        answer_rate:           toReal(row['answer_rate']),
        discrimination:        toReal(row['discrimination']),
        points:                pts,
        word_count:            toInt(row['word_count']),
        sentence_count:        toInt(row['sentence_count']),
        avg_sentence_length:   toReal(row['avg_sentence_length']),
        lexile_estimated:      lexile,
        text_complexity_score: toReal(row['text_complexity_score']),
        elementary_ratio:      toReal(row['elementary_ratio']),
        intermediate_ratio:    toReal(row['intermediate_ratio']),
        advanced_ratio:        toReal(row['advanced_ratio']),
        type_token_ratio:      toReal(row['type_token_ratio']),
        mapped_skill:          label.skill,
        mapped_irt_b:          label.irt_b,
      });
      inserted++;
    }
  });

  insertMany(rows);

  console.log(`\n🎉 완료!`);
  console.log(`  ✅ 삽입: ${inserted}건`);
  console.log(`  ⏭  건너뜀: ${skipped}건`);

  // 통계 출력
  const stats = db.prepare(`
    SELECT question_type, COUNT(*) as cnt, AVG(mapped_irt_b) as avg_b
    FROM csat_items
    GROUP BY question_type
    ORDER BY cnt DESC
  `).all() as { question_type: string; cnt: number; avg_b: number }[];

  console.log('\n📊 유형별 분포:');
  stats.forEach(({ question_type, cnt, avg_b }) =>
    console.log(`  ${(question_type ?? '(미분류)').padEnd(10)} ${cnt}건  avg irt_b=${avg_b?.toFixed(2)}`)
  );

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
