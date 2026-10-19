import { test, expect } from "@playwright/test";
import { cellCenter, seed, state } from "./helpers";

const SHOTS = process.env.SHOT_DIR;
type S = { energy: number; board: Array<{ uid: string } | null> };

async function boot(page: import("@playwright/test").Page) {
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
  await page.waitForTimeout(800);
}

// v3.11: 생성기는 처음 누르면 고르기만 (번개 안 씀), 고른 생성기를 다시 누르면 생성
test("생성기: 첫 탭은 선택과 설명만, 두 번째 탭에 생성", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  const s0 = await state<S>(page);
  const g = await cellCenter(page, 17);
  await page.mouse.click(g.x, g.y);
  await page.waitForTimeout(400);
  const s1 = await state<S>(page);
  expect(s1.energy).toBe(s0.energy);
  await expect(page.locator(".gh-inspector .insp-title-row strong")).toContainText("가마솥");
  await page.mouse.click(g.x, g.y);
  await page.waitForTimeout(400);
  expect((await state<S>(page)).energy).toBe(s0.energy - 1);
  expect(errors).toEqual([]);
});

test("계보 화면: 재료의 출처·단계·지금 위치, 못 본 단계는 ???", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await seed(page, `d.board[44] = { uid: 'p3', state: 'active', isGenerator: false, chain: 'potion', level: 3 }; d.codexSeen.potion = 3;`);
  await page.waitForTimeout(200);
  const c = await cellCenter(page, 44);
  await page.mouse.click(c.x, c.y);
  await page.locator(".gh-inspector button[title='어디서 왔는지와 단계']").click();
  const modal = page.locator(".gh-modal");
  await expect(modal.locator(".ii-source")).toContainText("수습 마법 가마솥");
  await expect(modal.locator(".ii-step")).toHaveCount(8);
  await expect(modal.locator(".ii-step.ii-current")).toContainText("Lv.3");
  await expect(modal.locator(".ii-step.cs-unknown")).toHaveCount(5);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/lineage.png` });
  await modal.locator(".ii-codex-btn").click();
  await expect(page.locator(".gh-modal [data-chain=potion]")).toBeVisible();
  expect(errors).toEqual([]);
});

test("계보 화면: 생성기는 ★ 등급(가진 등급까지만 공개)과 나오는 재료", async ({ page }) => {
  await boot(page);
  const g = await cellCenter(page, 16);
  await page.mouse.click(g.x, g.y);
  await page.locator(".gh-inspector button[title='등급과 나오는 재료']").click();
  const modal = page.locator(".gh-modal");
  await expect(modal.locator(".cs-tier")).toHaveCount(3);
  await expect(modal.locator(".cs-tier.cs-unknown")).toHaveCount(2);
  await expect(modal.locator(".ii-step.ii-spawn")).toHaveCount(2);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/lineage-gen.png` });
});
