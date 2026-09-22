import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

async function ensureDomainAccount(user: { id?: string; email?: string | null; name?: string | null }) {
  if (!user.email) return;
  const email = user.email.toLowerCase();
  const authUserId = user.id && !user.id.startsWith("dev-") ? user.id : undefined;
  const account = await prisma.userAccount.findUnique({ where: { email } });
  if (account) {
    await prisma.userAccount.update({
      where: { id: account.id },
      data: {
        displayName: user.name || account.displayName,
        ...(authUserId ? { authUserId } : {}),
        ...(adminEmails.has(email) ? { isAdministrator: true } : {}),
      },
    });
    return;
  }

  if (!adminEmails.has(email)) return;

  await prisma.userAccount.create({
    data: {
      email,
      displayName: user.name || email,
      authUserId,
      isAdministrator: true,
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google,
    Credentials({
      id: "dev-login",
      name: "Development login",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        if (process.env.APP_ENV === "production" || process.env.AUTH_DEV_MODE !== "true") return null;
        const email = String(credentials?.email || process.env.AUTH_DEV_EMAIL || "").toLowerCase();
        if (!email || email !== (process.env.AUTH_DEV_EMAIL || email).toLowerCase()) return null;
        return { id: `dev-${email}`, email, name: "Development Administrator" };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await ensureDomainAccount(user);
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (email) {
        const account = await prisma.userAccount.findUnique({ where: { email: email.toLowerCase() } });
        token.domainAccountId = account?.id;
        token.isAdministrator = account?.isAdministrator ?? false;
      } else {
        token.domainAccountId = undefined;
        token.isAdministrator = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.domainAccountId ?? "");
        session.user.isAdministrator = Boolean(token.isAdministrator);
      }
      return session;
    },
  },
});
