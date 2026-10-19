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
