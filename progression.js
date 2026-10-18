// progression.js — 구역 진행·주문 상한·생성기 배출·배속 부스트·재화 환산 같은 순수 게임 규칙 모음
// DOM에 의존하지 않으므로 Node 테스트(tests/progression.test.js)로 검증합니다. db.js / interior3d.js / game.js보다 먼저 로드됩니다.

window.GameProgression = (function () {
  // 마녀의 성 구역 순서 (세이브 호환을 위해 기존 키 유지)
  const ZONE_ORDER = ["alchemy", "harbor", "garden", "banquet"];
  // 구역별 손님 주문 요구 레벨 상한
  const ORDER_LEVEL_CAP = { alchemy: 4, harbor: 5, garden: 6, banquet: 8 };
  // 장소 복구 비용 = spot.cost × 구역 단가(🪙)
  const ZONE_COIN_UNIT = { alchemy: 150, harbor: 300, garden: 600, banquet: 1200 };
  // 생성기 등급(★)별 한 번에 나오게 할 수 있는 최대 재료 레벨
  const GENERATOR_TIER_CAP = { 1: 3, 2: 5, 3: 6 };
  // 배속별 추가 단계 (×2 = +1단계, ×4 = +2단계)
  const BOOST_STEPS = { 1: 0, 2: 1, 4: 2 };
  const BOOST_CYCLE = [1, 2, 4];
  const LEGACY_STAR_TO_COINS = 100;

  const GEM_REWARDS = { holidayMission: 5, zoneComplete: 50, levelUp: 3 };
  const GEM_SHOP_ENERGY = [
    { gems: 10, energy: 50 },
    { gems: 25, energy: 150 },
  ];
  const STARTING_GEMS = 10;

  // rooms: [{ key, spots: [{ id, done }] }] (ZONE_ORDER 순서)
  function computeZoneProgress(rooms) {
    const completedKeys = [];
    const accessibleKeys = [];
    const chapterById = {};
    let currentZoneKey = null;
    let nextSpotId = null;
    let chapter = 0;

    for (const room of rooms) {
      const allDone = room.spots.length > 0 && room.spots.every((s) => s.done);
      const anyDone = room.spots.some((s) => s.done);
      for (const s of room.spots) {
        chapter++;
        chapterById[s.id] = chapter;
        if (!s.done && nextSpotId === null) nextSpotId = s.id;
      }
      if (allDone) completedKeys.push(room.key);
      if (!allDone && currentZoneKey === null) currentZoneKey = room.key;
      // 현재 구역까지는 모두 입장 가능, 그 뒤는 이미 진행한 장소가 있는 구역만 (v2.4.0 세이브 호환)
      if (currentZoneKey === null || currentZoneKey === room.key || anyDone) {
        accessibleKeys.push(room.key);
      }
    }

    if (currentZoneKey === null) {
      currentZoneKey = rooms.length > 0 ? rooms[rooms.length - 1].key : ZONE_ORDER[0];
    }
    return { currentZoneKey, accessibleKeys, completedKeys, nextSpotId, chapterById, totalChapters: chapter };
  }

  function getNextZoneKey(zoneKey) {
    const i = ZONE_ORDER.indexOf(zoneKey);
    return i >= 0 && i < ZONE_ORDER.length - 1 ? ZONE_ORDER[i + 1] : null;
  }

  function getOrderLevelCap(zoneKey) {
    return ORDER_LEVEL_CAP[zoneKey] || ORDER_LEVEL_CAP.alchemy;
  }

  function getSpotCoinCost(zoneKey, baseCost) {
    return Math.max(1, Math.floor(baseCost || 1)) * (ZONE_COIN_UNIT[zoneKey] || ZONE_COIN_UNIT.alchemy);
  }

  // 체인·레벨은 랜덤, 상한만 구역이 결정 (첫 요구 Lv.2~상한, 55% 확률로 한 단계 낮은 두 번째 요구)
  function rollOrderReqs(zoneKey, coreChains, rng = Math.random) {
    const cap = getOrderLevelCap(zoneKey);
    const pick = () => coreChains[Math.min(coreChains.length - 1, Math.floor(rng() * coreChains.length))];
    const lv1 = Math.min(cap, 2 + Math.floor(rng() * (cap - 1)));
    const reqs = [{ chain: pick(), level: lv1 }];
    if (rng() < 0.55) {
      reqs.push({ chain: pick(), level: Math.max(1, lv1 - 1) });
    }
    return reqs;
  }

  function clampTier(tier) {
    return Math.min(3, Math.max(1, Math.floor(tier) || 1));
  }

  function getGeneratorTierCap(tier) {
    return GENERATOR_TIER_CAP[clampTier(tier)];
  }

  // 등급별 기본 배출 (rare=true면 부산물 체인)
  function rollBaseSpawn(tier, rareChance, rng = Math.random) {
    const t = clampTier(tier);
    const hasRare = rareChance > 0;
    if (t === 1) {
      if (hasRare && rng() < rareChance) return { rare: true, level: 1 };
      return { rare: false, level: rng() < 0.18 ? 2 : 1 };
    }
    if (t === 2) {
      if (hasRare && rng() < 0.2) return { rare: true, level: 2 };
      return { rare: false, level: rng() < 0.35 ? 3 : 2 };
    }
    if (hasRare && rng() < 0.22) return { rare: true, level: 3 };
    const r = rng();
    return { rare: false, level: r < 0.3 ? 4 : r < 0.79 ? 3 : 2 };
  }

  function sanitizeBoost(b) {
    return BOOST_CYCLE.includes(b) ? b : 1;
  }

  function nextBoost(b) {
    const i = BOOST_CYCLE.indexOf(sanitizeBoost(b));
    return BOOST_CYCLE[(i + 1) % BOOST_CYCLE.length];
  }

  // 배속 적용: 등급 상한과 번개 잔량에 맞춰 실제로 올릴 단계(steps)와 번개 소모(2^steps)를 계산. 번개가 1 미만이면 null
  function resolveBoost(baseLevel, boost, cap, energy) {
    if (!(energy >= 1)) return null;
    const want = BOOST_STEPS[sanitizeBoost(boost)];
    let steps = Math.max(0, Math.min(want, cap - baseLevel));
    while (steps > 0 && Math.pow(2, steps) > energy) steps--;
    return { level: baseLevel + steps, steps, cost: Math.pow(2, steps) };
  }

  function getItemGemPrice(level) {
    return Math.max(1, Math.floor(level) || 1) * 2;
  }

  function convertLegacyStars(stars) {
    return typeof stars === "number" && stars > 0 ? Math.floor(stars) * LEGACY_STAR_TO_COINS : 0;
  }

  return {
    ZONE_ORDER,
    GEM_REWARDS,
    GEM_SHOP_ENERGY,
    STARTING_GEMS,
    computeZoneProgress,
    getNextZoneKey,
    getOrderLevelCap,
    getSpotCoinCost,
    rollOrderReqs,
    getGeneratorTierCap,
    rollBaseSpawn,
    sanitizeBoost,
    nextBoost,
    resolveBoost,
    getItemGemPrice,
    convertLegacyStars,
  };
})();
