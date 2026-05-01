import { getDb } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CSAT_GRAPHDB_DIR = path.resolve(process.cwd(), '../csat-graphdb/data');
const METADATA_CSV = path.join(CSAT_GRAPHDB_DIR, 'csat_all.csv');
const PROCESSED_DIR = path.join(CSAT_GRAPHDB_DIR, 'processed');

// ── 간단한 CSV 파서 ──
function parseCsv(raw: string): Record<string, string>[] {
  const clean = raw.replace(/^\uFEFF/, '');
  return parse(clean, {
    columns: true,
    skip_empty_lines: true,
  });
}

function toInt(v: string): number | null { return v ? Math.round(parseFloat(v)) : null; }
function toReal(v: string): number | null { return v ? parseFloat(v) : null; }

// ── 텍스트 파싱 (발문, 지문, 보기 추출) ──
function parseContent(content: string) {
  let prompt = '';
  let passage = '';
  let optionsText = '';
  let options: Record<string, string> = {};

  // '①'을 찾아 보기 텍스트 분리
  const optIdx = content.indexOf('①');
  if (optIdx !== -1) {
    optionsText = content.slice(optIdx).trim();
    const rest = content.slice(0, optIdx).trim();
    
    // 첫 줄이 발문인 경우가 대부분 ("18. 다음 글의 목적으로...")
    const lines = rest.split('\n');
    const firstLine = lines[0];
    if (/^\s*\d+\.\s*/.test(firstLine) || /\[\d+~\d+\]/.test(firstLine)) {
      prompt = firstLine.replace(/^\s*\d+\.\s*/, '').trim();
      passage = lines.slice(1).join('\n').trim();
    } else {
      passage = rest;
    }
    
    // 보기 파싱
    const optRegex = /([①②③④⑤])([^①②③④⑤]+)/g;
    const keyMap: Record<string, string> = { '①': 'A', '②': 'B', '③': 'C', '④': 'D', '⑤': 'E' };
    let m;
    while ((m = optRegex.exec(optionsText)) !== null) {
      options[keyMap[m[1]]] = m[2].trim();
    }
  } else {
    // 보기가 없는 경우
    passage = content;
  }
  
  return { prompt, passage, options };
}

async function main() {
  console.log('🚀 CSAT GraphDB 전면 통합 스크립트 시작');
  const db = getDb();

  // 1. 메타데이터 읽기
  console.log('📂 메타데이터(csat_all.csv) 로딩 중...');
  if (!fs.existsSync(METADATA_CSV)) {
    console.error(`❌ 메타데이터 파일이 없습니다: ${METADATA_CSV}`);
    process.exit(1);
  }
  const metaRaw = fs.readFileSync(METADATA_CSV, 'utf-8');
  const metaRows = parseCsv(metaRaw);
  console.log(`✅ 메타데이터 ${metaRows.length}건 파싱 완료`);

  // 2. 원문 텍스트 읽기 (우선 수능 고3만)
  const rawDataFile = path.join(PROCESSED_DIR, 'cnsa_en_수능_고3.csv');
  let textMap = new Map<string, any>(); // key: "YYYY-NN"
  
  if (fs.existsSync(rawDataFile)) {
    console.log(`📂 원문 텍스트 로딩 중: ${path.basename(rawDataFile)}`);
    const textRaw = fs.readFileSync(rawDataFile, 'utf-8');
    const textRows = parseCsv(textRaw);
    for (const r of textRows) {
      const year = r['출제년도'];
      const num = r['문항번호'];
      if (year && num) {
        textMap.set(`${year}-${num}`, r);
      }
    }
    console.log(`✅ 원문 텍스트 ${textMap.size}건 매핑 완료`);
  } else {
    console.warn(`⚠️ 원문 텍스트 파일을 찾을 수 없습니다: ${rawDataFile}`);
  }

  let insertedCsat = 0;
  let insertedQuestions = 0;
  let skipped = 0;

  console.log('💾 Turso DB 적재 중...');
  const statements = [];

  for (const row of metaRows) {
    const id = row['id'];
    if (!id || !id.startsWith('CSAT-')) { skipped++; continue; }

    const year = toInt(row['year']);
    const month = toInt(row['month']);
    const item_number = toInt(row['item_number']);
    const qType = row['question_type'] || null;
    const correct_answer = toInt(row['correct_answer']);
    const points = toInt(row['points']) ?? 2;
    const mapped_skill = row['mapped_skill'] || 'vocabulary';
    const mapped_irt_b = toReal(row['mapped_irt_b']) || 0;

    // 매칭되는 텍스트 찾기
    const textRow = textMap.get(`${year}-${item_number}`);
    let question_id = null;

    if (textRow && textRow['문항내용']) {
      const parsed = parseContent(textRow['문항내용']);
      const passageId = `P_CSAT_${year}_${item_number}`;
      question_id = `Q_CSAT_${year}_${item_number}`;

      // 1) Passage 생성
      statements.push({
        sql: `INSERT OR IGNORE INTO passages (id, title, text, topic, level, word_count, source)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          passageId,
          `${year}학년도 수능 ${item_number}번 지문`,
          parsed.passage || '(지문 없음)',
          row['topic_name'] || null,
          'CSAT',
          toInt(row['word_count']),
          '수능 기출'
        ]
      });

      // 2) Question 생성
      const answerKey = ['A','B','C','D','E'][(correct_answer || 1) - 1] || 'A';
      statements.push({
        sql: `INSERT OR IGNORE INTO questions (id, passage_id, type, depth, prompt, options, answer, skill, irt_b, irt_a, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          question_id,
          passageId,
          qType || 'csat',
          3, // depth
          parsed.prompt || '다음 문항에 답하시오.',
          JSON.stringify(parsed.options),
          answerKey,
          mapped_skill,
          mapped_irt_b,
          toReal(row['discrimination']) || 1.0,
          'system'
        ]
      });
      insertedQuestions++;
    }

    // 3) CSAT Item 생성
    statements.push({
      sql: `INSERT OR IGNORE INTO csat_items (
        id, year, month, item_number, exam_type, question_type,
        correct_answer, answer_rate, discrimination, points,
        word_count, lexile_estimated, text_complexity_score,
        mapped_skill, mapped_irt_b, question_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, year, month, item_number, '수능', qType,
        correct_answer, toReal(row['answer_rate']), toReal(row['discrimination']), points,
        toInt(row['word_count']), toInt(row['lexile_estimated']), toReal(row['text_complexity_score']),
        mapped_skill, mapped_irt_b, question_id
      ]
    });
    
    // Update if exists (to ensure question_id links properly if we re-run)
    statements.push({
      sql: `UPDATE csat_items SET question_id = ? WHERE id = ? AND question_id IS NULL`,
      args: [question_id, id]
    });

    insertedCsat++;
  }

  // Batch execute
  // libSQL client can handle up to maybe 100-200 statements per batch smoothly over network.
  const BATCH_SIZE = 100;
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const chunk = statements.slice(i, i + BATCH_SIZE);
    await db.batch(chunk, 'write');
    process.stdout.write(`\r진행률: ${Math.min(i + BATCH_SIZE, statements.length)} / ${statements.length} 완료...`);
  }

  console.log(`\n🎉 CSAT GraphDB 통합 적재 완료!`);
  console.log(`  ✅ CSAT 메타데이터 처리: ${insertedCsat}건`);
  console.log(`  ✅ 자동 생성된 문항(Questions) 및 지문(Passages): ${insertedQuestions}건`);
  console.log(`  ⏭ 건너뜀: ${skipped}건`);
}

main().catch(console.error);
