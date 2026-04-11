import axios from "axios";
import { runtimeConfig } from "./runtime-config";

/** Axios instance whose baseURL is set from the runtime config — not hardcoded. */
export function api() {
  return axios.create({
    baseURL: runtimeConfig().apiBaseUrl,
    withCredentials: true,
  });
}
