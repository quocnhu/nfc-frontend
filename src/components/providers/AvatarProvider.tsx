"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { userApi } from "@/lib/api";

interface AvatarCtx {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  refresh: () => void;
}

const AvatarContext = createContext<AvatarCtx>({
  avatarUrl: null,
  setAvatarUrl: () => {},
  refresh: () => {},
});

/**
 * Stable cache key: keep an existing query as-is, otherwise key on the
 * record's updatedAt so the URL only changes when the avatar actually changes.
 */
function withVersion(url: string | null, updatedAt?: string | null): string | null {
  if (!url) return null;
  if (url.includes("?")) return url;
  if (!updatedAt) return url;
  return `${url}?v=${encodeURIComponent(updatedAt)}`;
}

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() =>
    withVersion(
      (session?.user as any)?.avatarUrl || null,
      (session?.user as any)?.updatedAt || null,
    ),
  );

  const refresh = useCallback(() => {
    if (!userId) return;
    userApi
      .getMe()
      .then((res) => {
        const user = res.data?.data;
        setAvatarUrl(withVersion(user?.avatarUrl || null, user?.updatedAt));
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setAvatar = useCallback((url: string | null) => {
    setAvatarUrl(url);
  }, []);

  return (
    <AvatarContext.Provider value={{ avatarUrl, setAvatarUrl: setAvatar, refresh }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  return useContext(AvatarContext);
}
