import { defineConfig } from "@playwright/test";

// Galaxy S25 세로 화면 기준 E2E. 빌드된 결과물(preview)에서 실제 서비스 워커까지 포함해 검증한다
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    hasTouch: false,
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
