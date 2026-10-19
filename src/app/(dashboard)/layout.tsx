import { cookies } from "next/headers";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AuthGuard } from "@/components/common/AuthGuard";
import { extractApiError } from "@/lib/api-error";

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
        signal: AbortSignal.timeout(5000),
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
    } catch (err) {
      console.error(`[DashboardLayout] permissions fetch failed: ${extractApiError(err, "unknown error")}`);
      initialAccess = null;
    }
  }
  return (
    <AuthGuard>
      <DashboardShell initialAccess={initialAccess}>{children}</DashboardShell>
    </AuthGuard>
  );
}