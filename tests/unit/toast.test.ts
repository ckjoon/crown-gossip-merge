import { describe, test, expect, vi, beforeEach } from "vitest";
import { toast, toasts } from "../../src/views/ui/ui.svelte";

describe("떠오르는 알림 (v3.7)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toasts.splice(0, toasts.length);
  });

  test("같은 문구가 떠 있는 동안 다시 오면 새로 쌓지 않고 시간만 늘린다", () => {
    toast("보드가 가득 찼습니다!", 200, 400);
    vi.advanceTimersByTime(800);
    toast("보드가 가득 찼습니다!", 200, 400);
    expect(toasts.length).toBe(1);
    vi.advanceTimersByTime(800); // 처음 알림 기준으로는 만료됐을 시각
    expect(toasts.length).toBe(1);
    vi.advanceTimersByTime(400);
    expect(toasts.length).toBe(0);
  });

  test("다른 문구는 위로 비켜 쌓인다", () => {
    toast("A", 200, 400);
    toast("B", 200, 400);
    expect(toasts.length).toBe(2);
    expect(toasts[1].y).toBeLessThan(toasts[0].y);
  });

  test("화면 가장자리에서 띄워도 알림 상자(최대 폭)가 화면 안에 들어오도록 가운데 쪽으로 보정", () => {
    toast("보드가 가득 찼습니다! 재료를 합치거나 보관함에 넣으세요!", 20, 400); // 노드 환경 화면폭 412
    const half = Math.min(412 - 24, 340) / 2;
    expect(toasts[0].x - half).toBeGreaterThanOrEqual(12);
    expect(toasts[0].x + half).toBeLessThanOrEqual(412 - 12);
  });
});
