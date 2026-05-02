/**
 * Vercel 환경변수 동기화 스크립트
 * Production에만 설정된 환경변수를 Preview, Development에도 추가
 * 
 * 실행: npx tsx scripts/sync_vercel_env.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ENV_VARS: Record<string, string | undefined> = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: 'https://efl-ai-hub.vercel.app',
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
};

const ENVS = ['preview', 'development'];

async function main() {
  for (const [key, value] of Object.entries(ENV_VARS)) {
    if (!value) {
      console.log(`⚠️  ${key}: 값이 없어 건너뜁니다.`);
      continue;
    }
    for (const env of ENVS) {
      try {
        // Try to remove first (ignore errors if not found)
        try {
          execSync(`npx vercel env rm ${key} ${env} --yes`, { stdio: 'pipe' });
        } catch { /* OK if not found */ }
        
        // Add new value
        const proc = execSync(`echo ${value} | npx vercel env add ${key} ${env}`, {
          stdio: 'pipe',
          shell: 'cmd.exe'
        });
        console.log(`✅ ${key} → ${env}`);
      } catch (e: any) {
        console.log(`❌ ${key} → ${env}: ${e.message?.substring(0, 100)}`);
      }
    }
  }
  console.log('\n✨ 완료!');
}

main();
