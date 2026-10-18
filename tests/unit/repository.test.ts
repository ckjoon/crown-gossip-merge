import { describe, test, expect, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createRepository, type SaveRepository } from "../../src/services/save/repository";
import { createAutosave } from "../../src/services/save/autosave";
import { createInitialState } from "../../src/core/state";
import { createStore } from "../../src/core/store";
import { grant } from "../../src/core/economy";
import type { GameEvent } from "../../src/core/events";
import { fixedCtx } from "./helpers";

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

describe("저장소", () => {
  test("저장 → 불러오기 (IDB + LS 동시 기록)", async () => {
    const ls = memStorage();
    const repo = createRepository(new IDBFactory(), ls);
    const s = createInitialState(fixedCtx());
    await repo.save(s, 100);
    const rec = await repo.load();
    expect(rec?.schemaVersion).toBe(4);
    expect(rec?.updatedAt).toBe(100);
    expect(JSON.parse(ls.getItem("crown_gossip_save_backup_v1")!).updatedAt).toBe(100);
  });
  test("LS만 있을 때와 둘 중 최신본 선택", async () => {
    const ls = memStorage();
    ls.setItem("crown_gossip_save_backup_v1", JSON.stringify({ id: "main_save_v1", schemaVersion: 3, updatedAt: 50, data: { coins: 1 } }));
    const idb = new IDBFactory();
    expect((await createRepository(idb, ls).load())?.updatedAt).toBe(50);
    const s = createInitialState(fixedCtx());
    await createRepository(idb, memStorage()).save(s, 40);
    expect((await createRepository(idb, ls).load())?.updatedAt).toBe(50);
    expect((await createRepository(null, null).load())).toBeNull();
  });
});

describe("묶음 저장", () => {
  test("300ms 안의 변경 3번은 저장 1번, 보석 변경은 즉시 저장", async () => {
    vi.useFakeTimers();
    const ctx = fixedCtx();
    const store = createStore(createInitialState(ctx), ctx);
    const saves: number[] = [];
    const repo: SaveRepository = { load: async () => null, save: async (s) => void saves.push(s.coins) };
    const auto = createAutosave(store, repo, { debounceMs: 300, now: () => 1 });
    const add = (cur: "coins" | "gems") => store.dispatch((d) => { const ev: GameEvent[] = []; grant(d, ev, cur, 1, "t"); return ev; }, undefined);
    add("coins");
    add("coins");
    add("coins");
    expect(saves.length).toBe(0);
    await vi.advanceTimersByTimeAsync(300);
    expect(saves).toEqual([353]);
    add("gems");
    await vi.advanceTimersByTimeAsync(0);
    expect(saves.length).toBe(2);
    auto.dispose();
    vi.useRealTimers();
  });
});

describe("묶음 저장: 일시적 변경", () => {
  test("transient dispatch(번개 타이머)는 저장을 예약하지 않음, 충전 이벤트가 있으면 저장", async () => {
    vi.useFakeTimers();
    const ctx = fixedCtx();
    const store = createStore(createInitialState(ctx), ctx);
    let saves = 0;
    const repo: SaveRepository = { load: async () => null, save: async () => void saves++ };
    const auto = createAutosave(store, repo, { debounceMs: 300, now: () => 1 });
    store.dispatch((d) => { d.energyCountdown -= 1; return []; }, undefined, { transient: true });
    await vi.advanceTimersByTimeAsync(400);
    expect(saves).toBe(0);
    store.dispatch((d) => { d.energy += 1; return [{ type: "energyRegen", energy: d.energy }]; }, undefined, { transient: true });
    await vi.advanceTimersByTimeAsync(400);
    expect(saves).toBe(1);
    auto.dispose();
    vi.useRealTimers();
  });
});
