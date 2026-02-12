import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, email: true, name: true, password: true, role: true, supplierId: true, organizationId: true, emailVerified: true, verificationCode: true },
        });

        if (!user) {
          return null;
        }

        // Sadece e-posta doğrulama akışından geçen (verificationCode alanı dolu) ama henüz doğrulamamış kullanıcıları engelle
        // Seed/admin veya eski kullanıcılar (verificationCode null) giriş yapabilir
        if (user.verificationCode && user.emailVerified === false) {
          return null; // Kayıt sonrası e-postasını doğrulamamış
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          supplierId: user.supplierId || null,
          organizationId: user.organizationId || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.supplierId = user.supplierId || null;
        token.organizationId = user.organizationId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.supplierId = token.supplierId as string | null;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
  },
};

// Helper functions for role-based access control
export function canViewFactoryPrice(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canEditFactoryPrice(role: UserRole | undefined): boolean {
  return role === "ADMIN";
}

export function canGenerateFactoryReport(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return role === "ADMIN";
}

export function isSupplierRole(role: UserRole | undefined): boolean {
  return role === "SUPPLIER";
}
