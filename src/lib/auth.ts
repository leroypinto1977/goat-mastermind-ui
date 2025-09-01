import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { AuthService } from "./auth-service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      requiresPasswordReset?: boolean;
    };
  }
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    requiresPasswordReset?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await AuthService.authenticateUser(
          credentials.email as string,
          credentials.password as string
        );

        if (!result.success || !result.user) {
          return null;
        }

        // Return user with custom properties
        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          requiresPasswordReset: result.requiresPasswordReset || false,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      // Allow all successful authorizations
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.sub as string;
        // @ts-ignore - Adding custom role property
        session.user.role = token.role as string;
        // @ts-ignore - Adding password reset requirement
        session.user.requiresPasswordReset =
          token.requiresPasswordReset as boolean;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore - Adding custom properties
        token.role = user.role;
        // @ts-ignore
        token.requiresPasswordReset = user.requiresPasswordReset;
      }
      return token;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await AuthService.logActivity(user.id, "USER_SIGNIN", {
          method: "credentials",
        });
      }
    },
  },
});
