import { test, expect } from "@playwright/test";
import { boot, cellCenter, drag, seed, state } from "./helpers";

type S = { board: Array<{ uid: string; chain: string; level: number; isGenerator: boolean } | null>; energy: number; coins: number; gems: number; orders: Array<{ reqs: Array<{ chain: string; level: number }> }> };

test("새 게임: 생성 → 합성 → 주문 완료 → 제1화 복구 → 💎 상점", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);

  // 1. 가마솥(칸 16) 탭 → 재료 생성, 번개 −1
  const s0 = await state<S>(page);
  const g = await cellCenter(page, 16);
  await page.mouse.click(g.x, g.y);
  await page.waitForTimeout(300);
  const s1 = await state<S>(page);
  expect(s1.board.filter(Boolean).length).toBe(s0.board.filter(Boolean).length + 1);
  expect(s1.energy).toBe(s0.energy - 1);

  // 2. 같은 재료 두 개를 드래그로 합성
  await seed(page, `d.board[38] = { uid: 'e1', state: 'active', isGenerator: false, chain: 'tea', level: 2 }; d.board[39] = { uid: 'e2', state: 'active', isGenerator: false, chain: 'tea', level: 2 }`);
  await page.waitForTimeout(200);
  await drag(page, 38, 39);
  await page.waitForTimeout(300);
  const s2 = await state<S>(page);
  expect(s2.board[38]).toBeNull();
  expect(s2.board[39]?.level).toBe(3);

  // 3. 첫 주문 재료를 놓고 [완성!]
  await seed(page, `d.orders[0].reqs.forEach((r, i) => { d.board[47 + i] = { uid: 'o' + i, state: 'active', isGenerator: false, chain: r.chain, level: r.level }; })`);
  await page.waitForTimeout(200);
  const before = (await state<S>(page)).coins;
  // 완료 가능한 카드는 계속 펄스 애니메이션 중이라 안정 대기 없이 클릭
  await page.locator(".gh-order-card").first().locator(".gh-serve-btn").click({ force: true });
  await page.waitForTimeout(300);
  expect((await state<S>(page)).coins).toBeGreaterThan(before);

  // 4. 성 → 다음 이야기 진행 → 확정 → 컷신 → 제2화 (v3.5: 제1화 비용 800 — 주문 몇 번 분량을 미리 채움)
  await seed(page, "d.coins = 2000");
  await page.locator(".gh-castle-btn").click();
  await page.waitForTimeout(600);
  await expect(page.locator(".story-next-btn")).toContainText("제1화");
  // 레고식 방: 처음엔 입구 홀만 지어져 있고 제1화 장소는 폐허
  const modules = () => page.evaluate(() => (window as unknown as { __castle(): { moduleStateList(): string[] } }).__castle().moduleStateList());
  expect(await modules()).toEqual(["built", "ruin", "ghost", "ghost", "ghost", "ghost"]);
  await page.locator(".story-next-btn").click();
  await page.locator(".style-confirm-btn").click();
  await expect(page.locator(".story-cutscene-modal")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".cutscene-stage-banner strong")).toContainText("제1화");
  await page.locator(".story-cutscene-modal .gh-close-btn").click();
  await expect(page.locator(".story-next-btn")).toContainText("제2화", { timeout: 5_000 });
  // 복구한 조각이 지어지고 다음 장소가 폐허로
  expect(await modules()).toEqual(["built", "built", "ruin", "ghost", "ghost", "ghost"]);

  // 5. 💎 상점에서 번개 구매
  const e0 = (await state<S>(page)).energy;
  await page.locator(".gh-res-pill.gems").click();
  await page.locator(".gem-pack-btn").first().click();
  await page.waitForTimeout(200);
  expect((await state<S>(page)).energy).toBe(e0 + 50);

  expect(errors).toEqual([]);
});
