import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const db = getDb();
        const user = (await db
          .execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [credentials.email as string] })).rows[0] as unknown as
          | { id: string; name: string; email: string; password: string; role: string }
          | undefined;

        if (!user) return null;

        // bcrypt 해싱 비교 (레거시 평문 호환)
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        const isValid = isHashed
          ? await bcrypt.compare(credentials.password as string, user.password)
          : user.password === credentials.password;
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-production',
});
