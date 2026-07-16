import api from "./axios";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Role,
  Permission,
  SharingContent,
  History,
  DashboardStats,
  UserPermissions,
} from "@/types";

export const authApi = {
  signin: (data: { email: string; password: string }) =>
    api.post<ApiResponse>("/auth/signin", data),
  signup: (data: { email: string; password: string; fullname: string }) =>
    api.post<ApiResponse>("/auth/signup", data),
  logout: () => api.post<ApiResponse>("/auth/logout"),
  requestReset: (data: { email: string }) =>
    api.post<ApiResponse>("/auth/request-reset-password", data),
  resetPassword: (data: { token: string; email: string; newPassword: string }) =>
    api.post<ApiResponse>("/auth/reset-password", data),
};

export const userApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<User>>>("/users", { params }),
  getMe: () => api.get<ApiResponse<User>>("/users/me"),
  create: (data: { email: string; password: string; fullname: string; roleId?: string }) =>
    api.post<ApiResponse<User>>("/users", data),
  update: (data: { id: string; email?: string; fullname?: string; roleId?: string }) =>
    api.post<ApiResponse<User>>("/users/update", data),
  remove: (id: string) =>
    api.post<ApiResponse>("/users/delete", { id }),
  updateMe: (data: { email?: string; fullname?: string; avatarUrl?: string }) =>
    api.post<ApiResponse<User>>("/users/me/update", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse>("/users/me/change-password", data),
  adminChangePassword: (data: { id: string; newPassword: string }) =>
    api.post<ApiResponse>("/users/admin-change-password", data),
  assignPermissions: (id: string, permissionIds: string[]) =>
    api.post<ApiResponse>("/users/assign-permissions", { id, permissionIds }),
};

export const roleApi = {
  list: () => api.get<ApiResponse<Role[]>>("/roles"),
  create: (data: { name: string }) =>
    api.post<ApiResponse<Role>>("/roles", data),
  update: (data: { id: string; name?: string; permissionIds?: string[] }) =>
    api.post<ApiResponse<Role>>("/roles/update", data),
  remove: (id: string) =>
    api.post<ApiResponse>("/roles/delete", { id }),
};

export const permissionApi = {
  list: () => api.get<ApiResponse<Permission[]>>("/permissions"),
  create: (data: { name: string }) =>
    api.post<ApiResponse<Permission>>("/permissions", data),
  update: (data: { id: string; name?: string }) =>
    api.post<ApiResponse<Permission>>("/permissions/update", data),
  remove: (id: string) =>
    api.post<ApiResponse>("/permissions/delete", { id }),
};

export const sharingApi = {
  list: () => api.get<ApiResponse<SharingContent[]>>("/sharing-content"),
  myContent: () => api.get<ApiResponse<SharingContent[]>>("/sharing-content/me"),
  getOne: (id: string) =>
    api.post<ApiResponse<SharingContent>>("/sharing-content/get", { id }),
  create: (data: { url: string; itemName: string; icon: string }) =>
    api.post<ApiResponse<SharingContent>>("/sharing-content", data),
  update: (data: { id: string; url?: string; itemName?: string; icon?: string }) =>
    api.post<ApiResponse<SharingContent>>("/sharing-content/update", data),
  remove: (id: string) =>
    api.post<ApiResponse>("/sharing-content/delete", { id }),
  publicByUser: (userId: string) =>
    api.get<ApiResponse<{ user: any; items: SharingContent[] }>>(
      "/sharing-content/public/user",
      { params: { userId } }
    ),
};

export const historyApi = {
  list: () => api.get<ApiResponse<History[]>>("/history"),
  myHistory: () => api.get<ApiResponse<History[]>>("/history/me"),
  recent: (limit?: number) =>
    api.get<ApiResponse<History[]>>("/history/recent", { params: { limit } }),
};

export const dashboardApi = {
  stats: () => api.get<ApiResponse<DashboardStats>>("/dashboard/stats"),
  permissions: () => api.get<ApiResponse<UserPermissions>>("/dashboard/permissions"),
  userPermissions: (userId: string) =>
    api.get<ApiResponse<UserPermissions>>(`/dashboard/permissions/${userId}`),
  usersByRole: () => api.get<ApiResponse<any[]>>("/dashboard/users-by-role"),
  activity: (limit?: number) =>
    api.get<ApiResponse<History[]>>("/dashboard/activity", { params: { limit } }),
};

export const avatarApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiResponse<{ avatarUrl: string }>>("/avatar/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  get: () => api.get<ApiResponse<{ avatarUrl: string | null }>>("/avatar/me"),
  remove: () => api.delete<ApiResponse>("/avatar/me"),
};
