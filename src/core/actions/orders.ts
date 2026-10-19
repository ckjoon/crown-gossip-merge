// orders.ts — 손님 주문: 구역별 상한·손님 명단으로 생성, 보드 재료 매칭, 주문 완료, 💎로 재료 바로 구매

import { newUid, type Ctx } from "../ctx";
import { grant, spend } from "../economy";
import { rejected, type GameEvent } from "../events";
import type { Action } from "../store";
import { CUSTOMERS_BY_ZONE } from "../rules/customers";
import { ROOMS } from "../rules/rooms";
import { computeZoneProgress, getItemGemPrice, rollOrderReqs, ZONE_ORDER, type ZoneProgress } from "../rules/progression";
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
    createOrder(s, ctx, 1, [{ chain: "potion", level: 2 }, { chain: "herb", level: 1 }]),
    createOrder(s, ctx, 2, [{ chain: "grimoire", level: 2 }, { chain: "bakery", level: 2 }]),
  ];
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
  // 주문 완료 시 번개 조각은 8% 확률로만
  let bonusCell: number | null = null;
  if (ctx.rng() < 0.08) {
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
