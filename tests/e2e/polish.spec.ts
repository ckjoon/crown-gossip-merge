import { test, expect, type Page } from "@playwright/test";
import { seed } from "./helpers";

// v3.7.1 작은 것 정리: 화면 쪽 회귀 테스트
async function fresh(page: Page) {
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
}
type BV = { isNudging(): boolean; nodeAt(i: number): { c: { pivot: { x: number; y: number } }; w: number; h: number } | null };

test("넛지 중 화면 크기가 바뀌어도 타일이 가운데에 (어긋나지 않음)", async ({ page }) => {
  await fresh(page);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __board(): BV }).__board().isNudging()), { timeout: 9_000 }).toBe(true);
  await page.setViewportSize({ width: 412, height: 780 });
  await page.waitForTimeout(1200);
  const off = await page.evaluate(() => {
    const bv = (window as unknown as { __board(): BV }).__board();
    if (bv.isNudging()) return 0; // 새 크기로 다시 시작했으면 정상
    let worst = 0;
    for (let i = 0; i < 56; i++) {
      const n = bv.nodeAt(i);
      if (n) worst = Math.max(worst, Math.abs(n.c.pivot.x - n.w / 2), Math.abs(n.c.pivot.y - n.h / 2));
    }
    return worst;
  });
  expect(off).toBeLessThan(0.5);
});

type CV = { shownModuleStates(): string[]; moduleStateList(): string[]; actors: Array<{ id: string }> };
const castle = (page: Page) => page.evaluate(() => {
  const c = (window as unknown as { __castle(): CV }).__castle();
  return { shown: c.shownModuleStates(), real: c.moduleStateList(), actors: c.actors.map((a) => a.id) };
});

test("벽걸이 장소(공방 창문)를 폐허 조각에서 미리 보면 그 조각을 지어진 모습으로, 취소하면 다시 폐허", async ({ page }) => {
  await fresh(page);
  await seed(page, "['alc_cauldron','alc_bookcase','alc_herbtable'].forEach((id) => (d.rooms[id].done = true)); d.coins = 99999; d.playerLv = 5");
  await page.locator(".gh-castle-btn").click();
  await expect(page.locator(".story-next-btn")).toContainText("제4화");
  await page.locator(".story-next-btn").click();
  await expect.poll(async () => (await castle(page)).shown[4]).toBe("built");
  expect((await castle(page)).real[4]).toBe("ruin");
  await page.locator(".style-cancel-btn").click();
  await expect.poll(async () => (await castle(page)).shown[4]).toBe("ruin");
});

test("지도를 보다 다른 화면에서 레벨이 올라 구역이 열리면, 돌아왔을 때 지도 자물쇠가 풀려 있음", async ({ page }) => {
  await fresh(page);
  await seed(page, "Object.keys(d.rooms).filter((id) => id.startsWith('alc_')).forEach((id) => (d.rooms[id].done = true)); d.playerLv = 5");
  await page.locator(".gh-castle-btn").click();
  await page.locator(".theme-tab").first().click();
  const locks = () => page.evaluate(() => {
    let n = 0;
    (window as unknown as { __castle(): { scene: { traverse(f: (o: { userData: { role?: string; wing?: string } }) => void): void } } }).__castle().scene.traverse((o) => {
      if (o.userData.role === "lock" && o.userData.wing === "harbor") n++;
    });
    return n;
  });
  await expect.poll(locks).toBeGreaterThan(0);
  await seed(page, "d.playerLv = 6");
  await expect.poll(locks).toBe(0);
});

test("성 구역을 빠르게 바꿔도 마지막 구역의 주민만 남음 (늦게 도착한 모델이 이전 구역에 끼어들지 않음)", async ({ page }) => {
  await fresh(page);
  await seed(page, "Object.keys(d.rooms).filter((id) => id.startsWith('alc_') || id.startsWith('hb_')).forEach((id) => (d.rooms[id].done = true)); d.playerLv = 11");
  await page.locator(".gh-castle-btn").click();
  await page.locator(".theme-tab", { hasText: "공방" }).click();
  await page.locator(".theme-tab", { hasText: "하버" }).click();
  await page.locator(".theme-tab", { hasText: "공방" }).click();
  await page.locator(".theme-tab", { hasText: "하버" }).click();
  await expect.poll(async () => (await castle(page)).actors, { timeout: 15_000 }).toContain("quinn");
  await page.waitForTimeout(1500);
  const raced = (await castle(page)).actors;
  expect(new Set(raced).size).toBe(raced.length);
  // 지도로 나갔다가 하버에 천천히 다시 들어간 결과와 같은 캐릭터들
  await page.locator(".theme-tab").first().click();
  await page.waitForTimeout(500);
  await page.locator(".theme-tab", { hasText: "하버" }).click();
  await page.waitForTimeout(2500);
  const calm = (await castle(page)).actors;
  expect([...raced].sort()).toEqual([...calm].sort());
});

test("v3.8 생성기 흡수: 마지막 ★1 가마솥 둘을 합치면 보드의 Lv.1 물약이 빨려 들어가 사라지고 알림", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fresh(page);
  // 새 게임 시작 보드: 가마솥 ★1 두 개(칸 16·17), 거미줄 칸에 Lv.1 물약들이 있음
  await seed(page, "d.board[40] = { uid: 'p1', state: 'active', isGenerator: false, chain: 'potion', level: 1 }; d.rooms.alc_cauldron.done = true");
  const lv1 = () => page.evaluate(() => (window as unknown as { __game: { get(): { board: Array<{ chain: string; level: number; isGenerator: boolean } | null> } } }).__game.get().board.filter((c) => c && !c.isGenerator && c.chain === "potion" && c.level === 1).length);
  expect(await lv1()).toBeGreaterThan(1);
  const { drag } = await import("./helpers");
  await drag(page, 16, 17);
  await expect.poll(lv1).toBe(0);
  await expect(page.locator(".fx-float-text", { hasText: "흡수" })).toBeVisible();
  await page.waitForTimeout(900);
  expect(errors).toEqual([]);
});

test("v3.8 공방을 완성하면 셀레네가 촛대 제단을 건네주고, 보드에 촛대 생성기가 생김 (레벨과 무관)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fresh(page);
  await seed(page, "['alc_cauldron','alc_bookcase','alc_herbtable','alc_window'].forEach((id) => (d.rooms[id].done = true)); d.coins = 999999; d.playerLv = 3");
  await page.locator(".gh-castle-btn").click();
  await expect(page.locator(".story-next-btn")).toContainText("제5화");
  await page.locator(".story-next-btn").click();
  await page.locator(".style-confirm-btn").click();
  await expect(page.locator(".story-cutscene-modal")).toBeVisible({ timeout: 20_000 });
  await page.locator(".story-cutscene-modal .gh-close-btn").click();
  await page.locator(".zone-complete-banner").click({ timeout: 10_000 }).catch(() => {});
  await expect(page.locator(".reaction-bubble", { hasText: "촛대 제단" })).toBeVisible({ timeout: 15_000 });
  const has = await page.evaluate(() => {
    const s = (window as unknown as { __game: { get(): { board: Array<{ chain: string; isGenerator: boolean } | null>; bag: Array<{ chain: string; isGenerator: boolean }> } } }).__game.get();
    return [...s.board, ...s.bag].some((c) => c?.isGenerator && c.chain === "candle");
  });
  expect(has).toBe(true);
  expect(errors).toEqual([]);
});
