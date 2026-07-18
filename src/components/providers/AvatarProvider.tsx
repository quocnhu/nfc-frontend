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

function cacheBust(url: string | null): string | null {
  if (!url) return null;
  const base = url.split("?")[0];
  return `${base}?t=${Date.now()}`;
}

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    cacheBust((session?.user as any)?.avatarUrl || null),
  );

  const refresh = useCallback(() => {
    if (!userId) return;
    userApi
      .getMe()
      .then((res) => {
        const url = res.data?.data?.avatarUrl || null;
        setAvatarUrl(cacheBust(url));
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setAvatar = useCallback((url: string | null) => {
    setAvatarUrl(cacheBust(url));
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
