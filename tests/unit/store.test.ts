import { test, expect } from "vitest";
import { createStore, type Action } from "../../src/core/store";
import { createInitialState } from "../../src/core/state";
import { grant, spend } from "../../src/core/economy";
import type { GameEvent } from "../../src/core/events";
import { fixedCtx } from "./helpers";

const addCoins: Action<{ n: number }> = (s, _ctx, p) => {
  const ev: GameEvent[] = [];
  grant(s, ev, "coins", p.n, "test");
  return ev;
};

test("subscribe는 즉시 현재 상태로 1회 호출", () => {
  const ctx = fixedCtx();
  const store = createStore(createInitialState(ctx), ctx);
  const seen: number[] = [];
  store.subscribe((s) => seen.push(s.coins));
  expect(seen).toEqual([350]);
});

test("dispatch는 새 상태 객체로 교체하고 구독자·이벤트 리스너를 호출", () => {
  const ctx = fixedCtx();
  const store = createStore(createInitialState(ctx), ctx);
  const before = store.get();
  const states: unknown[] = [];
  const events: GameEvent[] = [];
  store.subscribe((s) => states.push(s));
  store.onEvent((e) => events.push(e));
  const ret = store.dispatch(addCoins, { n: 50 });
  expect(store.get()).not.toBe(before);
  expect(before.coins).toBe(350);
  expect(store.get().coins).toBe(400);
  expect(states.length).toBe(2);
  expect(events).toEqual([{ type: "currencyChanged", currency: "coins", delta: 50, reason: "test" }]);
  expect(ret).toEqual(events);
});

test("행동이 예외를 던지면 상태는 그대로", () => {
  const ctx = fixedCtx();
  const store = createStore(createInitialState(ctx), ctx);
  const before = store.get();
  const boom: Action<void> = (s) => {
    s.coins = 0;
    throw new Error("boom");
  };
  expect(() => store.dispatch(boom, undefined)).toThrow("boom");
  expect(store.get()).toBe(before);
  expect(store.get().coins).toBe(350);
});

test("economy: spend 부족 시 false, 변경·이벤트 없음 / 음수 grant 무시", () => {
  const s = createInitialState(fixedCtx());
  const ev: GameEvent[] = [];
  expect(spend(s, ev, "gems", 11, "x")).toBe(false);
  expect(s.gems).toBe(10);
  expect(ev).toEqual([]);
  expect(spend(s, ev, "gems", 4, "shop")).toBe(true);
  expect(s.gems).toBe(6);
  grant(s, ev, "energy", -5, "bad");
  expect(s.energy).toBe(100);
  expect(ev).toEqual([{ type: "currencyChanged", currency: "gems", delta: -4, reason: "shop" }]);
});
