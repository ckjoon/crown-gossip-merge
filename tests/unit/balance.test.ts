import { describe, test, expect } from "vitest";
import { simulate } from "./sim";
import { ROOMS } from "../../src/core/rules/rooms";
import { ZONE_ORDER } from "../../src/core/rules/progression";

// 효율 좋은 봇 기준 (사람은 더 오래 걸림). 번개 자연 충전 = 하루 288개
const DAY = 288;

describe("밸런스 시뮬레이션 (실제 액션만 쓰는 봇, 시드 3개)", () => {
  const runs = [7, 11, 23].map((seed) => simulate(seed, 40000));

  test("모든 시드가 제30화까지 끝까지 진행 가능 (막히는 상태 없음)", () => {
    for (const r of runs) expect(r.finished).toBe(true);
  });

  test("공방 완료까지 번개 ≥ 600 (2일 이상), 전체는 ≥ 12,000 (40일 이상)", () => {
    for (const r of runs) {
      const alc = r.chapters.find((c) => c.spotId === ROOMS.alchemy.spots[4].id)!;
      expect(alc.energy).toBeGreaterThanOrEqual(600);
      expect(r.energy).toBeGreaterThanOrEqual(12000);
    }
  });

  test("구역 입장 레벨이 실제로 길을 막되, 한 번에 1.5일분을 넘게 기다리게 하지 않음", () => {
    for (const r of runs) {
      expect(r.chapters.some((c) => c.lockedEnergy > 0)).toBe(true);
      for (const c of r.chapters) expect(c.lockedEnergy, `ch${c.chapter}`).toBeLessThanOrEqual(DAY * 1.5);
    }
  });

  test("뒤 구역일수록 오래 걸림 (구역별 번개가 늘어남)", () => {
    const r = runs[0];
    const endOf = (z: (typeof ZONE_ORDER)[number]) => r.chapters.find((c) => c.spotId === ROOMS[z].spots[4].id)!.energy;
    let prev = 0;
    let prevSpan = 0;
    for (const z of ZONE_ORDER) {
      const span = endOf(z) - prev;
      expect(span, z).toBeGreaterThan(prevSpan * 0.9);
      prevSpan = span;
      prev = endOf(z);
    }
  });
});
