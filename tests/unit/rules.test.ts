import { describe, test, expect } from "vitest";
import { CHAINS, getRequiredXP, getItemMeta, getGeneratorTierMeta, formatGeneratorStars, CORE_CHAINS, getGeneratorChainForTheme } from "../../src/core/rules/chains";
import { ROOMS, ALL_SPOTS_IN_ORDER, findSpot, ambienceByProgress, STYLE_PALETTES } from "../../src/core/rules/rooms";
import { CHARACTERS, characterIdForName } from "../../src/core/rules/characters";
import { CUSTOMERS_BY_ZONE } from "../../src/core/rules/customers";
import { HOLIDAY_EVENTS, getHolidayConfig, getHolidayRemainingText } from "../../src/core/rules/holidays";
import { VERSION_HISTORY } from "../../src/core/rules/versionHistory";
import { ZONE_ORDER } from "../../src/core/rules/progression";

describe("체인 데이터", () => {
  test("6개 생산 체인은 모두 Lv.1~8", () => {
    for (const c of ["potion", "grimoire", "herb", "bakery", "tea", "gem"] as const) {
      expect(CHAINS[c].items.map((i) => i.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });
  test("v2.5 이름·판매가 유지", () => {
    expect(getItemMeta("potion", 8)).toMatchObject({ name: "마녀왕의 불로약", sell: 780, maxLv: 8 });
    expect(getItemMeta("gem", 1).name).toBe("광석 파편");
    expect(CHAINS.gem.name).toBe("마법 광석 체인 (가마솥 부산물)");
    expect(getItemMeta("coin", 2)).toMatchObject({ isCollectible: true, rewardType: "coins", amount: 45 });
  });
  test("레벨 범위 밖은 마지막 레벨로", () => {
    expect(getItemMeta("tea", 99).level).toBe(8);
  });
  test("생성기 등급 메타와 별 표기", () => {
    expect(getGeneratorTierMeta("potion", 2).name).toBe("황금 연금술 가마솥");
    expect(getGeneratorTierMeta("potion", 2).maxGenLv).toBe(3);
    expect(formatGeneratorStars(2)).toBe("★★☆");
  });
  test("XP 요구량과 구역별 생성기", () => {
    expect(getRequiredXP(1)).toBe(80);
    expect(getRequiredXP(3)).toBe(184);
    expect(CORE_CHAINS).toEqual(["potion", "grimoire", "herb", "bakery", "tea"]);
    expect(getGeneratorChainForTheme("harbor")).toBe("bakery");
  });
});

describe("방·스토리 데이터", () => {
  test("6개 구역 × 5개 장소, 제1화~제30화", () => {
    expect(Object.keys(ROOMS)).toEqual(ZONE_ORDER);
    for (const z of ZONE_ORDER) expect(ROOMS[z].spots.length).toBe(5);
    expect(ALL_SPOTS_IN_ORDER.map((e) => e.chapter)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(ALL_SPOTS_IN_ORDER[0].spot.id).toBe("alc_cauldron");
    expect(ALL_SPOTS_IN_ORDER[19].spot.id).toBe("bq_portal");
    expect(ALL_SPOTS_IN_ORDER[29].spot.id).toBe("tw_crown");
    expect(findSpot("hb_arch")?.zoneKey).toBe("harbor");
    expect(STYLE_PALETTES.length).toBe(3);
  });
  test("모든 대사 화자는 캐릭터 목록에 있음", () => {
    for (const e of ALL_SPOTS_IN_ORDER) {
      for (const d of e.spot.dialogues) expect(CHARACTERS[d.characterId], d.characterId).toBeDefined();
    }
  });
  test("방 분위기는 0~5단계, 밝기가 단계마다 증가", () => {
    expect(ambienceByProgress.length).toBe(6);
    for (let i = 1; i < 6; i++) expect(ambienceByProgress[i].ambientIntensity).toBeGreaterThan(ambienceByProgress[i - 1].ambientIntensity);
    expect(ambienceByProgress[0].dust).toBeGreaterThan(0);
    expect(ambienceByProgress[5].dust).toBe(0);
  });
});

describe("손님·캐릭터·명절·버전", () => {
  test("구역별 손님", () => {
    expect(Object.keys(CUSTOMERS_BY_ZONE)).toEqual(ZONE_ORDER);
    expect(characterIdForName("선장 마르코")).toBe("marco");
    expect(characterIdForName("퀸 (Quinn)")).toBe("quinn");
    expect(characterIdForName("없는 사람")).toBeNull();
  });
  test("명절 이벤트는 번개 보상 필드가 없음", () => {
    expect(HOLIDAY_EVENTS.length).toBe(4);
    for (const h of HOLIDAY_EVENTS) for (const it of h.items) expect("energyReward" in it).toBe(false);
    expect(getHolidayConfig("nope").id).toBe("halloween");
  });
  test("할로윈 기간 중 남은 시간 문구", () => {
    const h = getHolidayConfig("halloween");
    expect(getHolidayRemainingText(h, new Date(2026, 9, 29, 12, 0, 0))).toContain("진행중");
  });
  test("버전 기록에 v2.5.0 포함", () => {
    expect(VERSION_HISTORY.some((v) => v.version === "v2.5.0")).toBe(true);
  });
});
