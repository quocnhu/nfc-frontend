import axios from "axios";

const api = axios.create({
  baseURL: "/api/backend",
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      console.error(`[API Error] ${err.config.method?.toUpperCase()} ${err.config.url} → ${err.response.status}:`, err.response.data);
    } else {
      console.error("[API Error] Network error:", err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
