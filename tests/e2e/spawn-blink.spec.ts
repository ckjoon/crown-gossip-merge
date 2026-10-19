import { test, expect } from "@playwright/test";
import { boot, cellCenter, state } from "./helpers";

type S = { board: Array<{ uid: string } | null> };

// 생성된 아이템은 생성기 자리에서 날아가야 한다 — 도착 칸에 먼저 한 번 그려졌다가 되돌아가면 깜빡여 보인다
// v3.7: 프레임(rAF) 기록은 병렬 실행 중 CPU가 밀리면 비행이 프레임 사이에 끝나 버려 흔들리므로,
// 노드가 만들어지는 render() 호출 직후(그리기 전) 위치를 직접 잰다 — 깜빡임이 생기는 바로 그 순간
test("생성: 새 아이템이 도착 칸에 먼저 나타나지 않음", async ({ page }) => {
  await boot(page);
  const s0 = await state<S>(page);
  const before = new Set(s0.board.map((c) => c?.uid).filter(Boolean));
  await page.evaluate(() => {
    type N = { cell: number; c: { x: number; y: number } };
    const w = window as unknown as { __born: Record<string, { cell: number; x: number; y: number }>; __board(): { nodes: Map<string, N>; render: (...a: unknown[]) => void } };
    const b = w.__board();
    w.__born = {};
    const orig = b.render.bind(b);
    b.render = (...a: unknown[]) => {
      const had = new Set(b.nodes.keys());
      orig(...a);
      for (const [k, n] of b.nodes) if (!had.has(k) && !w.__born[k]) w.__born[k] = { cell: n.cell, x: n.c.x, y: n.c.y };
    };
  });
  const g = await cellCenter(page, 16);
  await page.mouse.click(g.x, g.y); // v3.11: 첫 탭은 고르기만
  await page.waitForTimeout(300);
  await page.mouse.click(g.x, g.y);
  await page.waitForTimeout(600);
  const s1 = await state<S>(page);
  const idx = s1.board.findIndex((c) => c && !before.has(c.uid));
  expect(idx).toBeGreaterThanOrEqual(0);
  const uid = s1.board[idx]!.uid;
  const res = await page.evaluate(({ to, uid }) => {
    const w = window as unknown as { __born: Record<string, { cell: number; x: number; y: number }>; __board(): { cellCenter(i: number): { x: number; y: number } } };
    const key = Object.keys(w.__born).find((k) => k.includes(uid));
    return { born: key ? w.__born[key] : null, dest: w.__board().cellCenter(to) };
  }, { to: idx, uid });
  expect(res.born).toBeTruthy();
  // 만들어진 순간 도착 칸 중심에 있으면 안 됨 (생성기 자리에서 출발)
  const d = Math.hypot(res.born!.x - res.dest.x, res.born!.y - res.dest.y);
  expect(d).toBeGreaterThan(5);
});
