import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
