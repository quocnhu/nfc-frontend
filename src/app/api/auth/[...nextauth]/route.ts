import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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

        const signinRes = await fetch(`${BACKEND_URL}/auth/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!signinRes.ok) return null;

        const backendSetCookie = signinRes.headers.get("set-cookie");
        const jwtValue = backendSetCookie?.split(";")[0]?.split("=")[1] || "";

        const permRes = await fetch(`${BACKEND_URL}/dashboard/permissions`, {
          headers: { Cookie: `jwt=${jwtValue}` },
        });

        const permData = await permRes.json();
        const data = permData?.data;

        if (!data?.user) return null;

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.fullname,
          role: data.role,
          permissions: data.mergedPermissions || [],
          jwt: jwtValue,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60,
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.jwt = (user as any).jwt;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || (token as any).id || "";
        (session.user as any).role = (token as any).role || "";
        (session.user as any).permissions = (token as any).permissions ?? [];
        (session as any).jwt = (token as any).jwt || "";
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
