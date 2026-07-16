"use client";

import { useSession } from "next-auth/react";

interface Props {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: Props) {
  const { data: session } = useSession();
  const permissions = (session?.user as any)?.permissions || [];
  return <>{permissions.includes(permission) ? children : fallback}</>;
}
