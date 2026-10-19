// restore.ts — 저장 기록 → 게임 상태. v2 기록은 마이그레이션(세이브 정리 포함), v4 기록은 검증만 한다
// v2.5 db.js mergeWithDefaultState의 모든 안전장치(숫자 검증, 오프라인 번개 충전, 보드 검증, 필수 생성기 보충)를 포함

import { newUid, type Ctx } from "../../core/ctx";
import type { GenChain } from "../../core/types";
import { initCustomerOrders, createOrder, getZoneProgress, fitOrdersToGenerators } from "../../core/actions/orders";
import { trimSurplusGenerators } from "../../core/actions/progress";
import { absorbOrphans } from "../../core/actions/board";
import type { GameEvent } from "../../core/events";
import { sweepCodex } from "../../core/codex";
import { initHolidayBoard } from "../../core/actions/holiday";
import { createInitialState } from "../../core/state";
import { CHAINS } from "../../core/rules/chains";
import { BAG_MAX, isExtraChain, unlockedChains } from "../../core/rules/levels";
import { ALL_SPOTS_IN_ORDER } from "../../core/rules/rooms";
import { sanitizeBoost, ZONE_ORDER } from "../../core/rules/progression";
import { getHolidayConfig } from "../../core/rules/holidays";
import {
  ENERGY_REGEN_SEC,
  EVENT_CELLS,
  NATURAL_ENERGY_CAP,
  TOTAL_CELLS,
  type BoardItem,
  type ChainId,
  type EventItem,
  type GameState,
  type Order,
  type ZoneKey,
} from "../../core/types";
import { migrateV2ToV4, type MigrationReport } from "./migrations";
import type { SaveRecord } from "./repository";

type Raw = Record<string, unknown>;

export function asObj(v: unknown): Raw | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : null;
}

// 0 이상의 유한한 수만 받아 정수로 (아니면 기본값)
export function num(v: unknown, def: number, min = 0): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min ? Math.floor(v) : def;
}

function isChain(v: unknown): v is ChainId {
  return typeof v === "string" && Object.hasOwn(CHAINS, v);
}

export function restoreBoardItem(raw: unknown, fallbackUid: string): BoardItem | null {
  const c = asObj(raw);
  if (!c || !isChain(c.chain)) return null;
  const isGenerator = !!c.isGenerator;
  const maxLv = isGenerator ? 3 : CHAINS[c.chain].items.length;
  const state = c.state === "crate" || c.state === "cobweb" ? c.state : "active";
  return {
    uid: typeof c.uid === "string" && c.uid ? c.uid : fallbackUid,
    state,
    isGenerator,
    chain: c.chain,
    level: Math.max(1, Math.min(maxLv, num(c.level, 1, 1))),
  };
}

export function restoreBoard(s: GameState, raw: unknown, now: number): void {
  if (!Array.isArray(raw) || raw.length !== TOTAL_CELLS) return;
  s.board = raw.map((c, i) => restoreBoardItem(c, `restored_${i}_${now}`));
}

// 필수 생성기(기본 5종 + 레벨로 해금된 체인)가 보드에도 보관함에도 없으면 빈칸에 자동 지급 (보관함에 넣어 두고 새로고침해 공짜로 받는 것 방지)
// 돌려주는 값: 이번에 새로 받은 레벨 해금 체인 (불러온 뒤 "새 생성기를 받았어요" 안내용)
export function ensureGenerators(s: GameState): GenChain[] {
  const granted: GenChain[] = [];
  for (const chain of unlockedChains(s)) {
    const owned = [...s.board, ...s.bag].some((it) => it && it.isGenerator && it.chain === chain);
    if (owned) continue;
    const gen = { uid: newUid(s), state: "active" as const, isGenerator: true, chain, level: 1 };
    const empty = s.board.findIndex((it) => it === null);
    let placed = true;
    if (empty !== -1) s.board[empty] = gen;
    // 새 체인(구역 완성 보상)은 생성기가 없으면 주문을 만들 수 없으므로 보드가 꽉 차면 보관함에 — 보관함이 꽉 차도 넣는다(잠시 넘침)
    else if (isExtraChain(chain)) s.bag.push(gen);
    else placed = false;
    if (placed && isExtraChain(chain)) granted.push(chain);
  }
  return granted;
}

// 같은 uid(또는 주문 id)가 두 번 나오면 뒤의 것에 새 uid를 준다 (보드 표시·주문 매칭이 uid 기준이라 중복이면 아이템이 안 보임)
export function dedupeUids(s: GameState): void {
  const seen = new Set<string>();
  const fresh = (uid: string) => {
    if (!seen.has(uid)) {
      seen.add(uid);
      return uid;
    }
    const n = newUid(s);
    seen.add(n);
    return n;
  };
  s.board.forEach((c) => c && (c.uid = fresh(c.uid)));
  s.bag.forEach((c) => (c.uid = fresh(c.uid)));
  s.holiday.board.forEach((c) => c && (c.uid = fresh(c.uid)));
  s.orders.forEach((o) => (o.id = fresh(o.id)));
}

// 모든 아이템·주문에 새 uid 발급 (v2 uid는 실행할 때마다 순번이 다시 시작돼 겹칠 수 있음)
export function reassignAllUids(s: GameState): void {
  s.board.forEach((c) => c && (c.uid = newUid(s)));
  s.bag.forEach((c) => (c.uid = newUid(s)));
  s.holiday.board.forEach((c) => c && (c.uid = newUid(s)));
  s.orders.forEach((o) => (o.id = newUid(s)));
}

export function restoreBag(s: GameState, raw: unknown, now: number): void {
  if (!Array.isArray(raw)) return;
  s.bag = raw
    .map((c, i) => restoreBoardItem(c, `bag_${i}_${now}`))
    .filter((c): c is BoardItem => !!c)
    .map((c) => ({ ...c, state: "active" as const }))
    .slice(0, BAG_MAX); // 레벨별 보관함 크기 이하로 줄이지 않는다 (아이템 보존)
}

// 주문 3개가 모두 유효하면 복원 (v2의 stars 필드는 버림), 아니면 기본 주문 유지
export function restoreOrders(s: GameState, raw: unknown): void {
  if (!Array.isArray(raw) || raw.length !== 3) return;
  const orders: Order[] = [];
  for (const o of raw) {
    const ob = asObj(o);
    const cust = asObj(ob?.customer);
    if (!ob || !cust || !Array.isArray(ob.reqs) || ob.reqs.length === 0) return;
    const reqs = ob.reqs.map((r) => asObj(r));
    if (!reqs.every((r) => r && isChain(r.chain))) return;
    orders.push({
      id: typeof ob.id === "string" ? ob.id : `order_${orders.length}`,
      customer: { name: String(cust.name ?? ""), face: String(cust.face ?? "🙂"), line: String(cust.line ?? "") },
      reqs: reqs.map((r) => ({ chain: r!.chain as ChainId, level: Math.max(1, Math.min(8, num(r!.level, 1, 1))) })),
      coins: num(ob.coins, 20),
    });
  }
  s.orders = orders;
}

// 도감 발견 기록: 아는 체인의 1~8 정수만. 없으면 빈 기록 (불러온 뒤 tidyLoaded가 보드·보관함으로 채움)
export function restoreCodexSeen(raw: unknown): GameState["codexSeen"] {
  const o = asObj(raw);
  const out: GameState["codexSeen"] = {};
  if (!o) return out;
  for (const [k, v] of Object.entries(o)) if (isChain(k) && typeof v === "number" && v >= 1) out[k as ChainId] = Math.min(CHAINS[k as ChainId].items.length, Math.floor(v));
  return out;
}

export function regenerateComboOrders(s: GameState, ctx: Ctx): void {
  s.orders = s.orders.map((o, i) => (o.reqs.some((r) => r.chain === "combo") ? createOrder(s, ctx, i) : o));
}

export function restoreHoliday(s: GameState, raw: unknown): void {
  const h = asObj(raw);
  if (!h) return;
  if (typeof h.activeHolidayId === "string") s.holiday.activeHolidayId = getHolidayConfig(h.activeHolidayId).id;
  if (Array.isArray(h.board) && h.board.length === EVENT_CELLS) {
    const maxLv = getHolidayConfig(s.holiday.activeHolidayId).items.length;
    s.holiday.board = h.board.map((c, i): EventItem | null => {
      const o = asObj(c);
      if (!o) return null;
      return { uid: typeof o.uid === "string" ? o.uid : `ev_${i}`, isGenerator: !!o.isGenerator, level: Math.max(1, Math.min(maxLv, num(o.level, 1, 1))) };
    });
  }
  s.holiday.targetLv = Math.max(3, Math.min(5, num(h.targetLv, 3)));
  s.holiday.freeSpawns = num(h.freeSpawns, s.holiday.freeSpawns);
  s.holiday.completedCount = num(h.completedCount, 0);
}

export function restoreRooms(s: GameState, raw: unknown): void {
  const r = asObj(raw);
  if (!r) return;
  for (const e of ALL_SPOTS_IN_ORDER) {
    const v = asObj(r[e.spot.id]);
    if (v) s.rooms[e.spot.id] = { done: !!v.done, styleIdx: Math.min(2, num(v.styleIdx, 0)) };
  }
}

// 오프라인 경과 시간 동안 번개 자동 충전 (ENERGY_REGEN_SEC당 +1, 100까지)
export function applyOfflineEnergy(s: GameState, updatedAt: number, now: number): void {
  const elapsed = Math.max(0, Math.floor((now - (updatedAt || now)) / 1000));
  if (s.energy >= NATURAL_ENERGY_CAP) {
    s.energyCountdown = ENERGY_REGEN_SEC;
    return;
  }
  if (elapsed <= 0) return;
  if (elapsed >= s.energyCountdown) {
    const rest = elapsed - s.energyCountdown;
    const recovered = 1 + Math.floor(rest / ENERGY_REGEN_SEC);
    s.energy = Math.min(NATURAL_ENERGY_CAP, s.energy + recovered);
    s.energyCountdown = s.energy >= NATURAL_ENERGY_CAP ? ENERGY_REGEN_SEC : ENERGY_REGEN_SEC - (rest % ENERGY_REGEN_SEC);
  } else {
    s.energyCountdown = Math.max(1, s.energyCountdown - elapsed);
  }
}

export function fixCurrentTheme(s: GameState, raw: unknown): void {
  const zp = getZoneProgress(s);
  const want = typeof raw === "string" && (ZONE_ORDER as string[]).includes(raw) ? (raw as ZoneKey) : zp.currentZoneKey;
  s.currentThemeKey = zp.accessibleKeys.includes(want) ? want : zp.currentZoneKey;
}

// 새로 만들 uid("u숫자")가 기존 uid와 겹치지 않게 순번을 맞춘다
export function fixUidSeq(s: GameState, raw: unknown): void {
  let max = num(raw, 0);
  const scan = (uid: string) => {
    const m = /^u(\d+)$/.exec(uid);
    if (m) max = Math.max(max, Number(m[1]));
  };
  s.board.forEach((c) => c && scan(c.uid));
  s.bag.forEach((c) => scan(c.uid));
  s.holiday.board.forEach((c) => c && scan(c.uid));
  s.orders.forEach((o) => scan(o.id));
  s.uidSeq = max;
}

export function newGame(ctx: Ctx): GameState {
  const s = createInitialState(ctx);
  initCustomerOrders(s, ctx);
  initHolidayBoard(s, ctx);
  return s;
}

function restoreV4(data: Raw, updatedAt: number, now: number, ctx: Ctx): { s: GameState; granted: GenChain[] } {
  const s = newGame(ctx);
  s.playerLv = num(data.playerLv, 1, 1);
  s.xp = num(data.xp, 0);
  s.coins = num(data.coins, s.coins);
  s.gems = num(data.gems, s.gems);
  s.energy = num(data.energy, s.energy);
  const cd = num(data.energyCountdown, ENERGY_REGEN_SEC, 1);
  s.energyCountdown = cd <= ENERGY_REGEN_SEC ? cd : ENERGY_REGEN_SEC;
  applyOfflineEnergy(s, updatedAt, now);
  restoreBoard(s, data.board, now);
  restoreBag(s, data.bag, now);
  restoreOrders(s, data.orders);
  restoreHoliday(s, data.holiday);
  restoreRooms(s, data.rooms);
  s.boostMultiplier = sanitizeBoost(data.boostMultiplier);
  const st = asObj(data.settings);
  s.settings = { sound: st?.sound !== false, reduceMotion: st?.reduceMotion === true };
  s.lastSeenVersion = typeof data.lastSeenVersion === "string" ? data.lastSeenVersion : null;
  s.cauldronPartGranted = data.cauldronPartGranted !== false;
  s.codexSeen = restoreCodexSeen(data.codexSeen);
  fixCurrentTheme(s, data.currentThemeKey);
  fixUidSeq(s, data.uidSeq);
  dedupeUids(s);
  const granted = ensureGenerators(s);
  regenerateComboOrders(s, ctx);
  return { s, granted };
}

// granted: 불러오면서 새로 받은 레벨 해금 생성기 체인 (화면이 안내)
// tidy (v3.9): ★3가 있는 체인의 남는 생성기를 걷고 코인으로 돌려준 내역, 만들 수 없게 된 주문 요구를 바꾼 수
export interface LoadTidy {
  trimmed: Array<{ chain: GenChain; count: number; coins: number }>;
  adjusted: number;
  absorbed: number; // ★1이 없는 체인의 짝 없는 Lv.1을 흡수한 수 (코인은 이미 지급)
}
export function restoreState(
  record: SaveRecord | null,
  now: number,
  ctx: Ctx,
): { state: GameState; report: MigrationReport | null; isNew: boolean; granted: GenChain[]; tidy: LoadTidy } {
  const data = asObj(record?.data);
  if (!record || !data) return { state: newGame(ctx), report: null, isNew: true, granted: [], tidy: { trimmed: [], adjusted: 0, absorbed: 0 } };
  const updatedAt = num(record.updatedAt, now);
  if (num(record.schemaVersion, 0) < 4) {
    const { state, report } = migrateV2ToV4(data, updatedAt, now, ctx);
    return { state, report, isNew: false, granted: [], tidy: tidyLoaded(state) };
  }
  const { s, granted } = restoreV4(data, updatedAt, now, ctx);
  return { state: s, report: null, isNew: false, granted, tidy: tidyLoaded(s) };
}

// 남는 생성기 정리 → 그 뒤 생성기 기준으로 주문 맞추기 (정리로 ★1이 사라질 수 있으므로 이 순서)
function tidyLoaded(s: GameState): LoadTidy {
  sweepCodex(s);
  const trimmed = trimSurplusGenerators(s, []);
  // ★1 생성기가 없는 체인(정리로 사라졌거나 예전 세이브)의 Lv.1은 더 짝을 만들 수 없음 → 진화 때처럼 흡수 (열린 주문 몫은 남김)
  const ev: GameEvent[] = [];
  const chains = new Set([...s.board, ...s.bag].filter((it) => it?.isGenerator).map((it) => it!.chain));
  for (const c of chains) absorbOrphans(s, ev, c, -1);
  const absorbed = ev.reduce((n, e) => (e.type === "absorbed" ? n + e.cells.length + e.bag : n), 0);
  return { trimmed, adjusted: fitOrdersToGenerators(s), absorbed };
}

export function hasReportContent(r: MigrationReport | null): boolean {
  return !!r && (r.energyTrimmed > 0 || r.comboRemoved > 0 || r.zonesBackfilled.length > 0 || r.freeSpawnsTrimmed || r.coinsFromStars > 0);
}
