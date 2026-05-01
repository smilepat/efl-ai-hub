/**
 * Vercel 환경변수를 .env.local에서 읽어서 production에 설정하는 스크립트
 * 실행: npx tsx scripts/setup_vercel_env.ts
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const vars: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  vars[key] = val;
}

// NEXTAUTH_URL을 프로덕션 URL로 오버라이드
vars['NEXTAUTH_URL'] = 'https://efl-ai-hub.vercel.app';

const requiredKeys = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GEMINI_API_KEY'];

for (const key of requiredKeys) {
  const value = vars[key];
  if (!value) {
    console.error(`❌ ${key}가 .env.local에 없습니다.`);
    continue;
  }

  // 기존 변수 삭제 (무시 가능한 에러)
  try {
    execSync(`npx -y vercel env rm ${key} production --yes`, { stdio: 'pipe' });
    console.log(`🗑 기존 ${key} 삭제`);
  } catch { /* 없으면 무시 */ }

  // 새로 추가 — stdin으로 값 전달
  try {
    execSync(`npx -y vercel env add ${key} production`, {
      input: value,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`✅ ${key} = ${value.slice(0, 30)}...`);
  } catch (err: any) {
    console.error(`❌ ${key} 설정 실패:`, err.stderr?.toString()?.trim());
  }
}

console.log('\n🎉 모든 환경변수 설정 완료!');
