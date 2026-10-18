// economy.ts — 코인·보석·번개 지급/차감의 단일 창구. 나중에 결제·서버 저장을 붙일 때 이 창구만 서버 어댑터로 바꾼다
// reason은 지급 사유(로그·서버 검증용): "spawn", "orderServed", "zoneComplete", "levelUp", "gemShop" …

import type { Currency, GameEvent } from "./events";
import type { GameState } from "./types";

export function grant(s: GameState, ev: GameEvent[], currency: Currency, amount: number, reason: string): void {
  if (!(amount > 0) || !Number.isFinite(amount)) return;
  const n = Math.floor(amount);
  s[currency] += n;
  ev.push({ type: "currencyChanged", currency, delta: n, reason });
}

export function spend(s: GameState, ev: GameEvent[], currency: Currency, amount: number, reason: string): boolean {
  const n = Math.floor(amount);
  if (!(n > 0)) return true;
  if (s[currency] < n) return false;
  s[currency] -= n;
  ev.push({ type: "currencyChanged", currency, delta: -n, reason });
  return true;
}
