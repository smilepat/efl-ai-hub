const { execSync } = require('child_process');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envLines = envLocal.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));

let envArgs = '';
for (const line of envLines) {
  const eqIdx = line.indexOf('=');
  if (eqIdx !== -1) {
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (key === 'NEXTAUTH_URL') continue; // Let Vercel auto-detect VERCEL_URL
    
    // We pass it to Vercel env push or deploy
    // Wait, Vercel doesn't have an env push command?
    // Using --env and --build-env for deployment
    envArgs += ` --env ${key}="${val}" --build-env ${key}="${val}"`;
  }
}

console.log('Deploying to Vercel with environment variables...');
try {
  execSync(`npx vercel --prod --yes ${envArgs}`, { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (e) {
  console.error('Deployment failed:', e.message);
  process.exit(1);
}
