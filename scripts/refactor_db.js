const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "src/app/api/teacher/students/[id]/report/route.ts",
  "src/app/api/teacher/students/route.ts",
  "src/app/api/student/report/route.ts",
  "src/app/api/student/attempt/route.ts",
  "src/app/api/student/quiz/route.ts",
  "src/app/api/student/questions/route.ts",
  "src/app/api/register/route.ts",
  "src/app/teacher/dashboard/page.tsx",
  "src/app/student/dashboard/page.tsx",
  "src/app/api/recommend/route.ts",
  "src/app/teacher/questions/page.tsx",
  "src/app/api/passages/route.ts",
  "src/app/teacher/passage/page.tsx",
  "src/app/api/import/csat/route.ts",
  "src/app/api/generate/route.ts",
];

function refactorFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  
  // 1. db.prepare('...').get(args) -> (await db.execute({ sql: '...', args: [args] })).rows[0]
  content = content.replace(/db\.prepare\((`[\s\S]*?`|'[^']*?'|"[^"]*?")\)\.get\((.*?)\)/g, (match, sql, args) => {
    const a = args.trim() ? `args: [${args}]` : `args: []`;
    return `(await db.execute({ sql: ${sql}, ${a} })).rows[0]`;
  });

  // 2. db.prepare('...').all(args) -> (await db.execute({ sql: '...', args: [args] })).rows
  content = content.replace(/db\.prepare\((`[\s\S]*?`|'[^']*?'|"[^"]*?")\)\.all\((.*?)\)/g, (match, sql, args) => {
    const a = args.trim() ? `args: [${args}]` : `args: []`;
    return `(await db.execute({ sql: ${sql}, ${a} })).rows`;
  });

  // 3. db.prepare('...').run(args) -> await db.execute({ sql: '...', args: [args] })
  content = content.replace(/db\.prepare\((`[\s\S]*?`|'[^']*?'|"[^"]*?")\)\.run\((.*?)\)/g, (match, sql, args) => {
    const a = args.trim() ? `args: [${args}]` : `args: []`;
    return `await db.execute({ sql: ${sql}, ${a} })`;
  });

  fs.writeFileSync(filepath, content, 'utf-8');
  console.log('Refactored:', filepath);
}

filesToUpdate.forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) refactorFile(p);
});
