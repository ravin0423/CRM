import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The API base URL is read from /config.json at runtime — see src/lib/api.ts.
// We intentionally do NOT inline it here.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
});
