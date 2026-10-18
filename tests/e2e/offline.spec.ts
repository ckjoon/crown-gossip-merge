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

test("오프라인에서도 한 번 본 성 구역은 3D 모델로 보임", async ({ page, context }) => {
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const modelsShown = () =>
    page.waitForFunction(
      () => {
        const v = (window as unknown as { __castle(): { roomGroup: { traverse(f: (o: { userData: { shared?: boolean } }) => void): void } } | null }).__castle();
        let n = 0;
        v?.roomGroup.traverse((o) => o.userData.shared && n++);
        return n > 20;
      },
      undefined,
      { timeout: 15_000 },
    );
  // 온라인에서 성 구역을 한 번 열어 모델이 캐시되게 한다
  await page.locator(".gh-modal .gh-close-btn").first().click({ timeout: 3_000 }).catch(() => {});
  await page.locator(".gh-castle-btn").click();
  await modelsShown();
  await context.setOffline(true);
  await page.reload();
  await page.locator(".gh-board-container .board-host canvas").waitFor({ timeout: 15_000 });
  await page.locator(".gh-modal .gh-close-btn").first().click({ timeout: 3_000 }).catch(() => {});
  await page.locator(".gh-castle-btn").click();
  await modelsShown();
  await context.setOffline(false);
});
