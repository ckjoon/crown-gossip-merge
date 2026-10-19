import { test, expect } from "vitest";
import { createInitialState } from "../../src/core/state";
import { tickEnergy, buyEnergyPack, toggleBoost, setSetting } from "../../src/core/actions/progress";
import { fixedCtx } from "./helpers";

test("번개 자연 충전: 120초마다 +1, 100에서 멈춤", () => {
  const s = createInitialState(fixedCtx());
  s.energy = 98;
  tickEnergy(s, fixedCtx(), { seconds: 120 });
  expect(s.energy).toBe(99);
  expect(s.energyCountdown).toBe(120);
  tickEnergy(s, fixedCtx(), { seconds: 900 });
  expect(s.energy).toBe(100);
  s.energy = 150;
  s.energyCountdown = 12;
  tickEnergy(s, fixedCtx(), { seconds: 1 });
  expect(s.energy).toBe(150);
  expect(s.energyCountdown).toBe(120);
});

test("💎 상점: 💎10 → +50⚡, 부족하면 거부", () => {
  const s = createInitialState(fixedCtx());
  buyEnergyPack(s, fixedCtx(), { pack: 0 });
  expect([s.gems, s.energy]).toEqual([0, 150]);
  expect(buyEnergyPack(s, fixedCtx(), { pack: 0 })).toEqual([{ type: "rejected", reason: "notEnoughGems" }]);
});

test("배속 순환과 설정", () => {
  const s = createInitialState(fixedCtx());
  toggleBoost(s, fixedCtx(), undefined);
  toggleBoost(s, fixedCtx(), undefined);
  expect(s.boostMultiplier).toBe(4);
  setSetting(s, fixedCtx(), { key: "reduceMotion", value: true });
  expect(s.settings.reduceMotion).toBe(true);
});
