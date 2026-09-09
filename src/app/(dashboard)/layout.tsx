import { cookies } from "next/headers";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AuthGuard } from "@/components/common/AuthGuard";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type InitialAccess = {
  role?: string;
  permissions?: string[];
  createdBy?: string | null;
  needsUpgrade?: boolean;
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;
  let initialAccess: InitialAccess | null = null;
  if (jwt) {
    try {
      const res = await fetch(`${BACKEND}/api/dashboard/permissions`, {
        headers: { Cookie: `jwt=${jwt}` },
        cache: "no-store",
      });
      if (res.ok) {
        const body = await res.json();
        const d = body?.data;
        initialAccess = {
          role: d?.role,
          permissions: d?.mergedPermissions || [],
          createdBy: d?.user?.createdBy || null,
          needsUpgrade: d?.needsUpgrade,
        };
      }
    } catch {
      initialAccess = null;
    }
  }
  return (
    <AuthGuard>
      <DashboardShell initialAccess={initialAccess}>{children}</DashboardShell>
    </AuthGuard>
  );
}