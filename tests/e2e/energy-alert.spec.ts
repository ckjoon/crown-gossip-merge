import { test, expect } from "@playwright/test";
import { boot, cellCenter, seed } from "./helpers";

// v3.13 번개 가득 알림: 번개가 처음 바닥났을 때 한 번만 묻고, 거절하면 다시 묻지 않음. 설정에서 직접 켜고 끔
test("번개가 바닥나면 알림 동의를 한 번만 묻고, 설정에 켜고 끄는 버튼이 있음", async ({ page }) => {
  // headless 크롬은 알림 권한이 늘 "거부"라 묻는 창이 안 뜸 — 아직 정하지 않은 기기처럼 둔다
  await page.addInitScript(() => Object.defineProperty(Notification, "permission", { get: () => "default" }));
  await boot(page);
  await seed(page, "d.energy = 0");
  const g = await cellCenter(page, 16);
  await page.mouse.click(g.x, g.y); // 첫 탭은 고르기만
  await page.waitForTimeout(300);
  await page.mouse.click(g.x, g.y);
  const ask = page.locator(".gh-modal", { hasText: "번개 가득 알림" });
  await expect(ask).toBeVisible();
  await ask.getByRole("button", { name: "괜찮아요" }).click();
  await expect(ask).toBeHidden();
  await page.waitForTimeout(400);
  await page.mouse.click(g.x, g.y);
  await page.waitForTimeout(500);
  await expect(page.locator(".gh-modal")).toHaveCount(0);
  await page.getByTitle("설정").click();
  await expect(page.getByTestId("energy-alert-toggle")).toHaveText("⬜ 꺼짐");
});
