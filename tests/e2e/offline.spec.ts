import { test, expect } from "@playwright/test";

test("오프라인 새로고침: 서비스 워커 캐시로 실행", async ({ page, context }) => {
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // 첫 방문은 서비스 워커가 페이지를 제어하지 않으므로 한 번 새로고침해 제어권을 갖게 한다
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#game-shell")).toBeVisible();
  await page.locator(".gh-board-container .board-host canvas").waitFor({ timeout: 15_000 });
  await context.setOffline(false);
});
