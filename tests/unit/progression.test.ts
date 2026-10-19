import { test, expect } from "vitest";
import * as P from "../../src/core/rules/progression";

function seqRng(values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

function rooms(spec: Record<string, number[]>) {
  // spec 예: { alchemy: [1,1,0], harbor: [0,0] } → 1=완료
  return Object.entries(spec).map(([key, flags]) => ({
    key,
    spots: flags.map((f, i) => ({ id: `${key}_${i}`, done: f === 1 })),
  }));
}

test("새 게임: 현재 구역은 공방, 공방만 입장 가능, 다음 화는 공방 첫 장소", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [0, 0], harbor: [0, 0], garden: [0], banquet: [0] }));
  expect(zp.currentZoneKey).toBe("alchemy");
  expect(zp.accessibleKeys).toEqual(["alchemy"]);
  expect(zp.completedKeys).toEqual([]);
  expect(zp.nextSpotId).toBe("alchemy_0");
  expect(zp.chapterById.harbor_1).toBe(4);
  expect(zp.totalChapters).toBe(6);
});

test("공방 완성: 현재 구역은 오션카페로 넘어가고 공방도 계속 입장 가능", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [1, 1], harbor: [0, 0], garden: [0], banquet: [0] }));
  expect(zp.currentZoneKey).toBe("harbor");
  expect(zp.accessibleKeys).toEqual(["alchemy", "harbor"]);
  expect(zp.completedKeys).toEqual(["alchemy"]);
  expect(zp.nextSpotId).toBe("harbor_0");
});

test("v2.4.0 세이브 호환: 뒤쪽 구역에 진행이 있으면 그 구역도 입장 가능", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [1, 0], harbor: [0, 0], garden: [1], banquet: [0] }));
  expect(zp.currentZoneKey).toBe("alchemy");
  expect(zp.accessibleKeys).toEqual(["alchemy", "garden"]);
  expect(zp.nextSpotId).toBe("alchemy_1");
});

test("모두 완성: 현재 구역은 마지막 구역, 다음 화 없음", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [1], harbor: [1], garden: [1], banquet: [1] }));
  expect(zp.currentZoneKey).toBe("banquet");
  expect(zp.nextSpotId).toBe(null);
  expect(zp.completedKeys).toEqual(["alchemy", "harbor", "garden", "banquet"]);
});

test("다음 구역 키", () => {
  expect(P.getNextZoneKey("alchemy")).toBe("harbor");
  expect(P.getNextZoneKey("banquet")).toBe("cellar");
  expect(P.getNextZoneKey("tower")).toBe(null);
});

test("구역별 주문 상한과 복구 비용", () => {
  expect(P.getOrderLevelCap("alchemy")).toBe(4);
  expect(P.getOrderLevelCap("harbor")).toBe(5);
  expect(P.getOrderLevelCap("garden")).toBe(6);
  expect(P.getOrderLevelCap("banquet")).toBe(8);
  expect(P.getSpotCoinCost("alchemy", 2)).toBe(300);
  expect(P.getSpotCoinCost("banquet", 5)).toBe(6000);
});

test("주문 요구 레벨은 항상 2..상한 범위 (상한 끝값 포함)", () => {
  const core = ["potion", "tea"];
  const low = P.rollOrderReqs("alchemy", core, seqRng([0, 0, 0.99]));
  expect(low).toEqual([{ chain: "potion", level: 2 }]);
  const high = P.rollOrderReqs("banquet", core, seqRng([0.999, 0.999, 0.1, 0.999]));
  expect(high).toEqual([
    { chain: "tea", level: 8 },
    { chain: "tea", level: 7 },
  ]);
  for (let i = 0; i < 300; i++) {
    for (const r of P.rollOrderReqs("harbor", core)) {
      expect(r.level >= 1 && r.level <= 5).toBe(true);
    }
  }
});

test("생성기 등급 상한", () => {
  expect(P.getGeneratorTierCap(1)).toBe(3);
  expect(P.getGeneratorTierCap(2)).toBe(5);
  expect(P.getGeneratorTierCap(3)).toBe(6);
  expect(P.getGeneratorTierCap(9)).toBe(6);
});

test("생성기 기본 배출 범위", () => {
  for (let i = 0; i < 300; i++) {
    const a = P.rollBaseSpawn(1, 0);
    expect(!a.rare && a.level >= 1 && a.level <= 2).toBe(true);
    const b = P.rollBaseSpawn(2, 0);
    expect(!b.rare && b.level >= 2 && b.level <= 3).toBe(true);
    const c = P.rollBaseSpawn(3, 0);
    expect(!c.rare && c.level >= 2 && c.level <= 4).toBe(true);
  }
  expect(P.rollBaseSpawn(1, 0.2, seqRng([0.1]))).toEqual({ rare: true, level: 1 });
  expect(P.rollBaseSpawn(2, 0.2, seqRng([0.1]))).toEqual({ rare: true, level: 2 });
  expect(P.rollBaseSpawn(3, 0.2, seqRng([0.1]))).toEqual({ rare: true, level: 3 });
});

test("배속 순환과 검증", () => {
  expect(P.nextBoost(1)).toBe(2);
  expect(P.nextBoost(2)).toBe(4);
  expect(P.nextBoost(4)).toBe(1);
  expect(P.sanitizeBoost(3)).toBe(1);
  expect(P.sanitizeBoost(undefined)).toBe(1);
});

test("배속 적용: 단계·상한·번개 잔량", () => {
  expect(P.resolveBoost(1, 1, 3, 10)).toEqual({ level: 1, steps: 0, cost: 1 });
  expect(P.resolveBoost(1, 4, 3, 10)).toEqual({ level: 3, steps: 2, cost: 4 });
  // 상한에 걸리면 덜 오르고 덜 쓴다
  expect(P.resolveBoost(2, 4, 3, 10)).toEqual({ level: 3, steps: 1, cost: 2 });
  expect(P.resolveBoost(3, 4, 3, 10)).toEqual({ level: 3, steps: 0, cost: 1 });
  // 번개가 모자라면 가능한 배속으로 낮춘다
  expect(P.resolveBoost(1, 4, 6, 3)).toEqual({ level: 2, steps: 1, cost: 2 });
  expect(P.resolveBoost(1, 4, 6, 1)).toEqual({ level: 1, steps: 0, cost: 1 });
  expect(P.resolveBoost(1, 1, 3, 0)).toBe(null);
});

test("보석 가격과 별 환산", () => {
  expect(P.getItemGemPrice(4)).toBe(8);
  expect(P.getItemGemPrice(0)).toBe(2);
  expect(P.convertLegacyStars(4)).toBe(400);
  expect(P.convertLegacyStars(undefined)).toBe(0);
  expect(P.convertLegacyStars(-3)).toBe(0);
});

test("보석 상수", () => {
  expect(P.GEM_REWARDS).toEqual({ holidayMission: 5, zoneComplete: 50, levelUp: 3 });
  expect(P.STARTING_GEMS).toBe(10);
  expect(P.GEM_SHOP_ENERGY).toEqual([
    { gems: 10, energy: 50 },
    { gems: 25, energy: 150 },
  ]);
});

test("명절 미션 보상: 번개 없음, 보석은 이벤트당 10회까지만", () => {
  expect(P.getHolidayMissionReward(0)).toEqual({ energy: 0, gems: 5, freeSpawns: 0 });
  expect(P.getHolidayMissionReward(9)).toEqual({ energy: 0, gems: 5, freeSpawns: 0 });
  expect(P.getHolidayMissionReward(10)).toEqual({ energy: 0, gems: 0, freeSpawns: 0 });
});
