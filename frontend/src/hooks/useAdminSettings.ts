import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";

export interface AdminSettings {
  database?: {
    type?: "sqlserver" | "mongodb";
    sqlserver?: Record<string, any>;
    mongodb?: Record<string, any>;
  };
  email?: Record<string, any>;
  storage?: {
    type?: "minio" | "s3";
    minio?: Record<string, any>;
    s3?: Record<string, any>;
  };
  api?: Record<string, any>;
  integrations?: Record<string, any>;
}

export function useAdminSettings() {
  return useQuery<AdminSettings>({
    queryKey: ["admin-settings"],
    queryFn: async () => (await api().get("/admin/settings")).data,
  });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: AdminSettings) =>
      (await api().put("/admin/settings", patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-settings"] }),
  });
}

export async function testDatabase(payload: any) {
  return (await api().post("/admin/settings/database/test", payload)).data;
}

export async function testStorage(payload: any) {
  return (await api().post("/admin/settings/storage/test", payload)).data;
}

export async function testEmail(payload: any) {
  return (await api().post("/admin/settings/email/test", payload)).data;
}
