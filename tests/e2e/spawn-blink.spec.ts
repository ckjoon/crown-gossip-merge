import { test, expect } from "@playwright/test";
import { boot, cellCenter, state } from "./helpers";

type S = { board: Array<{ uid: string } | null> };

// 생성된 아이템은 생성기 자리에서 날아가야 한다 — 도착 칸에 먼저 한 번 그려졌다가 되돌아가면 깜빡여 보인다
test("생성: 새 아이템이 도착 칸에 먼저 나타나지 않음", async ({ page }) => {
  await boot(page);
  const s0 = await state<S>(page);
  const before = new Set(s0.board.map((c) => c?.uid).filter(Boolean));
  await page.evaluate(() => {
    const w = window as unknown as { __frames: Array<Array<{ cell: number; x: number; y: number; visible: boolean }>>; __board(): { nodes: Map<string, { cell: number; c: { x: number; y: number; visible: boolean; worldVisible: boolean } }> } };
    w.__frames = [];
    const tick = () => {
      const b = w.__board();
      w.__frames.push([...b.nodes.entries()].map(([k, n]) => ({ key: k, cell: n.cell, x: n.c.x, y: n.c.y, visible: n.c.visible })) as never);
      if (w.__frames.length < 40) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const g = await cellCenter(page, 16);
  await page.mouse.click(g.x, g.y);
  await page.waitForTimeout(900);
  const s1 = await state<S>(page);
  const idx = s1.board.findIndex((c) => c && !before.has(c.uid));
  expect(idx).toBeGreaterThanOrEqual(0);
  const uid = s1.board[idx]!.uid;
  const res = await page.evaluate(({ to, uid }) => {
    const w = window as unknown as { __frames: Array<Array<{ key: string; cell: number; x: number; y: number; visible: boolean }>>; __board(): { cellCenter(i: number): { x: number; y: number } } };
    const dest = w.__board().cellCenter(to);
    const first = w.__frames.map((f) => f.find((n) => n.key.includes(uid))).find((n) => n && n.visible);
    return { first, dest };
  }, { to: idx, uid });
  expect(res.first).toBeTruthy();
  // 처음 보이는 순간 도착 칸 중심에 있으면 안 됨
  const d = Math.hypot(res.first!.x - res.dest.x, res.first!.y - res.dest.y);
  expect(d).toBeGreaterThan(5);
});
