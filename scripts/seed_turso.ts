import { getDb } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
  const db = getDb();
  
  console.log('Seeding demo data to Turso...');

  // ── 데모 유저 ──
  const users = [
    { id: 'U_TEACHER_DEMO', name: '김영어 선생님', email: 'teacher@demo.com', password: 'demo1234', role: 'teacher' },
    { id: 'U_STUDENT_DEMO', name: '이학생',         email: 'student@demo.com', password: 'demo1234', role: 'student' },
  ];

  for (const u of users) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      args: [u.id, u.name, u.email, u.password, u.role]
    });
  }

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

  await db.execute({
    sql: 'INSERT OR IGNORE INTO passages (id, title, text, topic, level, word_count, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [samplePassage.id, samplePassage.title, samplePassage.text, samplePassage.topic, samplePassage.level, samplePassage.word_count, samplePassage.source]
  });

  // ── 샘플 어휘 ──
  const vocabs = [
    { id: 'W_H001', word: 'habit',      meaning: '습관',    cefr: 'B1', pos: 'n', irt_b: -0.5, example: 'Exercise is a good habit.' },
    { id: 'W_H002', word: 'conscious',  meaning: '의식적인', cefr: 'B2', pos: 'adj', irt_b: 0.8, example: 'She made a conscious effort to smile.' },
    { id: 'W_H003', word: 'routine',    meaning: '일과, 루틴', cefr: 'B1', pos: 'n', irt_b: -0.3, example: 'My morning routine includes jogging.' },
    { id: 'W_H004', word: 'researcher', meaning: '연구자', cefr: 'B1', pos: 'n', irt_b: -0.1, example: 'Researchers study human behavior.' },
    { id: 'W_H005', word: 'automatically', meaning: '자동으로', cefr: 'B2', pos: 'adv', irt_b: 0.6, example: 'The door opens automatically.' },
  ];

  for (const v of vocabs) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO vocabulary (word_id, word, meaning_kr, cefr, pos, example, irt_b) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [v.id, v.word, v.meaning, v.cefr, v.pos, v.example, v.irt_b]
    });
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
      prompt: '이 글의 주제로 가장 적절한 창은?',
      options: JSON.stringify({
        A: '습관의 정의와 형성 원리',
        B: '아침 루틴의 중요성',
        C: '연구자들의 실험 방법',
        D: '커피 마시기의 효과',
      }),
      answer: 'A', skill: 'main_idea', irt_b: 0.3, irt_a: 1.2,
    },
  ];

  for (const q of questions) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO questions (id, passage_id, word_id, type, depth, prompt, options, answer, skill, irt_b, irt_a) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [q.id, q.passage_id, q.word_id, q.type, q.depth, q.prompt, q.options, q.answer, q.skill, q.irt_b, q.irt_a]
    });
  }

  console.log('✅ 시딩 완료!');
  console.log('  👩‍🏫 교사: teacher@demo.com / demo1234');
  console.log('  🎓 학생: student@demo.com / demo1234');
}

seed().catch(console.error);
