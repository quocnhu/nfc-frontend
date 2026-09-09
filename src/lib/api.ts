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
  RequestCounts,
  UserPermissions,
  Folder,
  UploadedFile,
  QRCode,
  Translation,
  SuspiciousActivity,
  Payment,
  PaymentStatus,
  Plan,
  Subscription,
  UserSubscription,
} from "@/types";

export const authApi = {
  signin: (data: { email: string; password: string }) =>
    api.post<ApiResponse>("/auth/signin", data),
  signup: (data: { email: string; password: string; fullname: string; userType?: string }) =>
    api.post<ApiResponse>("/auth/signup", data),
  logout: () => api.post<ApiResponse>("/auth/logout"),
  requestReset: (data: { email: string }) =>
    api.post<ApiResponse>("/auth/request-reset-password", data),
  resetPassword: (data: { token: string; email: string; newPassword: string }) =>
    api.post<ApiResponse>("/auth/reset-password", data),
  registrationStatus: () =>
    api.get<ApiResponse<{ enabled: boolean }>>("/auth/registration-status"),
  verifyEmail: (data: { token: string; email: string }) =>
    api.post<ApiResponse>("/auth/verify-email", data),
  resendVerification: (data: { email: string }) =>
    api.post<ApiResponse>("/auth/resend-verification", data),
};

export const userApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<User>>>("/users", { params }),
  getMe: () => api.get<ApiResponse<User>>("/users/me"),
  create: (data: { email: string; password: string; fullname: string; roleId?: string }) =>
    api.post<ApiResponse<User>>("/users", data),
  update: (data: { id: string; email?: string; fullname?: string; roleId?: string; newPassword?: string; avatarUrl?: string; isEmailVerified?: boolean; expiresAt?: string | null }) =>
    api.post<ApiResponse<User>>("/users/update", data),
  remove: (id: string) =>
    api.post<ApiResponse>("/users/delete", { id }),
  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse>("/users/bulk-delete", { ids }),
  updateMe: (data: { email?: string; fullname?: string; avatarUrl?: string }) =>
    api.post<ApiResponse<User>>("/users/me/update", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse>("/users/me/change-password", data),
  adminChangePassword: (data: { id: string; newPassword: string }) =>
    api.post<ApiResponse>("/users/admin-change-password", data),
  assignPermissions: (id: string, permissionIds: string[]) =>
    api.post<ApiResponse>("/users/assign-permissions", { id, permissionIds }),
  unlock: (id: string) =>
    api.post<ApiResponse>("/users/unlock", { id }),
  toggleStatus: (id: string) =>
    api.post<ApiResponse<User>>("/users/toggle-status", { id }),
};

export const roleApi = {
  list: () => api.get<ApiResponse<Role[]>>("/roles"),
  create: (data: { name: string }) =>
    api.post<ApiResponse<Role>>("/roles", data),
  update: (data: { id: string; name?: string; permissionIds?: string[] }) =>
    api.post<ApiResponse<Role>>("/roles/update", data),
  remove: (id: string) =>
    api.post<ApiResponse>("/roles/delete", { id }),
  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse>("/roles/bulk-delete", { ids }),
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
  create: (data: { url: string; itemName: string; icon: string; targetUserId?: string }) =>
    api.post<ApiResponse<SharingContent>>("/sharing-content", data),
  update: (data: { id: string; url?: string; itemName?: string; icon?: string }) =>
    api.post<ApiResponse<SharingContent>>("/sharing-content/update", data),
  remove: (id: string) =>
    api.post<ApiResponse>("/sharing-content/delete", { id }),
  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse>("/sharing-content/bulk-delete", { ids }),
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
  requests: () => api.get<ApiResponse<RequestCounts>>("/dashboard/requests"),
  permissions: () => api.get<ApiResponse<UserPermissions>>("/dashboard/permissions"),
  userPermissions: (userId: string) =>
    api.get<ApiResponse<UserPermissions>>(`/dashboard/permissions/${userId}`),
  usersByRole: () => api.get<ApiResponse<any[]>>("/dashboard/users-by-role"),
  activity: (limit?: number) =>
    api.get<ApiResponse<History[]>>("/dashboard/activity", { params: { limit } }),
  suspicious: () =>
    api.get<ApiResponse<SuspiciousActivity>>("/dashboard/suspicious"),
  subscriptionStats: (startDate?: string, endDate?: string) =>
    api.get<ApiResponse<{ total: number; active: number; expired: number; trial: number }>>("/dashboard/subscriptions", { params: { startDate, endDate } }),
  paymentStats: (startDate?: string, endDate?: string) =>
    api.get<ApiResponse<{ total: number; completed: number; revenue: number }>>("/dashboard/payments", { params: { startDate, endDate } }),
  growth: () =>
    api.get<ApiResponse<{ labels: string[]; subscriptionData: number[]; revenueData: number[] }>>("/dashboard/growth"),
};

export const uploadApi = {
  upload: (folder: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post<ApiResponse<{ uploaded: { url: string; filename: string; size: number; folder: string }[]; errors: string[] }>>(
      `/upload/${folder}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  listFiles: (folder: string) =>
    api.get<ApiResponse<UploadedFile[]>>(`/upload/list/${folder}`),
  deleteFile: (folder: string, filename: string) =>
    api.delete<ApiResponse>(`/upload/${folder}/${filename}`),
  listFolders: () => api.get<ApiResponse<Folder[]>>('/upload/folders'),
  createFolder: (data: { name: string; displayName: string; description?: string }) =>
    api.post<ApiResponse<Folder>>('/upload/folders', data),
  deleteFolder: (name: string) =>
    api.delete<ApiResponse>(`/upload/folders/${name}`),
  listIcons: () =>
    api.get<ApiResponse<{ name: string; url: string; path: string; size: number; created_at: string }[]>>('/upload/icons'),
};

export const userdataApi = {
  uploadAvatar: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<{ avatarUrl: string }>>('/upload/userdata/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  uploadFiles: (files: File[], onProgress?: (percent: number) => void, path?: string) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    if (path) form.append('path', path);
    return api.post<ApiResponse<{ uploaded: { url: string; filename: string; size: number; folder: string }[]; errors: string[] }>>(
      '/upload/userdata/files',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      },
    );
  },
  listFiles: () =>
    api.get<ApiResponse<UploadedFile[]>>('/upload/userdata'),
  browse: (path: string) =>
    api.get<ApiResponse<{ currentPath: string; items: any[] }>>('/upload/userdata/browse', { params: { path } }),
  deleteFile: (filename: string, path?: string) =>
    api.delete<ApiResponse>('/upload/userdata', { data: { filename, path } }),
  adminUploadAvatar: (userId: string, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('userId', userId);
    form.append('file', file);
    return api.post<ApiResponse<{ avatarUrl: string }>>('/upload/userdata/avatar/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  listAdminAvatars: (userId: string) =>
    api.post<ApiResponse<{ name: string; url: string; path: string; size: number; created_at: string }[]>>(
      '/upload/userdata/avatar/list',
      { userId },
    ),
  selectAdminAvatar: (userId: string, filename: string) =>
    api.post<ApiResponse<{ avatarUrl: string }>>(
      '/upload/userdata/avatar/select',
      { userId, filename },
    ),
  storageUsage: () =>
    api.get<ApiResponse<{
      usedBytes: number;
      limitBytes: number;
      usedMB: string;
      limitMB: string;
      percent: number;
      isAdmin: boolean;
    }>>('/upload/userdata/storage-usage'),
  createFolder: (folderName: string, currentPath?: string) =>
    api.post<ApiResponse<{ name: string; path: string }>>(
      '/upload/userdata/folder',
      { folderName, currentPath },
    ),
  deleteFolder: (folderPath: string) =>
    api.delete<ApiResponse>('/upload/userdata/folder', { data: { folderPath } }),
};

export const qrApi = {
  list: () =>
    api.get<ApiResponse<QRCode[]>>('/qr'),
  create: (data: { name: string; url: string }) =>
    api.post<ApiResponse<QRCode>>('/qr', data),
  remove: (id: string) =>
    api.delete<ApiResponse>(`/qr/${id}`),
  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse>('/qr/bulk-delete', { ids }),
};

export const translationApi = {
  translate: (data: { sourceText: string; sourceLang: string; targetLang: string }) =>
    api.post<ApiResponse<Translation>>('/translation', data),
  update: (data: { id: string; sourceText?: string; translatedText?: string }) =>
    api.post<ApiResponse<Translation>>('/translation/update', data),
  myTranslations: () =>
    api.get<ApiResponse<Translation[]>>('/translation/me'),
  list: () =>
    api.get<ApiResponse<Translation[]>>('/translation'),
  tts: (text: string, lang: string) =>
    api.get<ApiResponse<{ audio: string; mimeType?: string; engine?: string; voice?: string; lang: string }>>(
      '/translation/tts',
      { params: { text, lang } }
    ),
  remove: (id: string) =>
    api.delete<ApiResponse>(`/translation/${id}`),
  bulkDelete: (ids: string[]) =>
    api.post<ApiResponse>('/translation/bulk-delete', { ids }),
};

export const paymentApi = {
  plans: () =>
    api.get<ApiResponse<Plan[]>>('/payment/plans'),
  createOrder: (planId?: string) =>
    api.post<ApiResponse<{ orderId: string; approveUrl: string }>>('/payment/create-order', { planId }),
  capture: (orderId: string, payerId?: string) =>
    api.post<ApiResponse>('/payment/capture', { orderId, payerId }),
  myPayments: () =>
    api.get<ApiResponse<Payment[]>>('/payment/my-payments'),
  allPayments: () =>
    api.get<ApiResponse<Payment[]>>('/payment/all'),
  status: () =>
    api.get<ApiResponse<PaymentStatus>>('/payment/status'),
  publicStatus: (userId: string) =>
    api.get<ApiResponse<PaymentStatus>>("/payment/public-status", { params: { userId } }),
  // Admin subscription management
  subscriptions: (startDate?: string, endDate?: string) =>
    api.get<ApiResponse<UserSubscription[] | { subscriptions: UserSubscription[]; counts: { total: number; active: number; expired: number }; period: string }>>('/subscriptions', { params: startDate && endDate ? { startDate, endDate } : undefined }),
  userSubscriptions: (userId: string) =>
    api.get<ApiResponse<Subscription[]>>(`/subscriptions/user/${userId}`),
  adminChangePlan: (userId: string, planId: string) =>
    api.post<ApiResponse>('/subscriptions/admin-change-plan', { userId, planId }),
  cancelSubscription: (userId: string) =>
    api.post<ApiResponse>('/subscriptions/cancel', { userId }),
  cleanupExpired: () =>
    api.post<ApiResponse>('/subscriptions/cleanup-expired'),
  // Plan management
  getAllPlans: () =>
    api.get<ApiResponse<any[]>>('/plans'),
  getPlanRoutes: () =>
    api.get<ApiResponse<{ routes: any[]; plans: any[] }>>('/plans/routes'),
  createPlan: (data: { name: string; displayName: string; description?: string; features?: string[]; price: number; currency?: string; durationDays: number; isActive?: boolean; permissionIds?: string[] }) =>
    api.post<ApiResponse<Plan>>('/plans', data),
  updatePlan: (data: { id: string; name?: string; displayName?: string; description?: string; features?: string[]; price?: number; currency?: string; durationDays?: number; isActive?: boolean; permissionIds?: string[] }) =>
    api.post<ApiResponse<Plan>>('/plans/update', data),
  deletePlan: (id: string) =>
    api.post<ApiResponse>('/plans/delete', { id }),
  bulkDeletePlans: (ids: string[]) =>
    api.post<ApiResponse>('/plans/bulk-delete', { ids }),
};

export interface HomepageImage {
  name: string;
  url: string;
  path?: string;
  size?: number;
  created_at?: string;
}

export interface HomepageData {
  avatar: string | null;
  hapic: HomepageImage[];
  slideshowpics: HomepageImage[];
  tourguidepic: HomepageImage[];
}

export interface PublicHomepageData {
  avatar: string | null;
  slideshowpics: HomepageImage[];
  tourguidepic: HomepageImage[];
}

export const homepageApi = {
  getPublic: () =>
    api.get<ApiResponse<PublicHomepageData>>('/upload/homepage/public'),
  getAdmin: () =>
    api.get<ApiResponse<HomepageData>>('/upload/homepage/data'),
  setup: () =>
    api.post<ApiResponse>('/upload/homepage/setup'),
  upload: (folder: string, file: File) => {
    const form = new FormData();
    form.append('folder', folder);
    form.append('file', file);
    return api.post<ApiResponse<{ url: string; filename: string; path: string; size: number; folder: string }>>(
      '/upload/homepage/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  delete: (folder: string, filename: string) =>
    api.delete<ApiResponse>('/upload/homepage/delete', { data: { folder, filename } }),
};
