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

test("보드를 5초 안 만지면 합칠 쌍이 톡톡 넛지되고, 그 쌍을 끌어 합치면 넛지가 멈추고 타일이 제자리로", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
  type BV = { isNudging(): boolean; nodeAt(i: number): { c: { pivot: { x: number; y: number } }; w: number; h: number } | null };
  const nudging = () => page.evaluate(() => (window as unknown as { __board(): BV }).__board().isNudging());
  await expect.poll(nudging, { timeout: 9_000 }).toBe(true);
  // 넛지 중인 쌍 = findMergePair와 같은 쌍 (새 게임 보드: 활성 재료 → 거미줄)
  const pair = await page.evaluate(() => {
    const s = (window as unknown as { __game: { get(): { board: Array<{ chain: string; level: number; state: string; isGenerator: boolean } | null> } } }).__game.get();
    const act = s.board.findIndex((c) => c && c.state === "active" && !c.isGenerator && s.board.some((d, j) => d && d.state === "cobweb" && d.chain === c.chain && d.level === c.level && j !== -1));
    const a = s.board[act]!;
    const web = s.board.findIndex((d) => d && d.state === "cobweb" && d.chain === a.chain && d.level === a.level);
    return [act, web];
  });
  const a = await cellCenter(page, pair[0]);
  const b = await cellCenter(page, pair[1]);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
  await page.mouse.move(b.x, b.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await nudging()).toBe(false);
  const merged = await page.evaluate((i) => (window as unknown as { __game: { get(): { board: Array<{ state: string } | null> } } }).__game.get().board[i], pair[1]);
  expect(merged?.state).toBe("active");
  // 모든 타일의 pivot이 가운데(제자리)
  const off = await page.evaluate(() => {
    const bv = (window as unknown as { __board(): BV }).__board();
    let worst = 0;
    for (let i = 0; i < 56; i++) {
      const n = bv.nodeAt(i);
      if (n) worst = Math.max(worst, Math.abs(n.c.pivot.x - n.w / 2), Math.abs(n.c.pivot.y - n.h / 2));
    }
    return worst;
  });
  expect(off).toBeLessThan(0.5);
  expect(errors).toEqual([]);
});

test("첫 복구 코치: 합성 → 주문 완성 → 성으로 단계가 바뀌고, 제1화를 복구하면 사라진다 (클릭을 막지 않음)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
  const bar = page.locator(".coach-bar");
  await expect(bar).toHaveAttribute("data-step", "merge");
  // 띠 아래(보드 마지막 줄 근처)를 눌러도 보드가 입력을 받는다 — 띠는 pointer-events: none
  expect(await bar.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");

  // 첫 주문 재료를 놓으면 serve, 그 주문 카드가 반짝
  await seed(page, `d.orders[0].reqs.forEach((r, i) => { d.board[47 + i] = { uid: 'o' + i, state: 'active', isGenerator: false, chain: r.chain, level: r.level }; })`);
  await expect(bar).toHaveAttribute("data-step", "serve");
  await expect(page.locator(".gh-order-card").first()).toHaveClass(/coach-pulse/);

  // 코인을 채우고 주문 완성 → castle, 성 버튼 반짝
  // (주문 완성 단계가 성보다 먼저라, 새로 온 주문이 우연히 바로 완성 가능하면 serve가 맞음 — 남은 주문은 못 만드는 것으로)
  await seed(page, "d.coins = 2000");
  await page.locator(".gh-order-card").first().locator(".gh-serve-btn").click({ force: true });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __game: { get(): { coins: number } } }).__game.get().coins)).toBeGreaterThan(2000);
  await seed(page, "d.orders.forEach((o) => { o.reqs = [{ chain: 'tea', level: 8 }]; })");
  await expect(bar).toHaveAttribute("data-step", "castle");
  await expect(page.locator(".gh-castle-btn")).toHaveClass(/coach-pulse/);
  await page.locator(".gh-castle-btn").click();
  await expect(page.locator(".story-next-btn")).toHaveClass(/coach-pulse/);

  // 제1화 복구 → 코치 없음
  await page.locator(".story-next-btn").click();
  await page.locator(".style-confirm-btn").click();
  await expect(page.locator(".story-cutscene-modal")).toBeVisible({ timeout: 20_000 });
  await page.locator(".story-cutscene-modal .gh-close-btn").click();
  await expect(page.locator(".coach-bar")).toHaveCount(0);
  await expect(page.locator(".story-next-btn")).not.toHaveClass(/coach-pulse/);
  expect(errors).toEqual([]);
});

// ---- v3.7 리뷰 반영 ----
type NB = { isNudging(): boolean; nudges: Array<{ node: { cell: number }; tl: { repeat(): number } }> };
const nb = (page: import("@playwright/test").Page) => page.evaluate(() => {
  const b = (window as unknown as { __board(): NB }).__board();
  return { on: b.isNudging(), cells: b.nudges.map((n) => n.node.cell), repeats: b.nudges.map((n) => n.tl.repeat()) };
});
async function fresh(page: import("@playwright/test").Page) {
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
}

test("리뷰: 넛지 쌍 중 하나가 보드 밖 행동으로 사라지면 남은 타일도 멈춤 (코치가 끝난 뒤 대기 힌트)", async ({ page }) => {
  await fresh(page);
  await seed(page, "d.rooms.alc_cauldron.done = true");
  await expect.poll(async () => (await nb(page)).on, { timeout: 9_000 }).toBe(true);
  const { cells } = await nb(page);
  await seed(page, `d.board[${cells[0]}] = null`);
  await page.waitForTimeout(300);
  expect((await nb(page)).on).toBe(false);
});

test("리뷰: 타일을 누르고 있는 동안에는 넛지가 시작되지 않음", async ({ page }) => {
  await fresh(page);
  const c = await cellCenter(page, 25);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.waitForTimeout(3000);
  expect((await nb(page)).on).toBe(false);
  await page.mouse.up();
});

test("리뷰: 연출 줄이기를 켜면 넛지는 한 번만, 반짝임은 테두리만", async ({ page }) => {
  await fresh(page);
  await seed(page, "d.settings.reduceMotion = true");
  await expect.poll(async () => (await nb(page)).on, { timeout: 9_000 }).toBe(true);
  expect((await nb(page)).repeats.every((r) => r === 0)).toBe(true);
  await expect(page.locator("body")).toHaveClass(/reduce-motion/);
  await seed(page, `d.orders[0].reqs.forEach((r, i) => { d.board[47 + i] = { uid: 'o' + i, state: 'active', isGenerator: false, chain: r.chain, level: r.level }; })`);
  const card = page.locator(".gh-order-card.coach-pulse");
  await expect(card).toHaveCount(1);
  expect(await card.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});
