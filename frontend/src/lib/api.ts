import axios, { AxiosInstance } from "axios";

import { useAuthStore } from "../store/auth";
import { runtimeConfig } from "./runtime-config";

let _instance: AxiosInstance | null = null;

/** Axios instance whose baseURL is set from the runtime config — not hardcoded. */
export function api(): AxiosInstance {
  if (_instance) return _instance;

  _instance = axios.create({
    baseURL: runtimeConfig().apiBaseUrl,
    withCredentials: false,
  });

  // Attach bearer token on every request.
  _instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Kick the user out on 401.
  _instance.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) {
        useAuthStore.getState().clear();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(err);
    }
  );

  return _instance;
}
