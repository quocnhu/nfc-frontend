import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      userType?: string;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
    jwt?: string;
  }

  interface User {
    role: string;
    permissions: string[];
    jwt: string;
    userType?: string;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    jwt?: string;
    userType?: string;
    avatarUrl?: string | null;
  }
}
