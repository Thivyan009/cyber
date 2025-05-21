import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set in environment variables");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password required");
          }

          console.log("Attempting to find user:", credentials.email);

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("User not found:", credentials.email);
            throw new Error("Invalid email or password");
          }

          console.log("User found, verifying password");

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            console.log("Invalid password for user:", credentials.email);
            throw new Error("Invalid email or password");
          }

          console.log("Password verified, returning user");

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        // Only update token if user exists (during sign in)
        if (user) {
          console.log("Setting JWT token:", { userId: user.id });
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;

          // If this is a sign-in, fetch complete user data from database
          if (account) {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { company: true, role: true, bio: true },
            });

            if (dbUser) {
              token.company = dbUser.company;
              token.role = dbUser.role;
              token.bio = dbUser.bio;
            }
          }
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return the unchanged token on error
        return token;
      }
    },
    async session({ session, token }) {
      try {
        // Initialize session.user if it's not already defined
        if (!session.user) {
          session.user = {};
        }

        console.log("Setting session:", { userId: token.id });

        if (token) {
          // Safely assign token properties to session.user
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;

          if (token.company) {
            session.user.company = token.company as string;
          }

          if (token.role) {
            session.user.role = token.role as string;
          }

          if (token.bio) {
            session.user.bio = token.bio as string;
          }
        }

        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("NextAuth error:", { code, metadata });
    },
    warn(code) {
      console.warn("NextAuth warning:", code);
    },
    debug(code, metadata) {
      console.log("NextAuth debug:", { code, metadata });
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
