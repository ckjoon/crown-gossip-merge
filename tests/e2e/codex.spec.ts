import { test, expect } from "@playwright/test";
import { seed } from "./helpers";

const SHOTS = process.env.SHOT_DIR;

// v3.9 발견하는 도감: 못 본 재료 단계·생성기 등급은 실루엣과 ???, 줄을 누르면 등급별 설명
test("도감: 못 본 단계는 ???로 가려지고, 생성기 줄을 누르면 ★별 이름·설명 (가진 등급까지만 공개)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
  // 차 생성기 ★2, 차 재료는 Lv.3까지만 본 상태
  await seed(page, `d.board = d.board.map((c) => (c && c.isGenerator && c.chain === 'tea' ? { ...c, level: 2 } : c && !c.isGenerator && c.chain === 'tea' && c.state !== 'crate' ? null : c)); d.codexSeen.tea = 3;`);
  await page.locator("button[title='아이템 체인 도감']").click();
  const strip = page.locator(".gh-modal [data-chain=tea] .chain-strip");
  await expect(strip.locator(".cs-item")).toHaveCount(8);
  await expect(strip.locator(".cs-item.cs-unknown")).toHaveCount(5);
  await strip.locator(".cs-head").click();
  const tiers = strip.locator(".cs-tier");
  await expect(tiers).toHaveCount(3);
  await expect(tiers.nth(1)).toHaveClass(/cs-current/);
  await expect(tiers.nth(2)).toHaveClass(/cs-unknown/);
  await expect(tiers.nth(2)).toContainText("???");
  await expect(tiers.nth(0)).not.toContainText("???");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/codex.png` });
  expect(errors).toEqual([]);
});
