import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // better-sqlite3은 네이티브 모듈이므로 서버 컴포넌트에서만 사용
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
