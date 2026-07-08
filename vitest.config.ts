import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    // happy-dom gives component tests a DOM; pure-logic tests run fine here too.
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "dist/**"],
  },
  resolve: {
    // Mirror the tsconfig "@/*" -> "./*" path alias so imports resolve in tests.
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
