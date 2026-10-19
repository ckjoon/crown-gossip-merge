// orders.ts — 손님 주문: 구역별 상한·손님 명단으로 생성, 보드 재료 매칭, 주문 완료, 💎로 재료 바로 구매

import { newUid, type Ctx } from "../ctx";
import { grant, spend } from "../economy";
import { rejected, type GameEvent } from "../events";
import type { Action } from "../store";
import { CUSTOMERS_BY_ZONE } from "../rules/customers";
import { ROOMS } from "../rules/rooms";
import { ORDER_ENERGY_CHANCE, computeZoneProgress, getItemGemPrice, rollOrderReqs, spawnRange, ZONE_ORDER, type ZoneProgress } from "../rules/progression";
import { bagSize, orderCoins, orderXP, unlockedChains } from "../rules/levels";
import { type BoardItem, type GameState, type Order, type OrderReq, type ZoneKey } from "../types";
import { findNearestEmptyCell } from "./board";
import { gainXP } from "./progress";

export function getZoneProgress(s: GameState): ZoneProgress {
  return computeZoneProgress(
    ZONE_ORDER.map((key) => ({ key, spots: ROOMS[key].spots.map((sp) => ({ id: sp.id, done: !!s.rooms[sp.id]?.done })) })),
    s.playerLv,
  );
}

export function getCurrentZoneKey(s: GameState): ZoneKey {
  return getZoneProgress(s).currentZoneKey;
}

export function createOrder(s: GameState, ctx: Ctx, slotIdx: number, customReqs?: OrderReq[]): Order {
  const zoneKey = getCurrentZoneKey(s);
  const list = CUSTOMERS_BY_ZONE[zoneKey] ?? CUSTOMERS_BY_ZONE.alchemy;
  const cust = list[(s.playerLv + slotIdx) % list.length];
  const reqs: OrderReq[] = customReqs ?? rollOrderReqs(zoneKey, unlockedChains(s), ctx.rng);
  const coins = orderCoins(reqs);
  return { id: newUid(s), customer: { ...cust }, reqs: reqs.map((r) => ({ ...r })), coins };
}

export function initCustomerOrders(s: GameState, ctx: Ctx): void {
  s.orders = [
    createOrder(s, ctx, 0, [{ chain: "potion", level: 3 }]),
    createOrder(s, ctx, 1, [{ chain: "potion", level: 2 }, { chain: "tea", level: 2 }]),
    createOrder(s, ctx, 2, [{ chain: "grimoire", level: 2 }, { chain: "bakery", level: 2 }]),
  ];
}

// 이 체인 생성기들이 바로 만들 수 있는 가장 낮은 단계 (★1 → Lv.1, ★2·★3 → Lv.2). 생성기가 없으면 Infinity
export function minSpawnLevel(s: GameState, chain: string): number {
  return [...s.board, ...s.bag].reduce((m, it) => (it?.isGenerator && it.chain === chain ? Math.min(m, spawnRange(it.level || 1).min) : m), Infinity);
}

// 만들 수 없게 된 주문 요구를 그 체인이 만드는 가장 낮은 단계로 바꾼다 (생성기가 자라 Lv.1이 더 안 나오는 경우·예전 세이브).
// 보드·보관함·거미줄에 남아 있는 그 단계 재료 몫만큼은 그대로 둔다. 바뀐 요구 수를 돌려준다 (코인도 다시 계산)
export function fitOrdersToGenerators(s: GameState): number {
  const left = new Map<string, number>();
  for (const it of [...s.board, ...s.bag]) {
    if (it && !it.isGenerator && it.state !== "crate") left.set(`${it.chain}:${it.level}`, (left.get(`${it.chain}:${it.level}`) ?? 0) + 1);
  }
  let changed = 0;
  for (const o of s.orders) {
    let touched = false;
    for (const r of o.reqs) {
      const min = minSpawnLevel(s, r.chain);
      if (!Number.isFinite(min) || r.level >= min) continue;
      const key = `${r.chain}:${r.level}`;
      const n = left.get(key) ?? 0;
      if (n > 0) {
        left.set(key, n - 1);
        continue;
      }
      r.level = min;
      touched = true;
      changed++;
    }
    if (touched) o.coins = orderCoins(o.reqs);
  }
  return changed;
}

export interface OrderStatus {
  allReady: boolean;
  reqFulfilled: boolean[];
  matchedCells: number[];
}

// 각 주문 요구 재료에 대응하는 보드 칸 (한 칸은 한 요구에만 쓰임)
export function computeWanted(s: GameState): { wantedUids: Set<string>; status: OrderStatus[] } {
  const wantedUids = new Set<string>();
  const status = s.orders.map((ord) => {
    const used = new Set<string>();
    const reqFulfilled: boolean[] = [];
    const matchedCells: number[] = [];
    for (const req of ord.reqs) {
      const idx = s.board.findIndex((it) => it && it.state === "active" && !it.isGenerator && !used.has(it.uid) && it.chain === req.chain && it.level === req.level);
      if (idx !== -1) {
        const uid = s.board[idx]!.uid;
        used.add(uid);
        wantedUids.add(uid);
        matchedCells.push(idx);
        reqFulfilled.push(true);
      } else {
        reqFulfilled.push(false);
      }
    }
    return { allReady: reqFulfilled.every(Boolean), reqFulfilled, matchedCells };
  });
  return { wantedUids, status };
}

export const serveOrder: Action<{ orderIdx: number }> = (s, ctx, { orderIdx }) => {
  const st = computeWanted(s).status[orderIdx];
  const ord = s.orders[orderIdx];
  if (!st || !ord || !st.allReady) return [];
  const ev: GameEvent[] = [];
  for (const c of st.matchedCells) s.board[c] = null;
  grant(s, ev, "coins", ord.coins, "orderServed");
  gainXP(s, ev, orderXP(ord.reqs));
  // 주문 완료 시 번개 조각은 ORDER_ENERGY_CHANCE 확률로
  let bonusCell: number | null = null;
  if (ctx.rng() < ORDER_ENERGY_CHANCE) {
    const cell = findNearestEmptyCell(s, 27, ctx.rng);
    if (cell !== -1) {
      s.board[cell] = { uid: newUid(s), state: "active", isGenerator: false, chain: "energy", level: 1 };
      bonusCell = cell;
    }
  }
  ev.push({ type: "orderServed", orderIdx, cells: [...st.matchedCells], coins: ord.coins, bonusCell, customer: { ...ord.customer } });
  s.orders[orderIdx] = createOrder(s, ctx, orderIdx);
  return ev;
};

// 부족한 재료를 💎로 구매: 보드 빈칸 → 보관함 → 둘 다 가득이면 거부 (보석 차감 없음)
export const buyOrderRequirement: Action<{ orderIdx: number; reqIdx: number }> = (s, ctx, { orderIdx, reqIdx }) => {
  const req = s.orders[orderIdx]?.reqs[reqIdx];
  if (!req) return [];
  const price = getItemGemPrice(req.level);
  if (s.gems < price) return [rejected("notEnoughGems")];
  const cell = findNearestEmptyCell(s, null, ctx.rng);
  if (cell === -1 && s.bag.length >= bagSize(s.playerLv)) return [rejected("boardFull")];
  const ev: GameEvent[] = [];
  spend(s, ev, "gems", price, "buyOrderItem");
  const it: BoardItem = { uid: newUid(s), state: "active", isGenerator: false, chain: req.chain, level: req.level };
  if (cell !== -1) s.board[cell] = it;
  else s.bag.push(it);
  ev.push({ type: "itemBought", orderIdx, reqIdx, where: cell !== -1 ? "board" : "bag", cell: cell !== -1 ? cell : null, price });
  return ev;
};
