const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "src/app/api/import/csat/route.ts",
  "src/app/api/passages/route.ts",
  "src/app/api/register/route.ts",
  "src/app/api/student/attempt/route.ts",
  "src/app/api/student/questions/route.ts",
  "src/app/api/student/quiz/route.ts",
  "src/app/student/dashboard/page.tsx",
  "src/app/teacher/dashboard/page.tsx",
  "src/app/teacher/passage/page.tsx",
  "src/app/teacher/questions/page.tsx",
  "src/lib/auth.ts",
];

function fixFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  
  // Fix `as { ... }` or `as Array<{ ... }>` to `as unknown as { ... }`
  content = content.replace(/\]\s+as\s+({[\s\S]*?}|Array<{[\s\S]*?}>|any)/g, '] as unknown as $1');
  content = content.replace(/\)\.rows\s+as\s+({[\s\S]*?}|Array<{[\s\S]*?}>|any)/g, ').rows as unknown as $1');
  content = content.replace(/\)\.rows\[0\]\s+as\s+({[\s\S]*?}|Array<{[\s\S]*?}>|any)/g, ').rows[0] as unknown as $1');

  // Fix remaining db.prepare(...).run(...)
  content = content.replace(/db\.prepare\((`[\s\S]*?`|'[^']*?'|"[^"]*?")\)\.run\(([\s\S]*?)\);/g, (match, sql, args) => {
    return `await db.execute({ sql: ${sql}, args: [${args.trim()}] });`;
  });

  // Fix remaining db.prepare(...).get(...)
  content = content.replace(/db\.prepare\((`[\s\S]*?`|'[^']*?'|"[^"]*?")\)\.get\(([\s\S]*?)\)/g, (match, sql, args) => {
    return `(await db.execute({ sql: ${sql}, args: [${args.trim()}] })).rows[0]`;
  });

  // Fix remaining db.prepare(...).all(...)
  content = content.replace(/db\.prepare\((`[\s\S]*?`|'[^']*?'|"[^"]*?")\)\.all\(([\s\S]*?)\)/g, (match, sql, args) => {
    return `(await db.execute({ sql: ${sql}, args: [${args.trim()}] })).rows`;
  });

  fs.writeFileSync(filepath, content, 'utf-8');
  console.log('Fixed:', filepath);
}

filesToUpdate.forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) fixFile(p);
});
