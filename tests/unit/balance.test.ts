import { describe, test, expect } from "vitest";
import { simulate } from "./sim";
import { ROOMS } from "../../src/core/rules/rooms";
import { ZONE_ORDER } from "../../src/core/rules/progression";

// 효율 좋은 봇 기준 (사람은 배속 낭비·덜 효율적인 합성·충전 상한 낭비로 더 오래 걸림). 번개 자연 충전 = 2분당 1개 = 하루 720개
// net = 쓴 번개 − 게임 안에서 얻은 번개(번개 조각·레벨업) = 자연 충전으로 채워야 하는 양
// v3.10: 과금 유도가 아니라 처음부터 끝까지 매끄럽게 — Gossip Harbor 속도(2분당 1⚡)에 드롭 상향, 예전(하루 288개로 33일분 이상)보다 훨씬 빠름
const DAY = 720;

describe("밸런스 시뮬레이션 (실제 액션만 쓰는 봇, 시드 3개)", () => {
  const runs = [7, 11, 23].map((seed) => simulate(seed, 40000));

  test("모든 시드가 제30화까지 끝까지 진행 가능 (막히는 상태 없음)", () => {
    for (const r of runs) expect(r.finished).toBe(true);
  });

  test("공방(제1~5화)은 첫날 충전분 안에 끝나되 거저는 아님, 전체는 자연 충전 6~10일분", () => {
    for (const r of runs) {
      const alc = r.chapters.find((c) => c.spotId === ROOMS.alchemy.spots[4].id)!;
      expect(alc.net).toBeGreaterThanOrEqual(200);
      expect(alc.net).toBeLessThanOrEqual(DAY);
      expect(r.energy - r.income).toBeGreaterThanOrEqual(DAY * 6);
      expect(r.energy - r.income).toBeLessThanOrEqual(DAY * 10);
    }
  });

  // v3.10: 화마다 드는 번개가 매끄럽게 늘어남 — 구역이 바뀌어도 뚝 떨어지거나 한 번에 확 뛰지 않음 (시드 3개 평균, 제3화부터)
  test("화별 번개 곡선이 매끄러움: 5화 이동평균이 계속 오르고, 마지막 5화는 제3~7화의 6배 이하", () => {
    const per = (i: number) => runs.reduce((n, r) => n + r.chapters[i].energy - (r.chapters[i - 1]?.energy ?? 0), 0) / runs.length;
    const avg5 = (i: number) => [0, 1, 2, 3, 4].reduce((n, k) => n + per(i + k), 0) / 5;
    for (let i = 3; i + 4 < 30; i++) expect(avg5(i), `ch${i + 1}~${i + 5}`).toBeGreaterThan(avg5(i - 1) * 0.95);
    expect(avg5(25)).toBeLessThanOrEqual(avg5(2) * 6);
  });

  // v3.9: 체인마다 ★★★ 하나까지, ★★★는 이야기 내내 천천히 (예전엔 제2화에 가마솥 ★★★, 제15화에 전부 ★★★)
  test("같은 체인 ★★★가 둘이 되는 일 없음, 제10화엔 ★★★가 2체인 이하, 끝날 때는 기본 5체인 모두 ★★★", () => {
    for (const r of runs) {
      for (const c of r.chapters) expect(c.dupStar3, `ch${c.chapter}`).toBe(0);
      const ch10 = r.chapters.find((c) => c.chapter === 10)!;
      expect(Object.values(ch10.stars).filter((t) => t >= 3).length).toBeLessThanOrEqual(2);
      const last = r.chapters[r.chapters.length - 1];
      for (const c of ["potion", "grimoire", "herb", "bakery", "tea"]) expect(last.stars[c], c).toBe(3);
    }
  });

  // v3.10: 레벨 잠금은 거의 안 걸리게 (코인은 모였는데 레벨 때문에 기다리는 건 매끄럽지 않음). 걸려도 반나절분 이하
  test("구역 입장 레벨 때문에 기다리는 번개는 반나절분 이하", () => {
    for (const r of runs) for (const c of r.chapters) expect(c.lockedEnergy, `ch${c.chapter}`).toBeLessThanOrEqual(DAY * 0.5);
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
