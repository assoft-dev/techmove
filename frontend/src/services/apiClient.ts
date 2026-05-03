import axios, { AxiosError, type AxiosResponse } from "axios";
import { useSessionStore } from "../store/sessionStore.js";

type EnvelopeSuccess<T> = { success: true; data: T };
type EnvelopeFail = { success: false; error: string };

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:3001";

/**
 * Cliente HTTP (axios) para a API Express no backend.
 * Desembrulha respostas `{ success, data }` dos controllers.
 */
export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse<unknown>) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body) {
      const e = body as EnvelopeSuccess<unknown> | EnvelopeFail;
      if ("success" in e && e.success === false) {
        return Promise.reject(new Error(e.error));
      }
      if ("success" in e && e.success === true && "data" in e) {
        response.data = e.data;
      }
    }
    return response;
  },
  (error: AxiosError<{ success?: boolean; error?: string }>) => {
    const d = error.response?.data;
    if (d && typeof d === "object") {
      if (d.success === false && d.error) {
        return Promise.reject(new Error(String(d.error)));
      }
      if ("error" in d && d.error) {
        return Promise.reject(new Error(String(d.error)));
      }
    }
    const msg = error.message || "Erro de rede";
    return Promise.reject(error instanceof Error ? error : new Error(msg));
  },
);

export function getBaseUrl(): string {
  return api.defaults.baseURL ?? baseURL;
}
