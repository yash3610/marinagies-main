import { defineConfig, devices } from "@playwright/test";

const mongoUri = process.env.E2E_MONGO_URI || "mongodb://127.0.0.1:27017/marineaegis_e2e";
process.env.E2E_MONGO_URI = mongoUri;

const backendEnvironment = {
  MONGO_URI: mongoUri,
  PORT: "5510",
  FRONTEND_URL: "http://127.0.0.1:4175",
  JWT_SECRET: "e2e-jwt-secret-with-at-least-32-characters",
  TELEMETRY_INGESTION_KEY: "e2e-telemetry-key-with-at-least-32-characters",
  RECOVERY_ENCRYPTION_KEY: "e2e-recovery-key-with-at-least-32-characters",
  OBSERVABILITY_KEY: "e2e-observability-key-with-at-least-32-characters",
  ENABLE_TELEMETRY_SIMULATOR: "false",
  ML_SERVICE_URL: "",
  ML_SERVICE_KEY: "",
  NODE_ENV: "test",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/global-setup.cjs",
  globalTeardown: "./e2e/global-teardown.cjs",
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm start --prefix ../backend",
      url: "http://127.0.0.1:5510/api/health",
      env: backendEnvironment,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4175",
      url: "http://127.0.0.1:4175",
      env: { BACKEND_PROXY_URL: "http://127.0.0.1:5510" },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
