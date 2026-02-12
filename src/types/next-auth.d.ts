import "next-auth";

export type UserRole = "ADMIN" | "MANAGER" | "USER" | "SUPPLIER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      supplierId?: string | null;
      organizationId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    supplierId?: string | null;
    organizationId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    supplierId?: string | null;
    organizationId?: string | null;
  }
}
