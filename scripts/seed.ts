/**
 * 개발용 데모 데이터 시딩 스크립트
 * 실행: npx tsx scripts/seed.ts
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR  = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'efl_hub.sqlite');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ── 스키마 적용 ──
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS passages (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, text TEXT NOT NULL,
    topic TEXT, level TEXT, word_count INTEGER, source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS vocabulary (
    word_id TEXT PRIMARY KEY, word TEXT NOT NULL, meaning_kr TEXT,
    cefr TEXT, pos TEXT, example TEXT, irt_b REAL, topic TEXT
  );
  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY, passage_id TEXT, word_id TEXT,
    type TEXT NOT NULL, depth INTEGER, prompt TEXT NOT NULL,
    options TEXT, answer TEXT NOT NULL, skill TEXT, irt_b REAL, irt_a REAL,
    created_by TEXT DEFAULT 'ai'
  );
  CREATE TABLE IF NOT EXISTS student_attempts (
    id TEXT PRIMARY KEY, student_id TEXT NOT NULL, question_id TEXT,
    selected TEXT, is_correct INTEGER, time_sec INTEGER,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS skill_map (
    skill_id TEXT PRIMARY KEY, skill_name TEXT NOT NULL,
    description TEXT, practice_type TEXT
  );
`);

// ── 데모 유저 ──
const users = [
  { id: 'U_TEACHER_DEMO', name: '김영어 선생님', email: 'teacher@demo.com', password: 'demo1234', role: 'teacher' },
  { id: 'U_STUDENT_DEMO', name: '이학생',         email: 'student@demo.com', password: 'demo1234', role: 'student' },
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)'
);
for (const u of users) {
  insertUser.run(u.id, u.name, u.email, u.password, u.role);
}

// ── 스킬 맵 ──
db.exec(`
  INSERT OR IGNORE INTO skill_map VALUES
    ('SK_01','vocabulary','어휘 이해 능력','vocab'),
    ('SK_02','inference','내용 추론 능력','reading'),
    ('SK_03','main_idea','주제·요지 파악 능력','reading'),
    ('SK_04','cohesion','글의 흐름·연결 파악 능력','reading'),
    ('SK_05','structure','문장 구조 이해 능력','grammar');
`);

// ── 샘플 지문 ──
const samplePassage = {
  id: 'P_DEMO_001',
  title: 'The Power of Habit',
  text: `Habits are powerful forces in our lives. According to researchers, about 40 percent of our daily actions are habits, not conscious decisions. A habit is a routine or behavior that is performed regularly and, in many cases, automatically. When you wake up in the morning, you probably follow the same routine: brushing your teeth, making coffee, and checking your phone. These are all habits. Understanding how habits form can help us build good ones and break bad ones. The key to changing a habit is understanding the "habit loop" — a cue, a routine, and a reward.`,
  topic: 'psychology',
  level: 'B2',
  word_count: 104,
  source: '수능 기출 변형',
};

db.prepare(
  'INSERT OR IGNORE INTO passages (id, title, text, topic, level, word_count, source) VALUES (?, ?, ?, ?, ?, ?, ?)'
).run(
  samplePassage.id,
  samplePassage.title,
  samplePassage.text,
  samplePassage.topic,
  samplePassage.level,
  samplePassage.word_count,
  samplePassage.source
);

// ── 샘플 어휘 ──
const vocabs = [
  { id: 'W_H001', word: 'habit',      meaning: '습관',    cefr: 'B1', pos: 'n', irt_b: -0.5, example: 'Exercise is a good habit.' },
  { id: 'W_H002', word: 'conscious',  meaning: '의식적인', cefr: 'B2', pos: 'adj', irt_b: 0.8, example: 'She made a conscious effort to smile.' },
  { id: 'W_H003', word: 'routine',    meaning: '일과, 루틴', cefr: 'B1', pos: 'n', irt_b: -0.3, example: 'My morning routine includes jogging.' },
  { id: 'W_H004', word: 'researcher', meaning: '연구자', cefr: 'B1', pos: 'n', irt_b: -0.1, example: 'Researchers study human behavior.' },
  { id: 'W_H005', word: 'automatically', meaning: '자동으로', cefr: 'B2', pos: 'adv', irt_b: 0.6, example: 'The door opens automatically.' },
];

const insertVocab = db.prepare(
  'INSERT OR IGNORE INTO vocabulary (word_id, word, meaning_kr, cefr, pos, example, irt_b) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
for (const v of vocabs) {
  insertVocab.run(v.id, v.word, v.meaning, v.cefr, v.pos, v.example, v.irt_b);
}

// ── 샘플 문항 ──
const questions = [
  {
    id: 'Q_H001', passage_id: 'P_DEMO_001', word_id: 'W_H001',
    type: 'vocab', depth: 2,
    prompt: '다음 중 "habit"의 뜻으로 올바른 것은?',
    options: JSON.stringify({ A: '습관', B: '취미', C: '규칙', D: '목표' }),
    answer: 'A', skill: 'vocabulary', irt_b: -0.5, irt_a: 1.0,
  },
  {
    id: 'Q_H002', passage_id: 'P_DEMO_001', word_id: null,
    type: 'main_idea', depth: 3,
    prompt: '이 글의 주제로 가장 적절한 것은?',
    options: JSON.stringify({
      A: '습관의 정의와 형성 원리',
      B: '아침 루틴의 중요성',
      C: '연구자들의 실험 방법',
      D: '커피 마시기의 효과',
    }),
    answer: 'A', skill: 'main_idea', irt_b: 0.3, irt_a: 1.2,
  },
];

const insertQ = db.prepare(
  'INSERT OR IGNORE INTO questions (id, passage_id, word_id, type, depth, prompt, options, answer, skill, irt_b, irt_a) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
for (const q of questions) {
  insertQ.run(q.id, q.passage_id, q.word_id, q.type, q.depth, q.prompt, q.options, q.answer, q.skill, q.irt_b, q.irt_a);
}

console.log('✅ 시딩 완료!');
console.log('  👩‍🏫 교사: teacher@demo.com / demo1234');
console.log('  🎓 학생: student@demo.com / demo1234');
console.log(`  📄 지문: 1개 | 📝 문항: ${questions.length}개 | 📚 어휘: ${vocabs.length}개`);

db.close();
