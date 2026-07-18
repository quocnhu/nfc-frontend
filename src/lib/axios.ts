import axios from "axios";
import { message } from "antd";

const api = axios.create({
  baseURL: "/api/backend",
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

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 429) {
      const retryAfter = err.response.headers["retry-after"] || err.response.data?.retryAfter || 30;
      message.error(`Too many requests. Please wait ${retryAfter} seconds.`);
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
      } catch (refreshError) {
        processQueue(refreshError);
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
    } else {
      console.error("[API Error] Network error:", err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
