import type { Page } from "@playwright/test";

// 테스트용으로 노출된 core store (?e2e 경로에서만)
export async function state<T = Record<string, unknown>>(page: Page): Promise<T> {
  return page.evaluate(() => (window as unknown as { __game: { get(): unknown } }).__game.get() as T);
}

export async function seed(page: Page, fn: string): Promise<void> {
  await page.evaluate((src) => {
    const g = (window as unknown as { __game: { dispatch(a: unknown, p: unknown): void } }).__game;
    // eslint-disable-next-line no-new-func
    g.dispatch(new Function("d", src) as unknown, undefined);
  }, `${fn}; return [];`);
}

export async function cellCenter(page: Page, idx: number, selector = ".gh-board-container .board-host canvas", cols = 7, rows = 8) {
  const box = (await page.locator(selector).boundingBox())!;
  const cw = (box.width - 3.5 * (cols - 1)) / cols;
  const ch = (box.height - 3.5 * (rows - 1)) / rows;
  return { x: box.x + (idx % cols) * (cw + 3.5) + cw / 2, y: box.y + Math.floor(idx / cols) * (ch + 3.5) + ch / 2 };
}

export async function drag(page: Page, from: number, to: number) {
  const a = await cellCenter(page, from);
  const b = await cellCenter(page, to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
  await page.mouse.move(b.x, b.y, { steps: 4 });
  await page.mouse.up();
}

export async function closeModals(page: Page) {
  for (let i = 0; i < 3; i++) {
    const btn = page.locator(".gh-modal .gh-close-btn").first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(400);
    } else break;
  }
}

export async function boot(page: Page) {
  await page.goto("/?e2e");
  await page.locator(".gh-board-container .board-host canvas").waitFor();
  await page.waitForFunction(() => !!(window as unknown as { __game?: unknown }).__game);
  await page.waitForTimeout(700);
  await closeModals(page);
}
