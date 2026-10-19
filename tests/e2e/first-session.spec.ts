import { test, expect } from "@playwright/test";
import { cellCenter, seed } from "./helpers";

// v3.7 친절한 첫 경험: 새 게임은 업데이트 노트 없이 바로 보드, 알림은 화면 안에
test("새 게임은 업데이트 노트 없이 시작하고, 보드가 가득 찼다는 알림이 화면 밖으로 나가지 않는다", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
  await page.waitForTimeout(1200);
  await expect(page.locator(".gh-modal")).toHaveCount(0);

  // 빈칸을 모두 채우고 왼쪽 위 생성기(칸 16)를 탭
  await seed(page, `d.board.forEach((c, i) => { if (!c) d.board[i] = { uid: 'f' + i, state: 'active', isGenerator: false, chain: 'tea', level: 8 }; })`);
  await page.waitForTimeout(200);
  const g = await cellCenter(page, 16);
  await page.mouse.click(g.x, g.y);
  await page.mouse.click(g.x, g.y);
  const box = await page.locator(".fx-float-text").first().boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(412);
  await expect(page.locator(".fx-float-text")).toHaveCount(1);
  expect(errors).toEqual([]);
});
