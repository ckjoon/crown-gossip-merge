import { describe, test, expect } from "vitest";
import { simulate } from "./sim";
import { ROOMS } from "../../src/core/rules/rooms";
import { ZONE_ORDER } from "../../src/core/rules/progression";

// 효율 좋은 봇 기준 (사람은 배속 낭비·덜 효율적인 합성·충전 상한 낭비로 더 오래 걸림). 번개 자연 충전 = 하루 288개
// net = 쓴 번개 − 게임 안에서 얻은 번개(번개 조각·레벨업) = 자연 충전으로 채워야 하는 양
const DAY = 288;

describe("밸런스 시뮬레이션 (실제 액션만 쓰는 봇, 시드 3개)", () => {
  const runs = [7, 11, 23].map((seed) => simulate(seed, 40000));

  test("모든 시드가 제30화까지 끝까지 진행 가능 (막히는 상태 없음)", () => {
    for (const r of runs) expect(r.finished).toBe(true);
  });

  // v3.8: 생성기 흡수로 죽은 Lv.1 거미줄이 치워져 보드가 넓어진 만큼(봇 기준 약 1%) 공방 하한을 576 → 560으로
  test("공방 완료까지 자연 충전 약 2일분 이상(net ≥ 560), 전체는 33일분 이상(net ≥ 9,500)", () => {
    for (const r of runs) {
      const alc = r.chapters.find((c) => c.spotId === ROOMS.alchemy.spots[4].id)!;
      expect(alc.net).toBeGreaterThanOrEqual(560);
      expect(r.energy - r.income).toBeGreaterThanOrEqual(9500);
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
