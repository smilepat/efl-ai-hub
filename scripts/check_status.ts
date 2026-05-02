import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  // 미해설 문항 수
  const noExpl = await db.execute(
    "SELECT COUNT(*) as cnt FROM questions WHERE (explanation IS NULL OR explanation = '') AND type NOT LIKE 'logicflow_%'"
  );
  console.log('📊 미해설 문항 수:', noExpl.rows[0]);

  // 해설 있는 문항 수
  const hasExpl = await db.execute(
    "SELECT COUNT(*) as cnt FROM questions WHERE explanation IS NOT NULL AND explanation != ''"
  );
  console.log('✅ 해설 보유 문항 수:', hasExpl.rows[0]);

  // LogicFlow task 현황
  const chunking = await db.execute("SELECT COUNT(*) as cnt FROM questions WHERE type = 'logicflow_chunking'");
  const linking = await db.execute("SELECT COUNT(*) as cnt FROM questions WHERE type = 'logicflow_linking'");
  const highlight = await db.execute("SELECT COUNT(*) as cnt FROM questions WHERE type = 'logicflow_highlight'");
  console.log('🧩 Chunking Tasks:', chunking.rows[0]);
  console.log('🔗 Linking Tasks:', linking.rows[0]);
  console.log('🖍️ Highlight Tasks:', highlight.rows[0]);

  // 전체 문항 수
  const total = await db.execute("SELECT COUNT(*) as cnt FROM questions");
  console.log('📝 전체 문항 수:', total.rows[0]);
}

main().catch(console.error);
