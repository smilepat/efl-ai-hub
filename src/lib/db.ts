import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'efl_hub.sqlite');

let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const url = process.env.TURSO_DATABASE_URL || `file:${DB_PATH}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  _db = createClient({
    url,
    authToken,
  });

  // DB 스키마 초기화는 별도 스크립트나 마이그레이션 도구를 사용하는 것을 권장하지만,
  // 로컬 파일 DB인 경우를 위해 시도해 볼 수 있습니다.
  // 클라이언트가 비동기이므로 동기 함수에서 직접 실행하지 못하고 프로미스를 던져야 합니다.
  // 안전을 위해 로컬에서 직접 쿼리를 실행해 스키마를 보장한다고 가정합니다.

  return _db;
}

export async function initDbSchema() {
  const db = getDb();
  await db.executeMultiple(`
    -- 📄 지문 DB
    CREATE TABLE IF NOT EXISTS passages (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      text        TEXT NOT NULL,
      topic       TEXT,
      level       TEXT,
      word_count  INTEGER,
      source      TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 📚 어휘 DB (vocab-db 호환)
    CREATE TABLE IF NOT EXISTS vocabulary (
      word_id     TEXT PRIMARY KEY,
      word        TEXT NOT NULL,
      meaning_kr  TEXT,
      cefr        TEXT,
      pos         TEXT,
      example     TEXT,
      irt_b       REAL,
      topic       TEXT
    );

    -- 📝 문항 DB
    CREATE TABLE IF NOT EXISTS questions (
      id          TEXT PRIMARY KEY,
      passage_id  TEXT REFERENCES passages(id),
      word_id     TEXT REFERENCES vocabulary(word_id),
      type        TEXT NOT NULL,
      depth       INTEGER,
      prompt      TEXT NOT NULL,
      options     TEXT,
      answer      TEXT NOT NULL,
      explanation TEXT,
      skill       TEXT,
      irt_b       REAL,
      irt_a       REAL,
      created_by  TEXT DEFAULT 'ai'
    );

    -- 👤 학생 응답 DB
    CREATE TABLE IF NOT EXISTS student_attempts (
      id           TEXT PRIMARY KEY,
      student_id   TEXT NOT NULL,
      question_id  TEXT REFERENCES questions(id),
      selected     TEXT,
      is_correct   INTEGER,
      time_sec     INTEGER,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 🗺 스킬 맵
    CREATE TABLE IF NOT EXISTS skill_map (
      skill_id      TEXT PRIMARY KEY,
      skill_name    TEXT NOT NULL,
      description   TEXT,
      practice_type TEXT
    );

    -- 👥 사용자 (교사/학생)
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 📊 스킬별 진단 결과
    CREATE TABLE IF NOT EXISTS skill_diagnostics (
      id           TEXT PRIMARY KEY,
      student_id   TEXT NOT NULL,
      skill        TEXT NOT NULL,
      correct_rate REAL DEFAULT 0,
      theta        REAL DEFAULT 0,
      total        INTEGER DEFAULT 0,
      correct      INTEGER DEFAULT 0,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, skill)
    );

    -- 💡 맞춤 추천
    CREATE TABLE IF NOT EXISTS recommendations (
      id         TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      type       TEXT,
      ref_id     TEXT,
      reason     TEXT,
      is_done    INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 수능 기출 메타데이터
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
      question_id           TEXT REFERENCES questions(id),
      completed_at          DATETIME,
      created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 🧪 학습자 행동 증거 (LogicFlow Evidence)
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
    );

    CREATE INDEX IF NOT EXISTS idx_evidence_student ON learner_evidence(student_id);

    CREATE INDEX IF NOT EXISTS idx_csat_year ON csat_items(year);
    CREATE INDEX IF NOT EXISTS idx_csat_type ON csat_items(question_type);
    CREATE INDEX IF NOT EXISTS idx_csat_completed ON csat_items(question_id);

    INSERT OR IGNORE INTO skill_map VALUES
      ('SK_01', 'vocabulary',   '어휘 이해 능력',          'vocab'),
      ('SK_02', 'inference',    '내용 추론 능력',           'reading'),
      ('SK_03', 'main_idea',    '주제·요지 파악 능력',      'reading'),
      ('SK_04', 'cohesion',     '글의 흐름·연결 파악 능력', 'reading'),
      ('SK_05', 'structure',    '문장 구조 이해 능력',       'grammar');
  `);
}
