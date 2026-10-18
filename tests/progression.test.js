const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGlobalPlain, seqRng } = require("./helpers/load-global");

const P = loadGlobalPlain("progression.js", "GameProgression");

function rooms(spec) {
  // spec 예: { alchemy: [1,1,0], harbor: [0,0] } → 1=완료
  return Object.entries(spec).map(([key, flags]) => ({
    key,
    spots: flags.map((f, i) => ({ id: `${key}_${i}`, done: f === 1 })),
  }));
}

test("새 게임: 현재 구역은 공방, 공방만 입장 가능, 다음 화는 공방 첫 장소", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [0, 0], harbor: [0, 0], garden: [0], banquet: [0] }));
  assert.equal(zp.currentZoneKey, "alchemy");
  assert.deepEqual(zp.accessibleKeys, ["alchemy"]);
  assert.deepEqual(zp.completedKeys, []);
  assert.equal(zp.nextSpotId, "alchemy_0");
  assert.equal(zp.chapterById.harbor_1, 4);
  assert.equal(zp.totalChapters, 6);
});

test("공방 완성: 현재 구역은 오션카페로 넘어가고 공방도 계속 입장 가능", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [1, 1], harbor: [0, 0], garden: [0], banquet: [0] }));
  assert.equal(zp.currentZoneKey, "harbor");
  assert.deepEqual(zp.accessibleKeys, ["alchemy", "harbor"]);
  assert.deepEqual(zp.completedKeys, ["alchemy"]);
  assert.equal(zp.nextSpotId, "harbor_0");
});

test("v2.4.0 세이브 호환: 뒤쪽 구역에 진행이 있으면 그 구역도 입장 가능", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [1, 0], harbor: [0, 0], garden: [1], banquet: [0] }));
  assert.equal(zp.currentZoneKey, "alchemy");
  assert.deepEqual(zp.accessibleKeys, ["alchemy", "garden"]);
  assert.equal(zp.nextSpotId, "alchemy_1");
});

test("모두 완성: 현재 구역은 마지막 구역, 다음 화 없음", () => {
  const zp = P.computeZoneProgress(rooms({ alchemy: [1], harbor: [1], garden: [1], banquet: [1] }));
  assert.equal(zp.currentZoneKey, "banquet");
  assert.equal(zp.nextSpotId, null);
  assert.deepEqual(zp.completedKeys, ["alchemy", "harbor", "garden", "banquet"]);
});

test("다음 구역 키", () => {
  assert.equal(P.getNextZoneKey("alchemy"), "harbor");
  assert.equal(P.getNextZoneKey("banquet"), null);
});

test("구역별 주문 상한과 복구 비용", () => {
  assert.equal(P.getOrderLevelCap("alchemy"), 4);
  assert.equal(P.getOrderLevelCap("harbor"), 5);
  assert.equal(P.getOrderLevelCap("garden"), 6);
  assert.equal(P.getOrderLevelCap("banquet"), 8);
  assert.equal(P.getSpotCoinCost("alchemy", 2), 300);
  assert.equal(P.getSpotCoinCost("banquet", 5), 6000);
});

test("주문 요구 레벨은 항상 2..상한 범위 (상한 끝값 포함)", () => {
  const core = ["potion", "tea"];
  const low = P.rollOrderReqs("alchemy", core, seqRng([0, 0, 0.99]));
  assert.deepEqual(low, [{ chain: "potion", level: 2 }]);
  const high = P.rollOrderReqs("banquet", core, seqRng([0.999, 0.999, 0.1, 0.999]));
  assert.deepEqual(high, [
    { chain: "tea", level: 8 },
    { chain: "tea", level: 7 },
  ]);
  for (let i = 0; i < 300; i++) {
    for (const r of P.rollOrderReqs("harbor", core)) {
      assert.ok(r.level >= 1 && r.level <= 5, `harbor 상한 초과: ${r.level}`);
    }
  }
});

test("생성기 등급 상한", () => {
  assert.equal(P.getGeneratorTierCap(1), 3);
  assert.equal(P.getGeneratorTierCap(2), 5);
  assert.equal(P.getGeneratorTierCap(3), 6);
  assert.equal(P.getGeneratorTierCap(9), 6);
});

test("생성기 기본 배출 범위", () => {
  for (let i = 0; i < 300; i++) {
    const a = P.rollBaseSpawn(1, 0);
    assert.ok(!a.rare && a.level >= 1 && a.level <= 2);
    const b = P.rollBaseSpawn(2, 0);
    assert.ok(!b.rare && b.level >= 2 && b.level <= 3);
    const c = P.rollBaseSpawn(3, 0);
    assert.ok(!c.rare && c.level >= 2 && c.level <= 4);
  }
  assert.deepEqual(P.rollBaseSpawn(1, 0.2, seqRng([0.1])), { rare: true, level: 1 });
  assert.deepEqual(P.rollBaseSpawn(2, 0.2, seqRng([0.1])), { rare: true, level: 2 });
  assert.deepEqual(P.rollBaseSpawn(3, 0.2, seqRng([0.1])), { rare: true, level: 3 });
});

test("배속 순환과 검증", () => {
  assert.equal(P.nextBoost(1), 2);
  assert.equal(P.nextBoost(2), 4);
  assert.equal(P.nextBoost(4), 1);
  assert.equal(P.sanitizeBoost(3), 1);
  assert.equal(P.sanitizeBoost(undefined), 1);
});

test("배속 적용: 단계·상한·번개 잔량", () => {
  assert.deepEqual(P.resolveBoost(1, 1, 3, 10), { level: 1, steps: 0, cost: 1 });
  assert.deepEqual(P.resolveBoost(1, 4, 3, 10), { level: 3, steps: 2, cost: 4 });
  // 상한에 걸리면 덜 오르고 덜 쓴다
  assert.deepEqual(P.resolveBoost(2, 4, 3, 10), { level: 3, steps: 1, cost: 2 });
  assert.deepEqual(P.resolveBoost(3, 4, 3, 10), { level: 3, steps: 0, cost: 1 });
  // 번개가 모자라면 가능한 배속으로 낮춘다
  assert.deepEqual(P.resolveBoost(1, 4, 6, 3), { level: 2, steps: 1, cost: 2 });
  assert.deepEqual(P.resolveBoost(1, 4, 6, 1), { level: 1, steps: 0, cost: 1 });
  assert.equal(P.resolveBoost(1, 1, 3, 0), null);
});

test("보석 가격과 별 환산", () => {
  assert.equal(P.getItemGemPrice(4), 8);
  assert.equal(P.getItemGemPrice(0), 2);
  assert.equal(P.convertLegacyStars(4), 400);
  assert.equal(P.convertLegacyStars(undefined), 0);
  assert.equal(P.convertLegacyStars(-3), 0);
});

test("보석 상수", () => {
  assert.deepEqual(P.GEM_REWARDS, { holidayMission: 5, zoneComplete: 50, levelUp: 3 });
  assert.equal(P.STARTING_GEMS, 10);
  assert.deepEqual(P.GEM_SHOP_ENERGY, [
    { gems: 10, energy: 50 },
    { gems: 25, energy: 150 },
  ]);
});

test("명절 미션 보상: 번개 없음, 보석은 이벤트당 10회까지만", () => {
  assert.deepEqual(P.getHolidayMissionReward(0), { energy: 0, gems: 5, freeSpawns: 0 });
  assert.deepEqual(P.getHolidayMissionReward(9), { energy: 0, gems: 5, freeSpawns: 0 });
  assert.deepEqual(P.getHolidayMissionReward(10), { energy: 0, gems: 0, freeSpawns: 0 });
});
