import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db, ensureDbReady } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await ensureDbReady();
        const user = db.users.getByEmail(credentials.email);
        if (!user || user.status === "suspended") return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          image: user.avatar || null,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.plan = (user as { plan?: string }).plan;
      }
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.plan = session.plan ?? token.plan;
        token.image = session.image ?? token.image;
      }
      // Refresh from DB periodically
      if (token.id) {
        await ensureDbReady();
        const dbUser = db.users.getById(token.id as string);
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.name = dbUser.name;
          token.image = dbUser.avatar || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { plan?: string }).plan = token.plan as string;
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "migsmartcard-dev-secret-change-in-prod",
};
