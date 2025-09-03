import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

console.log("Initializing NextAuth...");

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req): Promise<any> {
        console.log("🔐 Attempting login for:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: email,
            },
          });

          if (!user) {
            console.log("❌ User not found:", email);
            return null;
          }

          if (!user.password) {
            console.log("❌ User has no password set:", email);
            return null;
          }

          if (user.status !== "ACTIVE") {
            console.log("❌ User account is inactive:", email);
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);

          if (!isValid) {
            console.log("❌ Invalid password for:", email);
            return null;
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          console.log("✅ Login successful for:", email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("❌ Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      // Always fetch the latest isFirstLogin status from DB on every token refresh
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { isFirstLogin: true },
        });
        token.isFirstLogin = dbUser?.isFirstLogin ?? false;
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.isFirstLogin = token.isFirstLogin;
        session.user.requiresPasswordReset = token.isFirstLogin;
      }
      return session;
    },
    async signIn({ user, account, profile }: any) {
      try {
        if (user?.id) {
          console.log(`✅ SignIn callback completed for user: ${user.email}`);
        }
        return true;
      } catch (error) {
        console.error("❌ Error in signIn callback:", error);
        return true; // Don't block login if cleanup fails
      }
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
