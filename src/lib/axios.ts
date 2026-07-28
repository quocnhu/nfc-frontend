import axios from "axios";
import { notification } from "antd";

const api = axios.create({
  baseURL: "/backend-api",
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const REFRESH_URL = "/api/auth/refresh";

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(undefined);
    }
  });
  failedQueue = [];
}

function isOnAuthPage() {
  if (typeof window === "undefined") return false;
  return AUTH_ROUTES.some((route) => window.location.pathname.startsWith(route));
}

let hasShownSessionExpired = false;

function showSessionExpired() {
  if (hasShownSessionExpired) return;
  hasShownSessionExpired = true;
  
  notification.error({
    message: "Session Expired",
    description: "Your session has expired. Please login again to continue.",
    duration: 5,
    placement: "topRight",
  });
  
  setTimeout(() => {
    hasShownSessionExpired = false;
  }, 6000);
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 429) {
      const retryAfter = err.response.headers["retry-after"] || err.response.data?.retryAfter || 30;
      notification.error({
        message: "Too Many Requests",
        description: `Please wait ${retryAfter} seconds before trying again.`,
        duration: 4,
      });
      return Promise.reject(err);
    }

    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== REFRESH_URL &&
      !isOnAuthPage()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(REFRESH_URL, null, { withCredentials: true });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError);
        showSessionExpired();
        if (typeof window !== "undefined" && !isOnAuthPage()) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (err.response) {
      console.error(
        `[API Error] ${err.config.method?.toUpperCase()} ${err.config.url} → ${err.response.status}:`,
        err.response.data
      );
    } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      notification.error({
        message: "Network Timeout",
        description: "The request took too long. Please check your connection and try again.",
        duration: 4,
      });
    } else {
      console.error("[API Error] Network error:", err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
