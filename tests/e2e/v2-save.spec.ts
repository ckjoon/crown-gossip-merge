import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { state } from "./helpers";

const fixture = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../fixtures/v2.4-save.json"), "utf8"));

test("v2.4 세이브 이어받기: 정리 안내 → 값 확인 → 새로고침 후 안내 없음", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // 첫 로드에만 v2.4 기록을 localStorage에 넣는다
  await page.addInitScript((rec) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("crown_gossip_save_backup_v1", JSON.stringify({ ...rec, updatedAt: Date.now() }));
  }, fixture);
  await page.goto("/?e2e");
  await expect(page.locator(".gh-modal-header h2")).toContainText("세이브 정리 안내");
  const lines = page.locator(".migration-line");
  await expect(lines.first()).toContainText("번개 1000 → 100 (💎+18)");
  await expect(page.locator(".gh-modal-body")).toContainText("예전 조합품 3개 → +140");
  await expect(page.locator(".gh-modal-body")).toContainText("💎+50");
  const s = await state<{ energy: number; gems: number; coins: number }>(page);
  expect(s.energy).toBe(100);
  expect(s.gems).toBe(78);
  expect(s.coins).toBe(1040);

  await page.locator(".gh-modal .gh-close-btn").click();
  await expect(page.getByRole("heading", { name: /업데이트 노트/ })).toBeVisible();
  await expect(page.locator(".gh-modal")).toHaveCount(1);
  await page.locator(".gh-modal .gh-close-btn").click();
  await page.waitForTimeout(800);

  await page.reload();
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForTimeout(1200);
  await expect(page.locator(".gh-modal")).toHaveCount(0);
  const s2 = await state<{ gems: number }>(page);
  expect(s2.gems).toBe(78);
  expect(errors).toEqual([]);
});
