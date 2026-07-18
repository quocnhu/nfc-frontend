"use client";

import { useSession } from "next-auth/react";
import { userdataApi } from "@/lib/api";
import { useAvatar } from "@/components/providers/AvatarProvider";

/**
 * Single convention for all avatar uploads.
 * Both Profile page and Users table MUST use this hook.
 *
 * It does two things after every successful upload:
 *   1. Updates AvatarContext (shared state → DashboardShell, Profile, etc.)
 *   2. Updates NextAuth JWT (session-based pages)
 */
export function useAvatarSync() {
  const { data: session, update } = useSession();
  const currentUserId = (session?.user as any)?.id as string | undefined;
  const { setAvatarUrl } = useAvatar();

  /** Push new avatar to both AvatarContext AND NextAuth session */
  const syncAvatar = async (avatarUrl: string) => {
    setAvatarUrl(avatarUrl);
    await update({ avatarUrl });
  };

  /** Profile page – upload own avatar (self-upload endpoint) */
  const uploadOwnAvatar = async (
    file: File,
    onProgress?: (percent: number) => void,
  ) => {
    const res = await userdataApi.uploadAvatar(file, onProgress);
    const avatarUrl = res.data?.data?.avatarUrl;
    if (!avatarUrl) throw new Error("Upload failed");
    await syncAvatar(avatarUrl);
    return avatarUrl;
  };

  /** Users table – upload avatar for a target user (admin endpoint) */
  const uploadAvatarForUser = async (
    userId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ) => {
    const res = await userdataApi.adminUploadAvatar(userId, file, onProgress);
    const avatarUrl = res.data?.data?.avatarUrl;
    if (!avatarUrl) throw new Error("Upload failed");
    if (userId === currentUserId) await syncAvatar(avatarUrl);
    return avatarUrl;
  };

  /** Pick an existing avatar from history */
  const selectAvatar = async (userId: string, filename: string) => {
    const res = await userdataApi.selectAdminAvatar(userId, filename);
    const avatarUrl = res.data?.data?.avatarUrl;
    if (!avatarUrl) throw new Error("Select failed");
    if (userId === currentUserId) await syncAvatar(avatarUrl);
    return avatarUrl;
  };

  return {
    uploadOwnAvatar,
    uploadAvatarForUser,
    selectAvatar,
    currentUserId,
  };
}
